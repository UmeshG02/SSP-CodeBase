import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { RecordViolationDto } from './dto/record-violation.dto';
import { AutoSaveDto } from './dto/auto-save.dto';
import { AdminUnlockDto, AdminExtendLockDto, AdminReduceLockDto, AdminResetViolationsDto, AdminIgnoreViolationDto, AdminBanUserDto, AdminUpdateSecurityConfigDto } from './dto/admin-security-action.dto';
import { ChallengeType } from '@prisma/client';

@Injectable()
export class SecureAssessmentService {
  constructor(private prisma: PrismaService) {}

  private async logSecurityEvent(userId: string, action: string, details?: any, req?: any) {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          action,
          details: details ? JSON.stringify(details) : null,
          ipAddress: req?.ip || null,
          userAgent: req?.headers?.['user-agent'] || null,
        }
      });
    } catch (e) {
      console.error('Failed to log security event:', e);
    }
  }

  private async logAdminAudit(admin: any, action: string, details: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action,
          details: JSON.stringify(details),
        }
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }

  async startAssessment(userId: string, dto: StartAssessmentDto, req?: any) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId }
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const existingActive = await this.prisma.assessmentSession.findFirst({
      where: { userId, problemId: dto.problemId, status: 'ACTIVE' }
    });
    if (existingActive) {
      return existingActive;
    }

    let examConfig = await this.prisma.examConfig.findFirst();
    if (!examConfig) {
      examConfig = await this.prisma.examConfig.create({ data: {} });
    }

    const session = await this.prisma.assessmentSession.create({
      data: {
        userId,
        problemId: dto.problemId,
        status: 'ACTIVE',
        maxViolations: dto.maxViolations ?? examConfig.maxViolations,
        lockDuration: dto.lockDuration ?? examConfig.lockDurationMinutes,
        totalQuestions: dto.totalQuestions ?? 1,
        currentCode: dto.currentCode ?? null,
        currentLanguage: dto.currentLanguage ?? null,
      }
    });

    await this.logSecurityEvent(userId, 'ASSESSMENT_STARTED', {
      sessionId: session.id,
      problemId: dto.problemId,
      problemTitle: problem.title,
    }, req);

    return session;
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        violationLogs: { orderBy: { createdAt: 'desc' } },
        lockHistory: { orderBy: { lockedAt: 'desc' } },
        autoSaves: { orderBy: { createdAt: 'desc' }, take: 1 },
      }
    });
    if (!session) throw new NotFoundException('Assessment session not found');
    return session;
  }

  async getActiveSession(userId: string, problemId: string) {
    const session = await this.prisma.assessmentSession.findFirst({
      where: { userId, problemId, status: 'ACTIVE' },
      include: {
        violationLogs: { orderBy: { createdAt: 'desc' } },
        autoSaves: { orderBy: { createdAt: 'desc' }, take: 1 },
      }
    });
    return session;
  }

  async recordViolation(userId: string, dto: RecordViolationDto, req?: any) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: dto.sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');
    if (session.status === 'LOCKED' || session.status === 'COMPLETED') {
      throw new BadRequestException('Assessment is already locked or completed');
    }

    const violation = await this.prisma.violationLog.create({
      data: {
        userId,
        problemId: dto.problemId,
        sessionId: dto.sessionId,
        violationType: dto.violationType,
        details: dto.details,
        totalCount: dto.totalCount,
        browser: dto.browser,
        os: dto.os,
        ipAddress: dto.ipAddress,
        assessmentDuration: dto.assessmentDuration,
        remainingTime: dto.remainingTime,
        lockStatus: dto.lockStatus,
        module: dto.module,
        day: dto.day,
        questionNumber: dto.questionNumber,
      }
    });

    await this.prisma.assessmentSession.update({
      where: { id: dto.sessionId },
      data: { violationCount: dto.totalCount }
    });

    await this.logSecurityEvent(userId, 'VIOLATION_RECORDED', {
      sessionId: dto.sessionId,
      violationType: dto.violationType,
      totalCount: dto.totalCount,
      maxViolations: session.maxViolations,
    }, req);

    const maxV = session.maxViolations;

    if (dto.totalCount >= maxV) {
      await this.lockAssessment(userId, dto.sessionId, dto.problemId, req);
      return { violation, locked: true, maxViolations: maxV };
    }

    return { violation, locked: false, maxViolations: maxV, remainingWarnings: maxV - dto.totalCount };
  }

  async autoSave(userId: string, dto: AutoSaveDto) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: dto.sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');

    const save = await this.prisma.autoSave.create({
      data: {
        sessionId: dto.sessionId,
        code: dto.code,
        language: dto.language ?? null,
        questionNumber: dto.questionNumber ?? null,
        questionType: dto.questionType ?? null,
        metadata: dto.metadata ?? null,
      }
    });

    await this.prisma.assessmentSession.update({
      where: { id: dto.sessionId },
      data: {
        currentCode: dto.code,
        currentLanguage: dto.language ?? session.currentLanguage,
        currentQuestion: dto.questionNumber ?? session.currentQuestion,
      }
    });

    return save;
  }

  async getAutoSaves(sessionId: string) {
    return this.prisma.autoSave.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async lockAssessment(userId: string, sessionId: string, problemId: string, req?: any) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');

    const now = new Date();
    const unlocksAt = new Date(now.getTime() + session.lockDuration * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: 'LOCKED',
          lockedAt: now,
          unlocksAt,
          endTime: now,
        }
      }),
      this.prisma.lockHistory.create({
        data: {
          sessionId,
          lockedAt: now,
          scheduledUnlockAt: unlocksAt,
          duration: session.lockDuration,
          createdBy: 'SYSTEM',
        }
      }),
    ]);

    await this.logSecurityEvent(userId, 'ASSESSMENT_LOCKED', {
      sessionId,
      problemId,
      lockDuration: session.lockDuration,
      unlocksAt: unlocksAt.toISOString(),
      reason: 'Maximum violations reached',
    }, req);

    return { locked: true, unlocksAt, lockDurationMinutes: session.lockDuration };
  }

  async getRemainingLockTime(sessionId: string) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');
    if (session.status !== 'LOCKED') {
      return { locked: false, remainingSeconds: 0 };
    }

    const now = new Date();
    if (!session.unlocksAt || now >= session.unlocksAt) {
      return { locked: false, remainingSeconds: 0, expired: true };
    }

    const remainingSeconds = Math.floor((session.unlocksAt.getTime() - now.getTime()) / 1000);
    return {
      locked: true,
      remainingSeconds,
      unlocksAt: session.unlocksAt,
      lockDurationMinutes: session.lockDuration,
      lockedAt: session.lockedAt,
    };
  }

  async resumeAssessment(userId: string, sessionId: string) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        autoSaves: { orderBy: { createdAt: 'desc' }, take: 1 },
      }
    });
    if (!session) throw new NotFoundException('Assessment session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your assessment');

    if (session.status === 'LOCKED') {
      const now = new Date();
      if (session.unlocksAt && now < session.unlocksAt) {
        const remaining = Math.floor((session.unlocksAt.getTime() - now.getTime()) / 1000);
        throw new BadRequestException(`Assessment is locked. Remaining lock time: ${remaining} seconds`);
      }

      await this.prisma.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: 'ACTIVE',
          lockedAt: null,
          unlocksAt: null,
        }
      });

      await this.prisma.lockHistory.updateMany({
        where: { sessionId, unlockedAt: null },
        data: { unlockedAt: new Date(), unlockReason: 'TIMEOUT' }
      });

      await this.logSecurityEvent(userId, 'ASSESSMENT_UNLOCKED', {
        sessionId,
        reason: 'Lock period expired',
      });
    }

    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Assessment has already been completed');
    }

    const violationLogs = await this.prisma.violationLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      session: {
        ...session,
        status: 'ACTIVE',
      },
      lastSave: session.autoSaves[0] || null,
      violationLogs,
      violationCount: session.violationCount,
    };
  }

  async submitAssessment(userId: string, sessionId: string, req?: any) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your assessment');

    const now = new Date();
    const timeSpent = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    await this.prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'SUBMITTED',
        endTime: now,
        timeSpent,
      }
    });

    await this.logSecurityEvent(userId, 'ASSESSMENT_SUBMITTED', {
      sessionId,
      timeSpent,
    }, req);

    return { submitted: true, sessionId, timeSpent };
  }

  async getSecurityConfig() {
    let config = await this.prisma.examConfig.findFirst();
    if (!config) {
      config = await this.prisma.examConfig.create({ data: {} });
    }
    return config;
  }

  async updateSecurityConfig(dto: AdminUpdateSecurityConfigDto) {
    let config = await this.prisma.examConfig.findFirst();
    if (!config) {
      return this.prisma.examConfig.create({ data: dto as any });
    }
    return this.prisma.examConfig.update({
      where: { id: config.id },
      data: dto as any,
    });
  }

  async getCurrentViolations(sessionId: string) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      select: { violationCount: true, maxViolations: true, status: true }
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  // Admin operations
  async adminUnlockAssessment(admin: any, dto: AdminUnlockDto) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: dto.sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');

    await this.prisma.assessmentSession.update({
      where: { id: dto.sessionId },
      data: { status: 'ACTIVE', lockedAt: null, unlocksAt: null }
    });

    await this.prisma.lockHistory.updateMany({
      where: { sessionId: dto.sessionId, unlockedAt: null },
      data: { unlockedAt: new Date(), unlockReason: 'ADMIN_OVERRIDE' }
    });

    await this.logAdminAudit(admin, 'ADMIN_UNLOCK_ASSESSMENT', {
      sessionId: dto.sessionId,
      userId: session.userId,
    });

    await this.logSecurityEvent(session.userId, 'ADMIN_UNLOCKED', {
      sessionId: dto.sessionId,
      adminId: admin.id,
    });

    return { unlocked: true, sessionId: dto.sessionId };
  }

  async adminExtendLockDuration(admin: any, dto: AdminExtendLockDto) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: dto.sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');

    const newDuration = session.lockDuration + dto.extraMinutes;
    const newUnlocksAt = session.unlocksAt
      ? new Date(session.unlocksAt.getTime() + dto.extraMinutes * 60 * 1000)
      : new Date(Date.now() + newDuration * 60 * 1000);

    await this.prisma.assessmentSession.update({
      where: { id: dto.sessionId },
      data: { lockDuration: newDuration, unlocksAt: newUnlocksAt }
    });

    await this.logAdminAudit(admin, 'ADMIN_EXTEND_LOCK', {
      sessionId: dto.sessionId,
      extraMinutes: dto.extraMinutes,
      newDuration,
    });

    return { extended: true, newDuration, newUnlocksAt };
  }

  async adminReduceLockDuration(admin: any, dto: AdminReduceLockDto) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: dto.sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');

    const newDuration = Math.max(0, session.lockDuration - dto.reduceMinutes);
    const newUnlocksAt = session.unlocksAt
      ? new Date(session.unlocksAt.getTime() - dto.reduceMinutes * 60 * 1000)
      : null;

    await this.prisma.assessmentSession.update({
      where: { id: dto.sessionId },
      data: { lockDuration: newDuration, unlocksAt: newUnlocksAt }
    });

    if (newDuration <= 0 || (newUnlocksAt && newUnlocksAt <= new Date())) {
      return this.adminUnlockAssessment(admin, { sessionId: dto.sessionId });
    }

    await this.logAdminAudit(admin, 'ADMIN_REDUCE_LOCK', {
      sessionId: dto.sessionId,
      reduceMinutes: dto.reduceMinutes,
      newDuration,
    });

    return { reduced: true, newDuration, newUnlocksAt };
  }

  async adminResetViolations(admin: any, dto: AdminResetViolationsDto) {
    const session = await this.prisma.assessmentSession.findUnique({
      where: { id: dto.sessionId }
    });
    if (!session) throw new NotFoundException('Assessment session not found');

    await this.prisma.assessmentSession.update({
      where: { id: dto.sessionId },
      data: { violationCount: 0 }
    });

    await this.logAdminAudit(admin, 'ADMIN_RESET_VIOLATIONS', {
      sessionId: dto.sessionId,
      userId: session.userId,
    });

    return { reset: true, sessionId: dto.sessionId };
  }

  async adminIgnoreViolation(admin: any, dto: AdminIgnoreViolationDto) {
    const violation = await this.prisma.violationLog.findUnique({
      where: { id: dto.violationId }
    });
    if (!violation) throw new NotFoundException('Violation not found');

    await this.logAdminAudit(admin, 'ADMIN_IGNORE_VIOLATION', {
      violationId: dto.violationId,
      violationType: violation.violationType,
    });

    return { ignored: true, violationId: dto.violationId };
  }

  // Security Reports
  async getSecurityDashboard() {
    const totalViolations = await this.prisma.violationLog.count();
    const lockedAssessments = await this.prisma.assessmentSession.count({
      where: { status: 'LOCKED' }
    });
    const currentlyLockedUsers = await this.prisma.assessmentSession.count({
      where: {
        status: 'LOCKED',
        unlocksAt: { gt: new Date() }
      }
    });

    const violationTypeCounts = await this.prisma.violationLog.groupBy({
      by: ['violationType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const mostCommonViolations = violationTypeCounts.map(v => ({
      type: v.violationType,
      count: v._count.id,
    }));

    const repeatOffenders = await this.prisma.violationLog.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const offenderDetails = await Promise.all(
      repeatOffenders.map(async (o) => {
        const user = await this.prisma.user.findUnique({
          where: { id: o.userId },
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true } }
          }
        });
        return { user, violationCount: o._count.id };
      })
    );

    const recentViolations = await this.prisma.violationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, email: true, profile: { select: { name: true, username: true } } } },
        problem: { select: { id: true, title: true } },
      }
    });

    const activeSessions = await this.prisma.assessmentSession.count({
      where: { status: 'ACTIVE' }
    });

    const totalSessions = await this.prisma.assessmentSession.count();

    const violationsToday = await this.prisma.violationLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    return {
      totalViolations,
      lockedAssessments,
      currentlyLockedUsers,
      activeSessions,
      totalSessions,
      violationsToday,
      mostCommonViolations,
      repeatOffenders: offenderDetails,
      recentViolations,
    };
  }

  async getViolationLogs(page: number = 1, limit: number = 50, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { profile: { name: { contains: search, mode: 'insensitive' } } } },
        { violationType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.violationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, email: true, profile: { select: { name: true, username: true } } } },
          problem: { select: { id: true, title: true } },
          session: { select: { id: true, status: true, lockDuration: true } },
        }
      }),
      this.prisma.violationLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLockedAssessments() {
    return this.prisma.assessmentSession.findMany({
      where: {
        status: 'LOCKED',
      },
      orderBy: { lockedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, profile: { select: { name: true, username: true } } } },
        problem: { select: { id: true, title: true, slug: true } },
        lockHistory: { orderBy: { lockedAt: 'desc' }, take: 1 },
      }
    });
  }

  async exportViolationLogs(format: 'json' | 'csv' = 'json') {
    const logs = await this.prisma.violationLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, profile: { select: { name: true, username: true } } } },
        problem: { select: { title: true, slug: true } },
      }
    });

    if (format === 'csv') {
      const header = 'User,Username,Email,Problem,Violation Type,Details,Count,Browser,OS,Date,Time,IP Address\n';
      const rows = logs.map(l => {
        const date = l.createdAt.toISOString().split('T')[0];
        const time = l.createdAt.toISOString().split('T')[1]?.split('.')[0];
        return `"${l.user?.profile?.name || ''}","${l.user?.profile?.username || ''}","${l.user?.email || ''}","${l.problem?.title || ''}","${l.violationType}","${(l.details || '').replace(/"/g, '""')}",${l.totalCount},"${l.browser}","${l.os}","${date}","${time}","${l.ipAddress || ''}"`;
      }).join('\n');
      return header + rows;
    }

    return logs.map(l => ({
      userName: l.user?.profile?.name || '',
      username: l.user?.profile?.username || '',
      email: l.user?.email || '',
      problem: l.problem?.title || '',
      violationType: l.violationType,
      details: l.details,
      count: l.totalCount,
      browser: l.browser,
      os: l.os,
      date: l.createdAt.toISOString().split('T')[0],
      time: l.createdAt.toISOString().split('T')[1]?.split('.')[0],
      ipAddress: l.ipAddress,
    }));
  }

  async getSecurityAuditLogs(page: number = 1, limit: number = 50) {
    const [logs, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, email: true, profile: { select: { name: true, username: true } } } },
        }
      }),
      this.prisma.securityEvent.count(),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAssessmentStatus(userId: string) {
    const activeSessions = await this.prisma.assessmentSession.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'LOCKED'] },
      },
      include: {
        problem: { select: { id: true, title: true, slug: true, type: true } },
        violationLogs: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { startTime: 'desc' },
    });

    return activeSessions.map(s => {
      const now = new Date();
      const remainingLockSeconds = s.status === 'LOCKED' && s.unlocksAt
        ? Math.max(0, Math.floor((s.unlocksAt.getTime() - now.getTime()) / 1000))
        : 0;

      return {
        id: s.id,
        problem: s.problem,
        status: s.status,
        violationCount: s.violationCount,
        maxViolations: s.maxViolations,
        remainingLockSeconds,
        isLocked: s.status === 'LOCKED' && remainingLockSeconds > 0,
        timeSpent: s.timeSpent,
        startTime: s.startTime,
        currentQuestion: s.currentQuestion,
        totalQuestions: s.totalQuestions,
        recentViolations: s.violationLogs,
      };
    });
  }
}

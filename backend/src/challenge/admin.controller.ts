import { 
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, 
  Query, BadRequestException, NotFoundException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChallengeService } from './challenge.service';
import { ProfileService } from '../profile/profile.service';
import { Role, Difficulty, ChallengeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private challengeService: ChallengeService,
    private profileService: ProfileService,
  ) {}

  // Helper to log administrative actions
  private async logAction(admin: any, action: string, details: any) {
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

  // 1. Dashboard Statistics
  @Get('stats')
  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count({ where: { role: Role.USER } });
    const totalAdmins = await this.prisma.user.count({ where: { role: { not: Role.USER } } });
    
    // Active Streak count (users active within 24 hours)
    const activeStreakCount = await this.prisma.streak.count({
      where: {
        lastActive: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const totalProblems = await this.prisma.problem.count();
    const easyProblems = await this.prisma.problem.count({ where: { difficulty: Difficulty.EASY } });
    const mediumProblems = await this.prisma.problem.count({ where: { difficulty: Difficulty.MEDIUM } });
    const hardProblems = await this.prisma.problem.count({ where: { difficulty: Difficulty.HARD } });

    // Submissions today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const submissionsToday = await this.prisma.submission.count({
      where: { createdAt: { gte: startOfToday } }
    });

    const acceptedToday = await this.prisma.submission.count({
      where: {
        status: 'ACCEPTED',
        createdAt: { gte: startOfToday }
      }
    });

    const totalSubmissions = await this.prisma.submission.count();

    // Average user stats
    const avgXp = await this.prisma.profile.aggregate({
      _avg: { xp: true }
    });

    // Modules/Weeks count
    const totalModules = await this.prisma.week.count();

    // Top performers (by XP)
    const topPerformers = await this.prisma.profile.findMany({
      orderBy: { xp: 'desc' },
      take: 5,
      include: {
        user: { select: { email: true } }
      }
    });

    // Recent activity (last 500 submissions)
    const recentActivity = await this.prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: {
          select: {
            profile: { select: { name: true, username: true } }
          }
        },
        problem: { select: { title: true } }
      }
    });

    // Support Requests PENDING
    const pendingSupport = await this.prisma.supportRequest.count({
      where: { status: 'PENDING' }
    });

    return {
      totalUsers,
      totalAdmins,
      activeUsersToday: activeStreakCount,
      totalProblems,
      problemsSolvedToday: acceptedToday,
      totalSubmissions,
      submissionsToday,
      averageXp: Math.round(avgXp._avg.xp || 0),
      totalModules,
      difficultyDistribution: {
        easy: easyProblems,
        medium: mediumProblems,
        hard: hardProblems
      },
      topPerformers: topPerformers.map(p => ({
        name: p.name,
        username: p.username,
        xp: p.xp,
        level: p.level,
        email: p.user.email
      })),
      recentActivity: recentActivity.map(s => ({
        id: s.id,
        user: s.user?.profile?.name || 'User',
        problem: s.problem?.title || 'Unknown Problem',
        status: s.status,
        language: s.language,
        createdAt: s.createdAt
      })),
      pendingSupport
    };
  }

  // 2. User CRUD Management
  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const where: any = {};
    if (role) {
      where.role = role as Role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { name: { contains: search, mode: 'insensitive' } } },
        { profile: { username: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        profile: true,
        streaks: true,
        learningProgress: true,
        _count: { select: { submissions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      profile: u.profile,
      streak: u.streaks?.currentStreak || 0,
      longestStreak: u.streaks?.longestStreak || 0,
      submissionsCount: u._count.submissions,
      currentModule: u.learningProgress[0]?.currentWeek || 1,
      currentDay: u.learningProgress[0]?.currentDay || 1,
      unlockedWeeks: u.learningProgress[0]?.unlockedWeeks || []
    }));
  }

  @Post('users')
  async createUser(@CurrentUser() admin: any, @Body() body: any) {
    const { email, password, name, username, role, college, company } = body;
    if (!email || !password || !name || !username) {
      throw new BadRequestException('Missing credentials or profile name');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: (role || Role.USER) as Role,
        profile: {
          create: {
            name,
            username,
            college,
            company,
            expLevel: 'Beginner'
          }
        },
        streaks: { create: {} }
      },
      include: { profile: true }
    });

    await this.logAction(admin, 'USER_CREATE', { userId: user.id, email: user.email, role: user.role });
    return user;
  }

  @Put('users/:id')
  async updateUser(@CurrentUser() admin: any, @Param('id') id: string, @Body() body: any) {
    const { name, college, company, role, expLevel } = body;
    
    if (admin.id === id && role && role !== admin.role) {
      throw new BadRequestException('You cannot modify your own administrative role to prevent self-lockout.');
    }
    
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        role: role as Role,
        profile: {
          update: {
            name,
            college,
            company,
            expLevel
          }
        }
      },
      include: { profile: true }
    });

    await this.logAction(admin, 'USER_UPDATE', { userId: user.id, role: user.role, updates: body });
    return user;
  }

  @Delete('users/:id')
  async deleteUser(@CurrentUser() admin: any, @Param('id') id: string) {
    if (admin.id === id) {
      throw new BadRequestException('You cannot delete your own administrative account.');
    }

    const user = await this.prisma.user.delete({
      where: { id }
    });

    await this.logAction(admin, 'USER_DELETE', { userId: id, email: user.email });
    return { success: true };
  }

  @Post('users/:id/reset-password')
  async resetPassword(@CurrentUser() admin: any, @Param('id') id: string, @Body('password') password?: string) {
    const tempPassword = password || Math.random().toString(36).substring(2, 10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    await this.logAction(admin, 'USER_PASSWORD_RESET', { userId: id });
    return { success: true, tempPassword };
  }

  // 3. Progress Management Overrides
  @Post('users/:id/grant-xp')
  async grantXp(@CurrentUser() admin: any, @Param('id') id: string, @Body('amount') amount: number) {
    if (!amount) throw new BadRequestException('Amount required');
    
    await this.profileService.awardXpAndCoins(id, amount, 0, `ADMIN_GRANT_${admin.email}`);
    await this.logAction(admin, 'GRANT_XP', { userId: id, amount });
    return { success: true };
  }

  @Post('users/:id/grant-coins')
  async grantCoins(@CurrentUser() admin: any, @Param('id') id: string, @Body('amount') amount: number) {
    if (!amount) throw new BadRequestException('Amount required');
    
    await this.profileService.awardXpAndCoins(id, 0, amount, `ADMIN_GRANT_${admin.email}`);
    await this.logAction(admin, 'GRANT_COINS', { userId: id, amount });
    return { success: true };
  }

  @Post('users/:id/reset-streak')
  async resetStreak(@CurrentUser() admin: any, @Param('id') id: string) {
    await this.prisma.streak.update({
      where: { userId: id },
      data: {
        currentStreak: 0,
        longestStreak: 0
      }
    });

    await this.logAction(admin, 'RESET_STREAK', { userId: id });
    return { success: true };
  }

  @Post('users/:id/award-badge')
  async awardBadge(@CurrentUser() admin: any, @Param('id') id: string, @Body('badgeName') badgeName: string) {
    if (!badgeName) throw new BadRequestException('Badge name required');

    let badge = await this.prisma.badge.findUnique({ where: { name: badgeName } });
    if (!badge) {
      // Auto seed if doesn't exist
      badge = await this.prisma.badge.create({
        data: {
          name: badgeName,
          description: 'Awarded manually by Platform Admin.',
          imageUrl: '🏆'
        }
      });
    }

    const userBadge = await this.prisma.userBadge.create({
      data: {
        userId: id,
        badgeId: badge.id
      }
    });

    await this.logAction(admin, 'AWARD_BADGE', { userId: id, badgeName });
    return userBadge;
  }

  @Post('users/:id/unlock-module')
  async unlockModule(@CurrentUser() admin: any, @Param('id') id: string, @Body('moduleNumber') moduleNumber: number) {
    if (!moduleNumber) throw new BadRequestException('Module number required');

    // Fetch the LearningPath (Python default)
    const path = await this.prisma.learningPath.findUnique({
      where: { slug: 'python-programming-journey' }
    });
    if (!path) throw new NotFoundException('Python learning path not found');

    const weekRecord = await this.prisma.week.findFirst({
      where: { pathId: path.id, weekNumber: moduleNumber },
      include: { days: true }
    });

    if (!weekRecord) throw new NotFoundException(`Module ${moduleNumber} not found`);

    // Force user progress week
    await this.prisma.userProgress.upsert({
      where: { userId_pathId: { userId: id, pathId: path.id } },
      update: { currentWeek: moduleNumber, currentDay: 1 },
      create: { userId: id, pathId: path.id, currentWeek: moduleNumber, currentDay: 1 }
    });

    // Mark previous modules days completed
    const prevWeeks = await this.prisma.week.findMany({
      where: { pathId: path.id, weekNumber: { lt: moduleNumber } },
      include: { days: true }
    });

    for (const w of prevWeeks) {
      for (const d of w.days) {
        await this.prisma.userDayProgress.upsert({
          where: { userId_dayId: { userId: id, dayId: d.id } },
          update: { completed: true },
          create: { userId: id, dayId: d.id, completed: true }
        });
      }
    }

    await this.logAction(admin, 'UNLOCK_MODULE', { userId: id, moduleNumber });
    return { success: true };
  }

  @Post('users/:id/lock-module')
  async lockModule(@CurrentUser() admin: any, @Param('id') id: string, @Body('moduleNumber') moduleNumber: number) {
    if (!moduleNumber) throw new BadRequestException('Module number required');

    const path = await this.prisma.learningPath.findUnique({
      where: { slug: 'python-programming-journey' }
    });
    if (!path) throw new NotFoundException('Python path not found');

    // Reset current progression
    await this.prisma.userProgress.upsert({
      where: { userId_pathId: { userId: id, pathId: path.id } },
      update: { currentWeek: Math.max(1, moduleNumber - 1), currentDay: 1 },
      create: { userId: id, pathId: path.id, currentWeek: Math.max(1, moduleNumber - 1), currentDay: 1 }
    });

    // Clear completions from moduleNumber and above
    const weeksToLock = await this.prisma.week.findMany({
      where: { pathId: path.id, weekNumber: { gte: moduleNumber } },
      include: { days: true }
    });

    for (const w of weeksToLock) {
      for (const d of w.days) {
        await this.prisma.userDayProgress.deleteMany({
          where: { userId: id, dayId: d.id }
        });
      }
    }

    await this.logAction(admin, 'LOCK_MODULE', { userId: id, moduleNumber });
    return { success: true };
  }

  @Post('users/:id/grant-module-access')
  async grantModuleAccess(@CurrentUser() admin: any, @Param('id') id: string, @Body('moduleNumber') moduleNumber: number) {
    if (!moduleNumber) throw new BadRequestException('Module number required');

    const path = await this.prisma.learningPath.findUnique({
      where: { slug: 'python-programming-journey' }
    });
    if (!path) throw new NotFoundException('Python path not found');

    let userProgress = await this.prisma.userProgress.findUnique({
      where: { userId_pathId: { userId: id, pathId: path.id } }
    });

    if (!userProgress) {
      userProgress = await this.prisma.userProgress.create({
        data: {
          userId: id,
          pathId: path.id,
          currentWeek: 1,
          currentDay: 1,
          unlockedWeeks: [moduleNumber]
        }
      });
    } else {
      if (!userProgress.unlockedWeeks.includes(moduleNumber)) {
        const updated = [...userProgress.unlockedWeeks, moduleNumber];
        await this.prisma.userProgress.update({
          where: { id: userProgress.id },
          data: { unlockedWeeks: updated }
        });
      }
    }

    await this.logAction(admin, 'GRANT_MODULE_ACCESS', { userId: id, moduleNumber });
    return { success: true };
  }

  @Post('users/:id/revoke-module-access')
  async revokeModuleAccess(@CurrentUser() admin: any, @Param('id') id: string, @Body('moduleNumber') moduleNumber: number) {
    if (!moduleNumber) throw new BadRequestException('Module number required');

    const path = await this.prisma.learningPath.findUnique({
      where: { slug: 'python-programming-journey' }
    });
    if (!path) throw new NotFoundException('Python path not found');

    const userProgress = await this.prisma.userProgress.findUnique({
      where: { userId_pathId: { userId: id, pathId: path.id } }
    });

    if (userProgress) {
      const updated = userProgress.unlockedWeeks.filter(m => m !== moduleNumber);
      await this.prisma.userProgress.update({
        where: { id: userProgress.id },
        data: { unlockedWeeks: updated }
      });
    }

    await this.logAction(admin, 'REVOKE_MODULE_ACCESS', { userId: id, moduleNumber });
    return { success: true };
  }

  // 4. Learning Content Management (Problems/Challenges)
  @Get('problems')
  async getProblems() {
    return this.prisma.problem.findMany({
      include: { testCases: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('problems')
  async createProblem(@CurrentUser() admin: any, @Body() body: any) {
    const { title, slug, description, difficulty, type, points, tags, inputFormat, outputFormat, constraints, solutionCode, templateCode } = body;
    if (!title || !slug || !description) {
      throw new BadRequestException('Title, slug and description are required');
    }

    const problem = await this.prisma.problem.create({
      data: {
        title,
        slug,
        description,
        difficulty: (difficulty || Difficulty.EASY) as Difficulty,
        type: (type || ChallengeType.CODING) as ChallengeType,
        points: Number(points) || 10,
        tags: tags || [],
        inputFormat,
        outputFormat,
        constraints,
        solutionCode,
        templateCode: typeof templateCode === 'string' ? templateCode : JSON.stringify(templateCode || {})
      }
    });

    await this.logAction(admin, 'PROBLEM_CREATE', { problemId: problem.id, title: problem.title });
    return problem;
  }

  @Put('problems/:id')
  async updateProblem(@CurrentUser() admin: any, @Param('id') id: string, @Body() body: any) {
    const { title, description, difficulty, type, points, tags, inputFormat, outputFormat, constraints, solutionCode, templateCode, testCases } = body;

    const problem = await this.prisma.problem.update({
      where: { id },
      data: {
        title,
        description,
        difficulty: difficulty as Difficulty,
        type: type as ChallengeType,
        points: Number(points) || 10,
        tags: tags || [],
        inputFormat,
        outputFormat,
        constraints,
        solutionCode,
        templateCode: typeof templateCode === 'string' ? templateCode : JSON.stringify(templateCode || {})
      }
    });

    // Handle test case updates if provided
    if (testCases && Array.isArray(testCases)) {
      await this.prisma.testCase.deleteMany({ where: { problemId: id } });
      for (const tc of testCases) {
        await this.prisma.testCase.create({
          data: {
            problemId: id,
            input: tc.input,
            expected: tc.expected,
            isSample: !!tc.isSample
          }
        });
      }
    }

    await this.logAction(admin, 'PROBLEM_UPDATE', { problemId: id });
    return problem;
  }

  @Delete('problems/:id')
  async deleteProblem(@CurrentUser() admin: any, @Param('id') id: string) {
    await this.prisma.problem.delete({ where: { id } });
    await this.logAction(admin, 'PROBLEM_DELETE', { problemId: id });
    return { success: true };
  }

  // 5. Announcements, Tickets & Audit Logs
  @Get('audit-logs')
  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  @Get('support')
  async getSupportRequests() {
    return this.prisma.supportRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  @Put('support/:id')
  async updateSupportRequest(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const req = await this.prisma.supportRequest.update({
      where: { id },
      data: { status }
    });

    await this.logAction(admin, 'RESOLVE_SUPPORT', { ticketId: id, status });
    return req;
  }

  @Post('announcements')
  async createAnnouncement(@CurrentUser() admin: any, @Body() body: any) {
    const { title, content } = body;
    if (!title || !content) throw new BadRequestException('Missing title or content');

    const ann = await this.prisma.announcement.create({
      data: {
        title,
        content,
        authorId: admin.id
      }
    });

    await this.logAction(admin, 'BROADCAST_ANNOUNCEMENT', { announcementId: ann.id });
    return ann;
  }
}

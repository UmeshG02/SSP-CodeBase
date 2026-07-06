import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, Headers } from '@nestjs/common';
import { SecureAssessmentService } from './secure-assessment.service';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { RecordViolationDto } from './dto/record-violation.dto';
import { AutoSaveDto } from './dto/auto-save.dto';
import { AdminUnlockDto, AdminExtendLockDto, AdminReduceLockDto, AdminResetViolationsDto, AdminIgnoreViolationDto, AdminUpdateSecurityConfigDto } from './dto/admin-security-action.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('secure-assessment')
@Controller('secure-assessment')
export class SecureAssessmentController {
  constructor(private secureService: SecureAssessmentService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a secure assessment session' })
  async startAssessment(@CurrentUser() user: any, @Body() dto: StartAssessmentDto, @Req() req: any) {
    return this.secureService.startAssessment(user.id, dto, req);
  }

  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessment session details' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.secureService.getSession(sessionId);
  }

  @Get('active/:problemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active session for a problem' })
  async getActiveSession(@CurrentUser() user: any, @Param('problemId') problemId: string) {
    return this.secureService.getActiveSession(user.id, problemId);
  }

  @Post('violation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a security violation' })
  async recordViolation(@CurrentUser() user: any, @Body() dto: RecordViolationDto, @Req() req: any) {
    return this.secureService.recordViolation(user.id, dto, req);
  }

  @Post('auto-save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-save current assessment work' })
  async autoSave(@CurrentUser() user: any, @Body() dto: AutoSaveDto) {
    return this.secureService.autoSave(user.id, dto);
  }

  @Get('auto-saves/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get auto-saves for a session' })
  async getAutoSaves(@Param('sessionId') sessionId: string) {
    return this.secureService.getAutoSaves(sessionId);
  }

  @Post('lock/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock an assessment' })
  async lockAssessment(@CurrentUser() user: any, @Param('sessionId') sessionId: string, @Body('problemId') problemId: string, @Req() req: any) {
    return this.secureService.lockAssessment(user.id, sessionId, problemId, req);
  }

  @Get('remaining-lock-time/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get remaining lock time' })
  async getRemainingLockTime(@Param('sessionId') sessionId: string) {
    return this.secureService.getRemainingLockTime(sessionId);
  }

  @Post('resume/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume a locked/completed assessment after lock expires' })
  async resumeAssessment(@CurrentUser() user: any, @Param('sessionId') sessionId: string) {
    return this.secureService.resumeAssessment(user.id, sessionId);
  }

  @Post('submit/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a completed assessment' })
  async submitAssessment(@CurrentUser() user: any, @Param('sessionId') sessionId: string, @Req() req: any) {
    return this.secureService.submitAssessment(user.id, sessionId, req);
  }

  @Get('violations/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current violation count for session' })
  async getCurrentViolations(@Param('sessionId') sessionId: string) {
    return this.secureService.getCurrentViolations(sessionId);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get secure assessment configuration' })
  async getSecurityConfig() {
    return this.secureService.getSecurityConfig();
  }

  @Get('my-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active/locked assessments for current user' })
  async getMyAssessmentStatus(@CurrentUser() user: any) {
    return this.secureService.getAssessmentStatus(user.id);
  }

  // Admin endpoints
  @Post('admin/unlock')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Unlock an assessment' })
  async adminUnlock(@CurrentUser() admin: any, @Body() dto: AdminUnlockDto) {
    return this.secureService.adminUnlockAssessment(admin, dto);
  }

  @Post('admin/extend-lock')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Extend lock duration' })
  async adminExtendLock(@CurrentUser() admin: any, @Body() dto: AdminExtendLockDto) {
    return this.secureService.adminExtendLockDuration(admin, dto);
  }

  @Post('admin/reduce-lock')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Reduce lock duration' })
  async adminReduceLock(@CurrentUser() admin: any, @Body() dto: AdminReduceLockDto) {
    return this.secureService.adminReduceLockDuration(admin, dto);
  }

  @Post('admin/reset-violations')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Reset violation count' })
  async adminResetViolations(@CurrentUser() admin: any, @Body() dto: AdminResetViolationsDto) {
    return this.secureService.adminResetViolations(admin, dto);
  }

  @Post('admin/ignore-violation')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Ignore a violation' })
  async adminIgnoreViolation(@CurrentUser() admin: any, @Body() dto: AdminIgnoreViolationDto) {
    return this.secureService.adminIgnoreViolation(admin, dto);
  }

  @Put('admin/config')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Update security configuration' })
  async adminUpdateConfig(@CurrentUser() admin: any, @Body() dto: AdminUpdateSecurityConfigDto) {
    return this.secureService.updateSecurityConfig(dto);
  }

  @Get('admin/dashboard')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Get security dashboard' })
  async getSecurityDashboard() {
    return this.secureService.getSecurityDashboard();
  }

  @Get('admin/violations')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Get violation logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getViolationLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.secureService.getViolationLogs(page || 1, limit || 50, search);
  }

  @Get('admin/locked')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Get all locked assessments' })
  async getLockedAssessments() {
    return this.secureService.getLockedAssessments();
  }

  @Get('admin/audit-logs')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Get security audit logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.secureService.getSecurityAuditLogs(page || 1, limit || 50);
  }

  @Get('admin/export')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin - Export violation logs' })
  @ApiQuery({ name: 'format', required: false })
  async exportLogs(@Query('format') format?: string) {
    return this.secureService.exportViolationLogs((format as 'json' | 'csv') || 'json');
  }
}

import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { SubmitSqlDto } from './dto/submit-sql.dto';
import { UpdateExamConfigDto } from './dto/update-exam-config.dto';
import { LogViolationDto } from './dto/log-violation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChallengeType } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengeController {
  constructor(private challengeService: ChallengeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new practice problem (Admin)' })
  async createProblem(@Body() dto: CreateProblemDto) {
    return this.challengeService.createProblem(dto);
  }

  @Post(':problemId/testcase')
  @ApiOperation({ summary: 'Add a testcase to a problem (Admin)' })
  async addTestCase(
    @Param('problemId') problemId: string,
    @Body('input') input: string,
    @Body('expected') expected: string,
    @Body('isSample') isSample?: boolean,
  ) {
    return this.challengeService.addTestCase(problemId, input, expected, isSample ?? false);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of challenges' })
  @ApiQuery({ name: 'type', enum: ChallengeType, required: false })
  async getProblems(@CurrentUser() user: any, @Query('type') type?: ChallengeType) {
    return this.challengeService.getProblems(user.id, type);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get details of a specific challenge' })
  async getProblemBySlug(@Param('slug') slug: string) {
    return this.challengeService.getProblemBySlug(slug);
  }

  @Post(':slug/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit solution for a coding challenge' })
  async submitCode(
    @CurrentUser() user: any,
    @Param('slug') slug: string,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.challengeService.submitCode(user.id, slug, dto);
  }

  @Post(':slug/submit-sql')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit query for a SQL challenge' })
  async submitSql(
    @CurrentUser() user: any,
    @Param('slug') slug: string,
    @Body() dto: SubmitSqlDto,
  ) {
    return this.challengeService.submitSql(user.id, slug, dto);
  }

  @Post(':slug/hint')
  @ApiOperation({ summary: 'Get AI hint for a challenge' })
  async getAiHint(@Param('slug') slug: string, @Body('code') code?: string) {
    return this.challengeService.askAiHint(slug, code);
  }

  @Get(':slug/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user submissions for this challenge' })
  async getSubmissions(@CurrentUser() user: any, @Param('slug') slug: string) {
    return this.challengeService.getSubmissions(user.id, slug);
  }

  @Get(':slug/leaderboard')
  @ApiOperation({ summary: 'Get leaderboard for this specific challenge' })
  async getLeaderboard(@Param('slug') slug: string) {
    return this.challengeService.getProblemLeaderboard(slug);
  }

  @Get(':slug/comments')
  @ApiOperation({ summary: 'Get comment discussions for this challenge' })
  async getComments(@Param('slug') slug: string) {
    return this.challengeService.getProblemComments(slug);
  }

  @Post(':slug/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a comment/discussion to this challenge' })
  async addComment(
    @CurrentUser() user: any,
    @Param('slug') slug: string,
    @Body('content') content: string,
  ) {
    return this.challengeService.addProblemComment(user.id, slug, content);
  }

  @Get('secure-mode/config')
  @ApiOperation({ summary: 'Get exam secure mode configuration' })
  async getExamConfig() {
    return this.challengeService.getExamConfig();
  }

  @Post('secure-mode/config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update exam secure mode configuration (Admin)' })
  async updateExamConfig(@Body() dto: UpdateExamConfigDto) {
    return this.challengeService.updateExamConfig(dto);
  }

  @Post('secure-mode/violation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log a student security violation' })
  async logViolation(@CurrentUser() user: any, @Body() dto: LogViolationDto) {
    return this.challengeService.logViolation(user.id, dto);
  }

  @Get('secure-mode/violations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all violation logs (Admin)' })
  async getViolations() {
    return this.challengeService.getViolations();
  }

  @Get('secure-mode/auto-submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all auto-submitted exams (Admin)' })
  async getAutoSubmissions() {
    return this.challengeService.getAutoSubmissions();
  }
}

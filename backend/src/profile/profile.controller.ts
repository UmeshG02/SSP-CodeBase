import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(
    private profileService: ProfileService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile and achievements' })
  async getProfile(@CurrentUser() user: any) {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile metadata' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global leaderboard' })
  async getLeaderboard() {
    return this.prisma.profile.findMany({
      orderBy: {
        xp: 'desc',
      },
      take: 50,
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        college: true,
        company: true,
        xp: true,
        level: true,
      },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            streaks: true,
            badges: {
              include: {
                badge: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...dto,
      },
    });
  }

  async awardXpAndCoins(userId: string, xpAmount: number, coinsAmount: number, reason: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const newXp = profile.xp + xpAmount;
    const newCoins = profile.coins + coinsAmount;

    // Standard Duolingo-style level calculator: e.g., 100 XP per level
    const newLevel = Math.floor(newXp / 100) + 1;

    // Update profile
    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: {
        xp: newXp,
        coins: newCoins,
        level: newLevel,
      },
    });

    // Record XP transaction
    await this.prisma.xPTransaction.create({
      data: {
        userId,
        amount: xpAmount,
        reason,
      },
    });

    // Award initial badges automatically
    await this.checkAndAwardBadges(userId, newXp, newLevel);

    return updatedProfile;
  }

  async recordActivityAndStreak(userId: string) {
    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (!streak) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveDate = new Date(streak.lastActive.getFullYear(), streak.lastActive.getMonth(), streak.lastActive.getDate());

    const diffTime = today.getTime() - lastActiveDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let currentStreak = streak.currentStreak;
    let longestStreak = streak.longestStreak;

    if (diffDays === 1) {
      // Consecutive day!
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else if (diffDays > 1) {
      // Broke streak!
      currentStreak = 1;
    } else if (currentStreak === 0) {
      // First activity
      currentStreak = 1;
      longestStreak = 1;
    }

    await this.prisma.streak.update({
      where: { userId },
      data: {
        currentStreak,
        longestStreak,
        lastActive: now,
      },
    });

    // Award streak badges
    await this.checkStreakBadges(userId, currentStreak);
  }

  private async checkAndAwardBadges(userId: string, totalXp: number, level: number) {
    // We will auto-create default badges if they don't exist
    const badgeDefinitions = [
      { name: 'First Problem', description: 'Solved your first practice problem', imageUrl: '/badges/first_problem.png' },
      { name: 'Level 5 Achieved', description: 'Reached Level 5', imageUrl: '/badges/level_5.png' },
      { name: 'Coins Accumulator', description: 'Earned over 500 coins', imageUrl: '/badges/coins.png' },
    ];

    for (const def of badgeDefinitions) {
      let badge = await this.prisma.badge.findUnique({ where: { name: def.name } });
      if (!badge) {
        badge = await this.prisma.badge.create({ data: def });
      }

      // Check if user already has it
      const alreadyHas = await this.prisma.userBadge.findFirst({
        where: { userId, badgeId: badge.id },
      });

      if (!alreadyHas) {
        let qualify = false;
        if (def.name === 'First Problem') {
          // If totalXp > 0, they solved something
          if (totalXp > 0) qualify = true;
        } else if (def.name === 'Level 5 Achieved') {
          if (level >= 5) qualify = true;
        }

        if (qualify) {
          await this.prisma.userBadge.create({
            data: {
              userId,
              badgeId: badge.id,
            },
          });
        }
      }
    }
  }

  private async checkStreakBadges(userId: string, currentStreak: number) {
    const badgeName = '7-Day Streak';
    if (currentStreak >= 7) {
      let badge = await this.prisma.badge.findUnique({ where: { name: badgeName } });
      if (!badge) {
        badge = await this.prisma.badge.create({
          data: {
            name: badgeName,
            description: 'Maintained a 7-day practice streak',
            imageUrl: '/badges/streak_7.png',
          },
        });
      }

      const alreadyHas = await this.prisma.userBadge.findFirst({
        where: { userId, badgeId: badge.id },
      });

      if (!alreadyHas) {
        await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });
      }
    }
  }
}

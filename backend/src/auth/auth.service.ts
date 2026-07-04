import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingProfile = await this.prisma.profile.findUnique({
      where: { username: dto.username },
    });
    if (existingProfile) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: {
          create: {
            name: dto.name,
            username: dto.username,
            avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${dto.username}`,
            skills: [],
            prefLang: 'JavaScript',
            expLevel: 'Beginner',
            xp: 0,
            coins: 100, // starting coins
            level: 1,
          },
        },
        streaks: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            lastActive: new Date(),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}

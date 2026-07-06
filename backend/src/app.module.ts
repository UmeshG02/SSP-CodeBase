import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ChallengeModule } from './challenge/challenge.module';
import { RoadmapModule } from './roadmap/roadmap.module';
import { SecureAssessmentModule } from './secure-assessment/secure-assessment.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    ChallengeModule,
    RoadmapModule,
    SecureAssessmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

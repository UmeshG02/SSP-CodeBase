import { Module } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [AuthModule, ProfileModule],
  controllers: [ChallengeController, AdminController],
  providers: [ChallengeService],
  exports: [ChallengeService],
})
export class ChallengeModule {}

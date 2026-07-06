import { Module } from '@nestjs/common';
import { SecureAssessmentService } from './secure-assessment.service';
import { SecureAssessmentController } from './secure-assessment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SecureAssessmentController],
  providers: [SecureAssessmentService],
  exports: [SecureAssessmentService],
})
export class SecureAssessmentModule {}

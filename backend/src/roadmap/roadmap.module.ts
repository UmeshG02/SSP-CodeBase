import { Module } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';
import { RoadmapController } from './roadmap.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RoadmapController],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}

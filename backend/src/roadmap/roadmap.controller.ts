import { Controller, Get, Post, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoadmapService } from './roadmap.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('roadmap')
@Controller('roadmap')
export class RoadmapController {
  constructor(private roadmapService: RoadmapService) {}

  @Get('paths')
  @ApiOperation({ summary: 'Retrieve list of all structured learning paths' })
  async getPaths() {
    return this.roadmapService.getPaths();
  }

  @Get('paths/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve specific roadmap with locked/unlocked weekly modules' })
  async getPathDetails(@CurrentUser() user: any, @Param('slug') slug: string) {
    return this.roadmapService.getPathDetails(user.id, slug);
  }

  @Get('days/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch problems and auxiliary activities inside a learning day' })
  async getDayDetails(@CurrentUser() user: any, @Param('id') dayId: string) {
    return this.roadmapService.getDayDetails(user.id, dayId);
  }

  @Post('upload-pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Admin utility to upload syllabus PDF and compile modular paths' })
  async uploadPdf(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only administrators can upload and generate curriculums.');
    }
    if (!file) {
      throw new BadRequestException('Please provide a valid PDF file.');
    }
    return this.roadmapService.parsePdfAndGenerateRoadmap(file.buffer);
  }

  @Post('unlock-with-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock a specific module/week using an access key' })
  async unlockWeekWithKey(@CurrentUser() user: any, @Body('key') key: string) {
    return this.roadmapService.unlockWeekWithKey(user.id, key);
  }
}

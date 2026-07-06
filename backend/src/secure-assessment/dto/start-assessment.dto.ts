import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartAssessmentDto {
  @ApiProperty()
  @IsString()
  problemId: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  maxViolations?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  lockDuration?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  totalQuestions?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currentCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currentLanguage?: string;
}

import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordViolationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  problemId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  violationType: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  totalCount: number;

  @ApiProperty()
  @IsString()
  browser: string;

  @ApiProperty()
  @IsString()
  os: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  assessmentDuration?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  remainingTime?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lockStatus?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  day?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  questionNumber?: number;
}

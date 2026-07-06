import { IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AutoSaveDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  questionNumber?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  questionType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  metadata?: string;
}

import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogViolationDto {
  @ApiProperty({ example: 'problem-uuid-here' })
  @IsString()
  @IsNotEmpty()
  problemId: string;

  @ApiProperty({ example: 'TAB_SWITCH' })
  @IsString()
  @IsNotEmpty()
  violationType: string;

  @ApiProperty({ example: 'Switched tab to youtube.com', required: false })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  totalCount: number;

  @ApiProperty({ example: 'Chrome' })
  @IsString()
  @IsNotEmpty()
  browser: string;

  @ApiProperty({ example: 'Windows 11' })
  @IsString()
  @IsNotEmpty()
  os: string;

  @ApiProperty({ example: '127.0.0.1', required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string;
}

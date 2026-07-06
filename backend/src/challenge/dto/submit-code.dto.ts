import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitCodeDto {
  @ApiProperty({ example: 'javascript' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ example: 'function twoSum(nums, target) { return [0, 1]; }' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  autoSubmitted?: boolean;

  @ApiProperty({ example: 'Auto Submitted due to violations.', required: false })
  @IsString()
  @IsOptional()
  autoSubmitReason?: string;
}

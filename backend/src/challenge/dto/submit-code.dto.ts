import { IsString, IsNotEmpty } from 'class-validator';
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
}

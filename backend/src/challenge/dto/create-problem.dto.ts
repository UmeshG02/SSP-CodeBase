import { IsString, IsEnum, IsInt, IsOptional, IsArray } from 'class-validator';
import { Difficulty, ChallengeType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProblemDto {
  @ApiProperty({ example: 'Two Sum' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'two-sum' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Given an array of integers...' })
  @IsString()
  description: string;

  @ApiProperty({ enum: Difficulty, example: Difficulty.EASY })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ enum: ChallengeType, example: ChallengeType.CODING })
  @IsEnum(ChallengeType)
  type: ChallengeType;

  @ApiProperty({ example: 10 })
  @IsInt()
  points: number;

  @ApiProperty({ example: ['Arrays', 'Hash Table'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: 'An array of numbers, target sum', required: false })
  @IsString()
  @IsOptional()
  inputFormat?: string;

  @ApiProperty({ example: 'Indices of the two numbers', required: false })
  @IsString()
  @IsOptional()
  outputFormat?: string;

  @ApiProperty({ example: 'Time complexity O(N)', required: false })
  @IsString()
  @IsOptional()
  constraints?: string;

  @ApiProperty({ example: '{"javascript": "function twoSum(nums, target) {\\n\\n}"}', required: false })
  @IsString()
  @IsOptional()
  templateCode?: string;

  @ApiProperty({ example: 'function twoSum(nums, target) { ... }', required: false })
  @IsString()
  @IsOptional()
  solutionCode?: string;
}

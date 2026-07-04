import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'My College', required: false })
  @IsString()
  @IsOptional()
  college?: string;

  @ApiProperty({ example: 'My Company', required: false })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({ example: ['JavaScript', 'React'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ example: 'TypeScript', required: false })
  @IsString()
  @IsOptional()
  prefLang?: string;

  @ApiProperty({ example: 'Intermediate', required: false })
  @IsString()
  @IsOptional()
  expLevel?: string;
}

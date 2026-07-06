import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitSqlDto {
  @ApiProperty({ example: 'SELECT * FROM users WHERE status = \'active\'' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  autoSubmitted?: boolean;

  @ApiProperty({ example: 'Auto Submitted due to violations.', required: false })
  @IsString()
  @IsOptional()
  autoSubmitReason?: string;
}

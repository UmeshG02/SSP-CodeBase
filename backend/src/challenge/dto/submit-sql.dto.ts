import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitSqlDto {
  @ApiProperty({ example: 'SELECT * FROM users WHERE status = \'active\'' })
  @IsString()
  @IsNotEmpty()
  query: string;
}

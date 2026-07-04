import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username: string;
}

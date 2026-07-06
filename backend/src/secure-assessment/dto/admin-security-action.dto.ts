import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminUnlockDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class AdminExtendLockDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsInt()
  extraMinutes: number;
}

export class AdminReduceLockDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsInt()
  reduceMinutes: number;
}

export class AdminResetViolationsDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class AdminIgnoreViolationDto {
  @ApiProperty()
  @IsString()
  violationId: string;
}

export class AdminBanUserDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AdminUpdateSecurityConfigDto {
  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  maxViolations?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  fullscreenEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  tabSwitchEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  copyPasteDisabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  rightClickDisabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  devToolsDisabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoSaveEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  autoSaveInterval?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  windowFocusDetection?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enforceFullScreen?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  lockDurationMinutes?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  violationResetPolicy?: string;
}

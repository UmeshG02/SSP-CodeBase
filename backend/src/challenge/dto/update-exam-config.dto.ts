import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExamConfigDto {
  @ApiProperty({ example: 3, required: false })
  @IsInt()
  @IsOptional()
  maxViolations?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  fullscreenEnabled?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  tabSwitchEnabled?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  copyPasteDisabled?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  rightClickDisabled?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  devToolsDisabled?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  resizeWarningsEnabled?: boolean;

  @ApiProperty({ example: 'Warning 1 of 3: You have left the exam window.', required: false })
  @IsString()
  @IsOptional()
  warningMsg1?: string;

  @ApiProperty({ example: 'Warning 2 of 3: One more violation will submit.', required: false })
  @IsString()
  @IsOptional()
  warningMsg2?: string;

  @ApiProperty({ example: 'Auto Submitted due to violations.', required: false })
  @IsString()
  @IsOptional()
  warningMsg3?: string;
}

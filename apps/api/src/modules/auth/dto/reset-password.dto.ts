import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received via email',
    example: 'abc123def456ghi789',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters with uppercase, lowercase, number, and special character)',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupDto {
  @ApiProperty({
    description: 'MFA verification code from authenticator app to confirm setup',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  verificationCode: string;
}

export class MfaDisableDto {
  @ApiProperty({
    description: 'MFA verification code or backup code to confirm disable',
    example: '123456',
  })
  @IsString()
  verificationCode: string;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description: 'MFA verification code to confirm backup code regeneration',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  verificationCode: string;
}
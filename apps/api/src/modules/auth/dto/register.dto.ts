import { IsEmail, IsString, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters with uppercase, lowercase, number, and special character)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'Organization ID to associate the user with',
    example: 'clp123abc456def789',
  })
  @IsUUID()
  organizationId: string;
}
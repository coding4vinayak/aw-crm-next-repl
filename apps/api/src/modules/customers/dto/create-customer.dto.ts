import { IsEmail, IsString, IsOptional, IsUUID, IsNumber, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Customer first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Customer last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+1-555-0123',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Customer website URL',
    example: 'https://johndoe.com',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Customer industry',
    example: 'Technology',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company size',
    example: '10-50',
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
  })
  @IsOptional()
  @IsEnum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
  companySize?: string;

  @ApiPropertyOptional({
    description: 'Customer status',
    example: 'active',
    enum: ['active', 'inactive', 'prospect'],
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'prospect'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Customer source',
    example: 'website',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Customer lifetime value',
    example: 25000.50,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  lifetimeValue?: number;

  @ApiPropertyOptional({
    description: 'ID of the user assigned to this customer',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'ID of the company this customer belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Custom fields as JSON object',
    example: {
      department: 'IT',
      budget: 50000,
      decisionMaker: true,
    },
  })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
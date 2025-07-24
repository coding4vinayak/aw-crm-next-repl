import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SecurityService } from './security.service';
import { MfaService } from './mfa.service';
import { SessionService } from './session.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../../common/audit/audit.module';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('auth.jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SecurityService,
    MfaService,
    SessionService,
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, SecurityService, MfaService, SessionService],
})
export class AuthModule {}
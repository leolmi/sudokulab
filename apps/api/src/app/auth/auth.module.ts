import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGoogleStrategy } from './auth-google.strategy';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, AuthGoogleStrategy],
})
export class AuthModule {}

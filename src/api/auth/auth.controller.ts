import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginRequest, RegisterRequest } from '../../shared/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterRequest) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginRequest) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: { user: { userId: string; username: string } }) {
    return req.user;
  }
}

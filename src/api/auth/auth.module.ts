import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema, PlayerSave, PlayerSaveSchema } from '../models/schemas';
import { PlayerService } from '../services/player.service';
import { RedisService } from '../services/redis.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PlayerSave.name, schema: PlayerSaveSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PlayerService, RedisService],
  exports: [AuthService, PlayerService, RedisService],
})
export class AuthModule {}

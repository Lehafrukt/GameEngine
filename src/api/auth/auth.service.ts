import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../models/schemas';
import { PlayerService } from '../services/player.service';
import { LoginRequest, LoginResponse, RegisterRequest } from '../../shared/types';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private playerService: PlayerService,
  ) {}

  async register(dto: RegisterRequest): Promise<LoginResponse> {
    const existing = await this.userModel.findOne({
      $or: [{ username: dto.username }, { email: dto.email }],
    }).exec();

    if (existing) {
      throw new ConflictException('Username or email already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = new this.userModel({
      username: dto.username,
      passwordHash,
      email: dto.email,
    });
    await user.save();

    // Create initial player save
    await this.playerService.createPlayerSave(user._id.toString(), dto.username);

    return this.generateToken(user);
  }

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const user = await this.userModel.findOne({ username: dto.username }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Account is banned');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: User): LoginResponse {
    const payload = { userId: user._id.toString(), username: user.username };
    return {
      accessToken: this.jwtService.sign(payload),
      userId: user._id.toString(),
      username: user.username,
    };
  }
}

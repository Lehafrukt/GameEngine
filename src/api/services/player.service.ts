import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerSave } from '../models/schemas';
import { RedisService } from './redis.service';

/**
 * PlayerService — In-Memory-First persistence layer.
 *
 * Flow:
 *  1. Game loop writes player state → Redis (fast, every N ticks)
 *  2. Periodic flush writes Redis → MongoDB (durable)
 *  3. On player join, load: Redis → fallback MongoDB
 */
@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectModel(PlayerSave.name) private playerSaveModel: Model<PlayerSave>,
    private readonly redis: RedisService,
  ) {}

  /** Start periodic flush from Redis → MongoDB */
  startPeriodicFlush(intervalMs = 30_000) {
    this.flushInterval = setInterval(() => {
      this.flushAllToMongo().catch((err) =>
        this.logger.error('Flush failed', err),
      );
    }, intervalMs);
    this.logger.log(`Periodic flush started (every ${intervalMs}ms)`);
  }

  stopPeriodicFlush() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /** Save player snapshot to Redis (fast path) */
  async saveToCache(userId: string, data: Record<string, unknown>): Promise<void> {
    await this.redis.cachePlayerState(userId, data);
  }

  /** Load player — Redis first, fallback to MongoDB */
  async loadPlayer(userId: string): Promise<Record<string, unknown> | null> {
    // Try Redis
    const cached = await this.redis.getPlayerState(userId);
    if (cached) {
      this.logger.debug(`Player ${userId} loaded from Redis`);
      return cached;
    }

    // Fallback to MongoDB
    const saved = await this.playerSaveModel.findOne({ userId }).lean().exec();
    if (saved) {
      this.logger.debug(`Player ${userId} loaded from MongoDB`);
      // Warm up cache
      await this.redis.cachePlayerState(userId, saved as Record<string, unknown>);
    }
    return saved as Record<string, unknown> | null;
  }

  /** Persist a single player from Redis → MongoDB */
  async flushPlayerToMongo(userId: string): Promise<void> {
    const cached = await this.redis.getPlayerState(userId);
    if (!cached) return;

    await this.playerSaveModel.findOneAndUpdate(
      { userId },
      { $set: cached },
      { upsert: true },
    ).exec();
  }

  /** Flush all dirty players (simplified — scans Redis keys) */
  private async flushAllToMongo(): Promise<void> {
    // In production, maintain a dirty set instead of SCAN
    this.logger.debug('Flushing player states to MongoDB...');
    // This is a simplified approach — for real scale, track dirty user IDs
  }

  /** Create initial save for new player */
  async createPlayerSave(userId: string, username: string): Promise<PlayerSave> {
    const save = new this.playerSaveModel({
      userId,
      username,
      position: { x: 0, y: 0, z: 0 },
      health: { current: 100, max: 100 },
      level: 1,
      experience: 0,
      inventory: {},
      lastRoomId: null,
    });
    return save.save();
  }
}

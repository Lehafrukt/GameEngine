import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * RedisService — thin wrapper around ioredis for in-memory game state caching.
 * Stores serialized player snapshots between persistence flushes.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /** Cache a player snapshot (TTL in seconds, default 5 min) */
  async cachePlayerState(userId: string, data: Record<string, unknown>, ttl = 300): Promise<void> {
    await this.client.set(`player:${userId}`, JSON.stringify(data), 'EX', ttl);
  }

  /** Get cached player state */
  async getPlayerState(userId: string): Promise<Record<string, unknown> | null> {
    const raw = await this.client.get(`player:${userId}`);
    return raw ? JSON.parse(raw) : null;
  }

  /** Remove cached player state */
  async removePlayerState(userId: string): Promise<void> {
    await this.client.del(`player:${userId}`);
  }

  /** Store a value */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  /** Read a value */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /** Delete a key */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

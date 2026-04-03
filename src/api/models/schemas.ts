import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, minlength: 3, maxlength: 30 })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ default: false })
  isBanned!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);


@Schema({ timestamps: true })
export class PlayerSave extends Document {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  username!: string;

  @Prop({
    type: { x: Number, y: Number, z: Number },
    default: { x: 0, y: 0, z: 0 },
  })
  position!: { x: number; y: number; z: number };

  @Prop({
    type: { current: Number, max: Number },
    default: { current: 100, max: 100 },
  })
  health!: { current: number; max: number };

  @Prop({ default: 1 })
  level!: number;

  @Prop({ default: 0 })
  experience!: number;

  @Prop({ type: Object, default: {} })
  inventory!: Record<string, unknown>;

  @Prop({ type: String, default: null })
  lastRoomId!: string | null;
}

export const PlayerSaveSchema = SchemaFactory.createForClass(PlayerSave);

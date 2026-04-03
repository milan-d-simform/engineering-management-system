import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';

export type UserDocument = User &
  Document & {
    id: string;
    _id: import('mongoose').Types.ObjectId;
  };

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  bio?: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Team', index: true })
  teamId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  projects: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ select: false })
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    r.password = undefined;
    r.refreshToken = undefined;
    r.passwordResetToken = undefined;
    r.passwordResetExpires = undefined;
    r.__v = undefined;
    return ret;
  },
});

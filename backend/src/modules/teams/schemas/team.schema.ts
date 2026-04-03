import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

TeamSchema.set('toJSON', {
  transform: (_doc, ret) => {
    (ret as unknown as Record<string, unknown>).__v = undefined;
    return ret;
  },
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Project } from '../../projects/schemas/project.schema';

export type ScanDocument = Scan & Document;

@Schema({ timestamps: true })
export class Scan {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
  projectId: Project;

  @Prop({
    required: true,
    enum: ['queued', 'running', 'completed', 'failed'],
    default: 'queued',
  })
  status: string;

  @Prop({ type: Object })
  results: any; // This will store the full analysis result from kowasp-core

  @Prop()
  completedAt: Date;
}

export const ScanSchema = SchemaFactory.createForClass(Scan); 
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { Scan, ScanSchema } from './schemas/scan.schema';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Scan.name, schema: ScanSchema }]),
    ProjectsModule,
  ],
  controllers: [ScansController],
  providers: [ScansService],
  exports: [ScansService],
})
export class ScansModule {} 
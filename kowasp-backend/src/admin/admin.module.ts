import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { ScansModule } from '../scans/scans.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => ScansModule),
  ],
  controllers: [AdminController],
})
export class AdminModule {} 
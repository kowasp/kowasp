import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { ScansService } from '../scans/scans.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private scansService: ScansService,
  ) {}

  @Get('users')
  @Roles('admin')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('projects')
  @Roles('admin')
  getAllProjects() {
    return this.projectsService.findAll();
  }

  @Get('scans')
  @Roles('admin')
  getAllScans() {
    return this.scansService.findAll();
  }
} 
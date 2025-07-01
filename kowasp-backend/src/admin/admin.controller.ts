import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
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

  @Delete('users/:id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    // 1. Find all projects owned by the user
    const projects = await this.projectsService['projectModel'].find({ ownerId: id }).exec();
    const projectIds = projects.map((p: any) => p._id.toString());

    // 2. Delete all scans for those projects
    if (projectIds.length > 0) {
      await this.scansService.deleteAllByProjectIds(projectIds);
    }

    // 3. Delete all projects owned by the user
    await this.projectsService.deleteAllByOwnerId(id);

    // 4. Delete the user
    await this.usersService.delete(id);

    return { message: 'User and all related projects and scans deleted.' };
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
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { ScansService } from './scans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScansController {
  constructor(
    private readonly scansService: ScansService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('/project/:projectId')
  async create(@Param('projectId') projectId: string, @Request() req) {
    const project = await this.projectsService.findOneForUser(
      projectId,
      req.user,
    );
    if (!project) {
      throw new ForbiddenException(
        'You do not have permission to scan this project.',
      );
    }
    return this.scansService.create(project);
  }

  @Get('/project/:projectId')
  async findAllForProject(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    const project = await this.projectsService.findOneForUser(
      projectId,
      req.user,
    );
    if (!project) {
      throw new ForbiddenException(
        'You do not have permission to view scans for this project.',
      );
    }
    return this.scansService.findAllForProject(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const scan = await this.scansService.findOne(id);
    // Ensure the user has access to the project this scan belongs to
    await this.projectsService.findOneForUser(scan.projectId.toString(), req.user);
    return scan;
  }

  @Post('code')
  async scanCode(@Body() body: { code: string }, @Request() req) {
    return this.scansService.scanCode(body.code, req.user);
  }

  @Post('upload-directory')
  @UseInterceptors(FileInterceptor('zip'))
  async uploadDirectory(@UploadedFile() file: any, @Request() req) {
    return this.scansService.scanUploadedDirectory(file, req.user);
  }

  @Post('upload-directory-files')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadDirectoryFiles(@UploadedFiles() files: any[], @Request() req) {
    return this.scansService.scanUploadedDirectoryFiles(files, req.user);
  }
} 
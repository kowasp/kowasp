import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    owner: UserDocument,
  ): Promise<Project> {
    const project = new this.projectModel({
      ...createProjectDto,
      ownerId: owner._id,
    });
    return project.save();
  }

  async findAllForUser(owner: UserDocument): Promise<Project[]> {
    return this.projectModel.find({ ownerId: owner._id }).exec();
  }

  async findOneForUser(
    id: string,
    owner: UserDocument,
  ): Promise<ProjectDocument | null> {
    const project = await this.projectModel.findById(id).exec();
    if (project && project.ownerId.toString() !== owner._id.toString()) {
      throw new ForbiddenException('You do not have permission to access this project.');
    }
    return project;
  }

  async removeForUser(id: string, owner: UserDocument): Promise<void> {
    const project = await this.findOneForUser(id, owner);
    if(project){
      await this.projectModel.deleteOne({ _id: id }).exec();
    }
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.find().populate('ownerId', 'email').exec();
  }
} 
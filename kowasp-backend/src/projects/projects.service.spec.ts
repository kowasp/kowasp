import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UserDocument } from '../users/schemas/user.schema';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectModel: any;

  // Mock constructor for projectModel
  const mockProjectInstance = {
    save: jest.fn(),
  };
  function MockProjectModel(this: any, ...args: any[]) {
    return mockProjectInstance;
  }
  MockProjectModel.find = jest.fn();
  MockProjectModel.findById = jest.fn();
  MockProjectModel.deleteOne = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getModelToken(Project.name),
          useValue: MockProjectModel,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectModel = module.get(getModelToken(Project.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project successfully', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        repositoryUrl: 'https://github.com/test/project',
      };

      const mockUser: Partial<UserDocument> = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'user',
      };

      const mockProject = {
        _id: 'project123',
        name: 'Test Project',
        repositoryUrl: 'https://github.com/test/project',
        ownerId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectInstance.save.mockResolvedValue(mockProject);

      const result = await service.create(createProjectDto, mockUser as UserDocument);

      expect(mockProjectInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAllForUser', () => {
    it('should return all projects for a user', async () => {
      const mockUser: Partial<UserDocument> = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'user',
      };

      const mockProjects = [
        {
          _id: 'project1',
          name: 'Project 1',
          repositoryUrl: 'https://github.com/test/project1',
          ownerId: 'user123',
        },
        {
          _id: 'project2',
          name: 'Project 2',
          repositoryUrl: 'https://github.com/test/project2',
          ownerId: 'user123',
        },
      ];

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockProjects),
      };

      MockProjectModel.find.mockReturnValue(mockQuery);

      const result = await service.findAllForUser(mockUser as UserDocument);

      expect(MockProjectModel.find).toHaveBeenCalledWith({ ownerId: mockUser._id });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOneForUser', () => {
    it('should return a project by id for the owner', async () => {
      const projectId = 'project123';
      const mockUser: Partial<UserDocument> = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'user',
      };

      const mockProject = {
        _id: 'project123',
        name: 'Test Project',
        repositoryUrl: 'https://github.com/test/project',
        ownerId: 'user123',
        toString: () => 'user123',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockProject),
      };

      MockProjectModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOneForUser(projectId, mockUser as UserDocument);

      expect(MockProjectModel.findById).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const projectId = 'project123';
      const mockUser: Partial<UserDocument> = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'user',
      };

      const mockProject = {
        _id: 'project123',
        name: 'Test Project',
        repositoryUrl: 'https://github.com/test/project',
        ownerId: 'otheruser',
        toString: () => 'otheruser',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockProject),
      };

      MockProjectModel.findById.mockReturnValue(mockQuery);

      await expect(service.findOneForUser(projectId, mockUser as UserDocument)).rejects.toThrow(ForbiddenException);
      expect(MockProjectModel.findById).toHaveBeenCalledWith(projectId);
    });
  });

  describe('removeForUser', () => {
    it('should delete a project successfully', async () => {
      const projectId = 'project123';
      const mockUser: Partial<UserDocument> = {
        _id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'user',
      };

      const mockProject = {
        _id: 'project123',
        name: 'Test Project',
        repositoryUrl: 'https://github.com/test/project',
        ownerId: 'user123',
        toString: () => 'user123',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockProject),
      };

      const mockDeleteQuery = {
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      MockProjectModel.findById.mockReturnValue(mockQuery);
      MockProjectModel.deleteOne.mockReturnValue(mockDeleteQuery);

      await service.removeForUser(projectId, mockUser as UserDocument);

      expect(MockProjectModel.findById).toHaveBeenCalledWith(projectId);
      expect(MockProjectModel.deleteOne).toHaveBeenCalledWith({ _id: projectId });
    });
  });

  describe('findAll', () => {
    it('should return all projects with populated owner', async () => {
      const mockProjects = [
        {
          _id: 'project1',
          name: 'Project 1',
          repositoryUrl: 'https://github.com/test/project1',
          ownerId: { _id: 'user123', email: 'test@example.com' },
        },
        {
          _id: 'project2',
          name: 'Project 2',
          repositoryUrl: 'https://github.com/test/project2',
          ownerId: { _id: 'user456', email: 'other@example.com' },
        },
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProjects),
        }),
      };

      MockProjectModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll();

      expect(MockProjectModel.find).toHaveBeenCalled();
      expect(mockQuery.populate).toHaveBeenCalledWith('ownerId', 'email');
      expect(result).toEqual(mockProjects);
    });
  });
}); 
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ScansService } from './scans.service';
import { Scan, ScanDocument } from './schemas/scan.schema';
import { ProjectDocument } from '../projects/schemas/project.schema';
import { XSSAnalyzer } from 'kowasp-core';
import { XSSVulnerability, AnalysisResult } from 'kowasp-core';

// Mock kowasp-core
jest.mock('kowasp-core', () => ({
  XSSAnalyzer: jest.fn(),
}));

// Mock fs-extra
jest.mock('fs-extra', () => {
  const fsExtra = jest.requireActual('fs-extra');
  return {
    ...fsExtra,
    ensureDir: jest.fn(),
    writeFile: jest.fn(),
    remove: jest.fn(),
    readdir: jest.fn(),
    createReadStream: jest.fn(() => ({
      pipe: jest.fn(() => ({
        promise: jest.fn().mockResolvedValue(undefined),
      })),
    })),
  };
});

// Mock simple-git
jest.mock('simple-git', () => ({
  __esModule: true,
  default: () => ({
    clone: jest.fn(),
  }),
}));

// Mock unzipper
jest.mock('unzipper', () => ({
  Extract: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('ScansService', () => {
  let service: ScansService;
  let scanModel: any;
  let mockXSSAnalyzer: jest.Mocked<XSSAnalyzer>;

  // Mock constructor for scanModel
  const mockScanInstance = {
    _id: 'scan123',
    save: jest.fn(),
  };
  function MockScanModel(this: any, ...args: any[]) {
    return mockScanInstance;
  }
  
  // Add static methods to MockScanModel
  Object.assign(MockScanModel, {
    find: jest.fn(),
    findById: jest.fn(),
    populate: jest.fn(),
  });

  const mockProject: Partial<ProjectDocument> = {
    _id: 'project123',
    name: 'Test Project',
    repositoryUrl: 'https://github.com/test/project',
    ownerId: { _id: 'user123', email: 'test@example.com' } as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScansService,
        {
          provide: getModelToken(Scan.name),
          useValue: MockScanModel,
        },
      ],
    }).compile();

    service = module.get<ScansService>(ScansService);
    scanModel = module.get(getModelToken(Scan.name));

    // Mock XSSAnalyzer
    mockXSSAnalyzer = {
      analyze: jest.fn(),
    } as any;
    (XSSAnalyzer as jest.Mock).mockImplementation(() => mockXSSAnalyzer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new scan and start analysis', async () => {
      mockScanInstance.save.mockResolvedValue(mockScanInstance);
      const result = await service.create(mockProject as ProjectDocument);
      expect(mockScanInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockScanInstance);
    });
  });

  describe('findAllForProject', () => {
    it('should return all scans for a project', async () => {
      const projectId = 'project123';
      const mockScans = [
        {
          _id: 'scan1',
          projectId: 'project123',
          status: 'completed',
        },
        {
          _id: 'scan2',
          projectId: 'project123',
          status: 'failed',
        },
      ];

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockScans),
      };

      (MockScanModel as any).find.mockReturnValue(mockQuery);

      const result = await service.findAllForProject(projectId);

      expect((MockScanModel as any).find).toHaveBeenCalledWith({ projectId });
      expect(result).toEqual(mockScans);
    });
  });

  describe('findOne', () => {
    it('should return a scan by id', async () => {
      const scanId = 'scan123';
      const mockScan = {
        _id: 'scan123',
        projectId: 'project123',
        status: 'completed',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockScan),
      };

      (MockScanModel as any).findById.mockReturnValue(mockQuery);

      const result = await service.findOne(scanId);

      expect((MockScanModel as any).findById).toHaveBeenCalledWith(scanId);
      expect(result).toEqual(mockScan);
    });

    it('should throw NotFoundException if scan not found', async () => {
      const scanId = 'nonexistent';
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (MockScanModel as any).findById.mockReturnValue(mockQuery);

      await expect(service.findOne(scanId)).rejects.toThrow(NotFoundException);
      expect((MockScanModel as any).findById).toHaveBeenCalledWith(scanId);
    });
  });

  describe('findAll', () => {
    it('should return all scans with populated project', async () => {
      const mockScans = [
        {
          _id: 'scan1',
          projectId: { _id: 'project1', name: 'Project 1' },
          status: 'completed',
        },
        {
          _id: 'scan2',
          projectId: { _id: 'project2', name: 'Project 2' },
          status: 'failed',
        },
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockScans),
        }),
      };

      (MockScanModel as any).find.mockReturnValue(mockQuery);

      const result = await service.findAll();

      expect((MockScanModel as any).find).toHaveBeenCalled();
      expect(mockQuery.populate).toHaveBeenCalledWith('projectId', 'name');
      expect(result).toEqual(mockScans);
    });
  });

  describe('scanCode', () => {
    it('should analyze code and return results', async () => {
      const code = 'console.log("test");';
      const user = { _id: 'user123', email: 'test@example.com' };

      const mockAnalysisResult: AnalysisResult = {
        vulnerabilities: [
          {
            type: 'reflected',
            severity: 'high',
            location: { file: 'test.js', line: 1, column: 1 },
            description: 'XSS vulnerability found',
            code: 'console.log("test");',
            remediation: 'Sanitize input',
            confidence: 0.9,
          },
        ],
        recommendations: ['Use input validation'],
        expressConfig: {
          helmet: false,
          contentSecurityPolicy: false,
          xssFilter: false,
          noSniff: false,
          frameguard: false,
          hsts: false,
        },
        missingSecurityHeaders: [],
      };

      mockXSSAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);

      const result = await service.scanCode(code, user);

      expect(XSSAnalyzer).toHaveBeenCalled();
      expect(mockXSSAnalyzer.analyze).toHaveBeenCalled();
      expect(result.summary.totalIssues).toBe(1);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].static.severity).toBe('high');
    });
  });

  describe('scanUploadedDirectory', () => {
    it('should analyze uploaded directory and return results', async () => {
      const file = {
        buffer: Buffer.from('test zip content'),
        originalname: 'test.zip',
      };
      const user = { _id: 'user123', email: 'test@example.com' };
      const mockAnalysisResult: AnalysisResult = {
        vulnerabilities: [
          {
            type: 'stored',
            severity: 'medium',
            location: { file: 'app.js', line: 5, column: 10 },
            description: 'Potential XSS in template',
            code: 'res.render("page", { data: userInput });',
            remediation: 'Escape user input',
            confidence: 0.8,
          },
        ],
        recommendations: ['Use template escaping'],
        expressConfig: {
          helmet: false,
          contentSecurityPolicy: false,
          xssFilter: false,
          noSniff: false,
          frameguard: false,
          hsts: false,
        },
        missingSecurityHeaders: ['X-Frame-Options'],
      };
      mockXSSAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      const fs = require('fs-extra');
      fs.readdir.mockResolvedValue(['upload.zip', 'app.js']);
      const result = await service.scanUploadedDirectory(file, user);
      expect(XSSAnalyzer).toHaveBeenCalled();
      expect(mockXSSAnalyzer.analyze).toHaveBeenCalled();
      expect(result.summary.totalIssues).toBe(1);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].static.severity).toBe('medium');
      expect(result.expressConfig).toEqual({
        helmet: false,
        contentSecurityPolicy: false,
        xssFilter: false,
        noSniff: false,
        frameguard: false,
        hsts: false,
      });
      expect(result.missingSecurityHeaders).toContain('X-Frame-Options');
    });
  });

  describe('scanUploadedDirectoryFiles', () => {
    it('should analyze uploaded directory files and return results', async () => {
      const files = [
        {
          buffer: Buffer.from('console.log("test");'),
          originalname: 'src/app.js',
          name: 'app.js',
        },
        {
          buffer: Buffer.from('const express = require("express");'),
          originalname: 'src/index.js',
          name: 'index.js',
        },
      ];
      const user = { _id: 'user123', email: 'test@example.com' };
      const mockAnalysisResult: AnalysisResult = {
        vulnerabilities: [
          {
            type: 'reflected',
            severity: 'high',
            location: { file: 'src/app.js', line: 1, column: 1 },
            description: 'XSS vulnerability found',
            code: 'console.log("test");',
            remediation: 'Sanitize input',
            confidence: 0.9,
          },
        ],
        recommendations: ['Use input validation'],
        expressConfig: {
          helmet: false,
          contentSecurityPolicy: false,
          xssFilter: false,
          noSniff: false,
          frameguard: false,
          hsts: false,
        },
        missingSecurityHeaders: ['X-Frame-Options'],
      };
      mockXSSAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      const fs = require('fs-extra');
      fs.ensureDir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);
      fs.remove.mockResolvedValue(undefined);
      
      const result = await service.scanUploadedDirectoryFiles(files, user);
      
      expect(XSSAnalyzer).toHaveBeenCalled();
      expect(mockXSSAnalyzer.analyze).toHaveBeenCalled();
      expect(result.summary.totalIssues).toBe(1);
      expect(result.summary.filesAnalyzed).toBe(2);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].static.severity).toBe('high');
      expect(result.expressConfig).toEqual({
        helmet: false,
        contentSecurityPolicy: false,
        xssFilter: false,
        noSniff: false,
        frameguard: false,
        hsts: false,
      });
      expect(result.missingSecurityHeaders).toContain('X-Frame-Options');
    });

    it('should skip files without relative path', async () => {
      const files = [
        {
          buffer: Buffer.from('console.log("test");'),
          originalname: 'src/app.js',
          name: 'app.js',
        },
        {
          buffer: Buffer.from('const express = require("express");'),
          originalname: null, // No relative path
          name: 'index.js',
        },
      ];
      const user = { _id: 'user123', email: 'test@example.com' };
      const mockAnalysisResult: AnalysisResult = {
        vulnerabilities: [],
        recommendations: [],
        expressConfig: {
          helmet: false,
          contentSecurityPolicy: false,
          xssFilter: false,
          noSniff: false,
          frameguard: false,
          hsts: false,
        },
        missingSecurityHeaders: [],
      };
      mockXSSAnalyzer.analyze.mockResolvedValue(mockAnalysisResult);
      const fs = require('fs-extra');
      fs.ensureDir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);
      fs.remove.mockResolvedValue(undefined);
      
      const result = await service.scanUploadedDirectoryFiles(files, user);
      
      expect(XSSAnalyzer).toHaveBeenCalled();
      expect(mockXSSAnalyzer.analyze).toHaveBeenCalled();
      expect(result.summary.totalIssues).toBe(0);
      expect(result.summary.filesAnalyzed).toBe(2); // Still counts all files
    });
  });
}); 
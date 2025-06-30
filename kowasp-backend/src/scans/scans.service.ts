import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Scan, ScanDocument } from './schemas/scan.schema';
import { ProjectDocument } from '../projects/schemas/project.schema';
import simpleGit from 'simple-git';
import * as fs from 'fs-extra';
import * as path from 'path';
import { XSSAnalyzer } from 'kowasp-core';
import { v4 as uuidv4 } from 'uuid';
import * as unzipper from 'unzipper';

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);
  private readonly git = simpleGit();

  constructor(@InjectModel(Scan.name) private scanModel: Model<ScanDocument>) {}

  async create(project: ProjectDocument): Promise<Scan> {
    this.logger.log(`Creating scan for project ${project._id}`);
    const scan = new this.scanModel({ projectId: project._id, status: 'queued' });
    try {
      await scan.save();
      this.logger.log(`Scan saved with id ${scan._id}`);
    } catch (err) {
      this.logger.error('Error saving scan:', err);
      throw err;
    }
    this.runScan(scan, project.repositoryUrl);
    return scan;
  }

  private async runScan(scan: ScanDocument, repoUrl: string) {
    const repoPath = path.join(__dirname, '..', '..', 'tmp', scan._id.toString());

    try {
      this.logger.log(`Starting scan ${scan._id} for repo ${repoUrl}`);
      scan.status = 'running';
      await scan.save();

      await this.git.clone(repoUrl, repoPath);
      this.logger.log(`Cloned repo to ${repoPath}`);

      const analyzer = new XSSAnalyzer(repoPath);
      const results = await analyzer.analyze();
      
      this.logger.log(`Analysis complete for scan ${scan._id}`);

      // Transform results to match frontend expectations
      const severityBreakdown = results.vulnerabilities.reduce((acc: any, vuln: any) => {
        acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
        return acc;
      }, {});
      
      const findings = results.vulnerabilities.map((vuln: any) => ({
        static: {
          severity: vuln.severity,
          rule: vuln.type,
          description: vuln.description,
          location: vuln.location,
          code: vuln.code,
          remediation: vuln.remediation,
          context: `Confidence: ${vuln.confidence}`
        }
      }));

      scan.status = 'completed';
      scan.results = {
        summary: {
          totalIssues: results.vulnerabilities.length,
          severityBreakdown,
          filesAnalyzed: results.vulnerabilities.length > 0 ? 1 : 0
        },
        findings,
        recommendations: results.recommendations,
        expressConfig: results.expressConfig,
        missingSecurityHeaders: results.missingSecurityHeaders
      };
      scan.completedAt = new Date();
      await scan.save();
      this.logger.log(`Scan ${scan._id} marked as completed and saved.`);
    } catch (error) {
      this.logger.error(`Scan ${scan._id} failed`, error.stack);
      scan.status = 'failed';
      scan.completedAt = new Date();
      try {
        await scan.save();
        this.logger.log(`Scan ${scan._id} marked as failed and saved.`);
      } catch (err) {
        this.logger.error('Error saving failed scan:', err);
      }
    } finally {
      this.logger.log(`Cleaning up repo path ${repoPath}`);
      await fs.remove(repoPath);
    }
  }

  async findAllForProject(projectId: string): Promise<Scan[]> {
    return this.scanModel.find({ projectId }).exec();
  }

  async findOne(id: string): Promise<Scan> {
    const scan = await this.scanModel.findById(id).exec();
    if (!scan) {
      throw new NotFoundException(`Scan with ID "${id}" not found`);
    }
    return scan;
  }

  async findAll(): Promise<Scan[]> {
    return this.scanModel.find().populate('projectId', 'name').exec();
  }

  async scanCode(code: string, user: any) {
    const tmpDir = path.join(__dirname, '..', '..', 'tmp', uuidv4());
    await fs.ensureDir(tmpDir);
    const filePath = path.join(tmpDir, 'input.js');
    await fs.writeFile(filePath, code, 'utf-8');
    const analyzer = new XSSAnalyzer(filePath);
    const results = await analyzer.analyze();
    await fs.remove(tmpDir);
    
    // Transform results to match frontend expectations
    const severityBreakdown = results.vulnerabilities.reduce((acc: any, vuln: any) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {});
    
    const findings = results.vulnerabilities.map((vuln: any) => ({
      static: {
        severity: vuln.severity,
        rule: vuln.type,
        description: vuln.description,
        location: vuln.location,
        code: vuln.code,
        remediation: vuln.remediation,
        context: `Confidence: ${vuln.confidence}`
      }
    }));
    
    return {
      summary: {
        totalIssues: results.vulnerabilities.length,
        severityBreakdown,
        filesAnalyzed: 1
      },
      findings,
      recommendations: results.recommendations,
      expressConfig: results.expressConfig,
      missingSecurityHeaders: results.missingSecurityHeaders
    };
  }

  async scanUploadedDirectory(file: any, user: any) {
    const tmpDir = path.join(__dirname, '..', '..', 'tmp', uuidv4());
    await fs.ensureDir(tmpDir);
    const zipPath = path.join(tmpDir, 'upload.zip');
    await fs.writeFile(zipPath, file.buffer);
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: tmpDir }))
      .promise();
    const entries = await fs.readdir(tmpDir);
    const scanPath = entries.find(e => e !== 'upload.zip' && !e.startsWith('__MACOSX'))
      ? path.join(tmpDir, entries.find(e => e !== 'upload.zip' && !e.startsWith('__MACOSX')))
      : tmpDir;
    const analyzer = new XSSAnalyzer(scanPath);
    const results = await analyzer.analyze();
    await fs.remove(tmpDir);
    
    // Transform results to match frontend expectations
    const severityBreakdown = results.vulnerabilities.reduce((acc: any, vuln: any) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {});
    
    const findings = results.vulnerabilities.map((vuln: any) => ({
      static: {
        severity: vuln.severity,
        rule: vuln.type,
        description: vuln.description,
        location: vuln.location,
        code: vuln.code,
        remediation: vuln.remediation,
        context: `Confidence: ${vuln.confidence}`
      }
    }));
    
    return {
      summary: {
        totalIssues: results.vulnerabilities.length,
        severityBreakdown,
        filesAnalyzed: results.vulnerabilities.length > 0 ? 1 : 0
      },
      findings,
      recommendations: results.recommendations,
      expressConfig: results.expressConfig,
      missingSecurityHeaders: results.missingSecurityHeaders
    };
  }

  async scanUploadedDirectoryFiles(files: any[], user: any) {
    const tmpDir = path.join(__dirname, '..', '..', 'tmp', uuidv4());
    await fs.ensureDir(tmpDir);
    
    try {
      // Create directory structure and write files
      for (const file of files) {
        // The originalname field contains the relative path from the frontend
        const relativePath = file.originalname;
        if (!relativePath) {
          this.logger.warn(`File ${file.name} has no relative path, skipping`);
          continue;
        }
        
        const fullPath = path.join(tmpDir, relativePath);
        const dirPath = path.dirname(fullPath);
        
        // Ensure directory exists
        await fs.ensureDir(dirPath);
        
        // Write file
        await fs.writeFile(fullPath, file.buffer);
        this.logger.log(`Written file: ${relativePath}`);
      }
      
      this.logger.log(`Created directory structure with ${files.length} files in ${tmpDir}`);
      
      // Analyze the directory
      const analyzer = new XSSAnalyzer(tmpDir);
      const results = await analyzer.analyze();
      
      // Transform results to match frontend expectations
      const severityBreakdown = results.vulnerabilities.reduce((acc: any, vuln: any) => {
        acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
        return acc;
      }, {});
      
      const findings = results.vulnerabilities.map((vuln: any) => ({
        static: {
          severity: vuln.severity,
          rule: vuln.type,
          description: vuln.description,
          location: vuln.location,
          code: vuln.code,
          remediation: vuln.remediation,
          context: `Confidence: ${vuln.confidence}`
        }
      }));
      
      return {
        summary: {
          totalIssues: results.vulnerabilities.length,
          severityBreakdown,
          filesAnalyzed: files.length
        },
        findings,
        recommendations: results.recommendations,
        expressConfig: results.expressConfig,
        missingSecurityHeaders: results.missingSecurityHeaders
      };
    } finally {
      // Clean up temporary directory
      await fs.remove(tmpDir);
    }
  }
} 
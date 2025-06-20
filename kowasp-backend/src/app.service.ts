import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';

@Injectable()
export class AppService {
  getHello(): Object {
    return { message: 'Hello World!' };
  }

  getHealth(): string {
    return 'Up and running!';
  }

  async proxyToOllama(prompt: string): Promise<any> {
    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mistral', prompt, stream: false })
    });
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (typeof data === 'object' && data !== null && 'response' in data && typeof (data as any).response === 'string') {
      return { response: (data as any).response };
    } else {
      throw new Error('Unexpected response format from Ollama');
    }
  }

  async staticAnalyze(code: string, filename?: string): Promise<any> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      const tmpDir = os.tmpdir();
      const tempFile = path.join(tmpDir, filename || `analyze-${Date.now()}.js`);
      console.log('[staticAnalyze] Writing temp file:', tempFile);
      await fs.writeFile(tempFile, code, 'utf-8');
      const analyzerPath = path.resolve(__dirname, '../../kowasp-core/dist/index.js');
      console.log('[staticAnalyze] Spawning analyzer:', analyzerPath, tempFile);
      return await new Promise((resolve, reject) => {
        const analyzer = spawn('node', [analyzerPath, tempFile, '--output-json']);
        let output = '';
        let error = '';
        analyzer.stdout.on('data', (data) => {
          console.log('[staticAnalyze] Analyzer stdout:', data.toString());
          output += data.toString();
        });
        analyzer.stderr.on('data', (data) => {
          console.error('[staticAnalyze] Analyzer stderr:', data.toString());
          error += data.toString();
        });
        analyzer.on('close', (code) => {
          console.log('[staticAnalyze] Analyzer process closed with code:', code);
          fs.unlink(tempFile).catch(() => {});
          if (code === 0) {
            try {
              const findings = JSON.parse(output);
              function stripTempDir(obj: any): any {
                const FRIENDLY_LABEL = 'Submitted Code';
                // Match any temp file path ending with 'Submitted Code' or 'analyze-<digits>.js', including macOS Shortcuts temp files
                const TEMP_FILE_REGEX = /\/var\/folders\/[^\s]+Submitted Code|\/var\/folders\/[^\s]+analyze-\d+\.js/g;
                if (Array.isArray(obj)) return obj.map(stripTempDir);
                if (obj && typeof obj === 'object') {
                  const newObj: any = {};
                  for (const k in obj) {
                    if (k === 'location' && obj[k]?.file) {
                      // Replace temp file path with friendly label
                      newObj[k] = { ...obj[k], file: FRIENDLY_LABEL };
                    } else if (typeof obj[k] === 'string') {
                      // Replace any temp file path in string fields
                      newObj[k] = obj[k].replace(TEMP_FILE_REGEX, FRIENDLY_LABEL);
                    } else {
                      newObj[k] = stripTempDir(obj[k]);
                    }
                  }
                  return newObj;
                }
                return obj;
              }
              resolve(stripTempDir(findings));
            } catch (e) {
              console.error('[staticAnalyze] Failed to parse analyzer output:', output, e);
              resolve({ error: 'Failed to parse analyzer output', details: output });
            }
          } else {
            console.error('[staticAnalyze] Analyzer process failed:', error);
            resolve({ error: error || 'Analyzer failed' });
          }
        });
      });
    } catch (err: any) {
      console.error('[staticAnalyze] Static analysis error:', err);
      return { error: err.message || 'Unknown error during static analysis' };
    }
  }

  async llmReview(findings: any[]): Promise<any> {
    const prompt = `Review the following static analysis findings for severity, accuracy, and remediation. Return a JSON array with severity, false positive assessment, and improved remediation for each finding.\n\n${JSON.stringify(findings, null, 2)}`;
    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mistral', prompt, stream: false })
    });
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    const data = await response.json();
    if (typeof data === 'object' && data !== null && 'response' in data && typeof (data as any).response === 'string') {
      return { response: (data as any).response };
    } else {
      throw new Error('Unexpected response format from Ollama');
    }
  }
}

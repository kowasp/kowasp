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
      // Use the CLI analyzer from kowasp-core by spawning a process
      // Write code to a temp file, run analyzer, and return findings
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      const tmpDir = os.tmpdir();
      const tempFile = path.join(tmpDir, filename || `analyze-${Date.now()}.js`);
      await fs.writeFile(tempFile, code, 'utf-8');
      return await new Promise((resolve, reject) => {
        const analyzer = spawn('node', [path.resolve(__dirname, '../../kowasp-core/dist/index.js'), tempFile, '--output-json']);
        let output = '';
        let error = '';
        analyzer.stdout.on('data', (data) => {
          output += data.toString();
        });
        analyzer.stderr.on('data', (data) => {
          error += data.toString();
        });
        analyzer.on('close', (code) => {
          fs.unlink(tempFile).catch(() => {});
          if (code === 0) {
            try {
              const findings = JSON.parse(output);
              resolve(findings);
            } catch (e) {
              console.error('Failed to parse analyzer output:', output, e);
              resolve({ error: 'Failed to parse analyzer output', details: output });
            }
          } else {
            console.error('Analyzer process failed:', error);
            resolve({ error: error || 'Analyzer failed' });
          }
        });
      });
    } catch (err: any) {
      console.error('Static analysis error:', err);
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

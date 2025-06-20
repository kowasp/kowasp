import { AnalysisResult, XSSVulnerability } from '../types/analyzer';
import * as fs from 'fs';

export class HtmlReporter {
    public generate(result: AnalysisResult): string {
        const vulnerabilities = result.vulnerabilities.map(vuln => this.renderVulnerability(vuln)).join('');
        const recommendations = result.recommendations.map(rec => `<li>${rec}</li>`).join('');
        const missingHeaders = result.missingSecurityHeaders.map(header => `<li>${header}</li>`).join('');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>KOWASP Security Analysis Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
                    h1, h2, h3 { color: #333; }
                    .container { background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    .summary { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
                    .vulnerability { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
                    .vulnerability.high { border-left: 5px solid #d9534f; }
                    .vulnerability.medium { border-left: 5px solid #f0ad4e; }
                    .vulnerability.low { border-left: 5px solid #5bc0de; }
                    .vuln-title { font-weight: bold; font-size: 1.1em; }
                    code { background-color: #eee; padding: 2px 4px; border-radius: 3px; }
                    pre { background-color: #eee; padding: 10px; border-radius: 3px; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>KOWASP Security Analysis Report</h1>
                    <div class="summary">
                        <h2>Summary</h2>
                        <p><strong>Total Vulnerabilities:</strong> ${result.vulnerabilities.length}</p>
                    </div>

                    ${vulnerabilities ? `<h2>Vulnerabilities</h2>${vulnerabilities}` : ''}
                    
                    <h2>Express Security Configuration</h2>
                    <ul>
                        <li>Helmet: ${result.expressConfig.helmet ? '✓' : '✗'}</li>
                        <li>Content Security Policy: ${result.expressConfig.contentSecurityPolicy ? '✓' : '✗'}</li>
                        <li>XSS Filter: ${result.expressConfig.xssFilter ? '✓' : '✗'}</li>
                        <li>No Sniff: ${result.expressConfig.noSniff ? '✓' : '✗'}</li>
                        <li>Frame Guard: ${result.expressConfig.frameguard ? '✓' : '✗'}</li>
                        <li>HSTS: ${result.expressConfig.hsts ? '✓' : '✗'}</li>
                    </ul>

                    ${missingHeaders ? `<h3>Missing Security Headers</h3><ul>${missingHeaders}</ul>` : ''}
                    
                    <h2>Recommendations</h2>
                    <ul>${recommendations}</ul>
                </div>
            </body>
            </html>
        `;
    }

    private renderVulnerability(vuln: XSSVulnerability): string {
        return `
            <div class="vulnerability ${vuln.severity}">
                <p class="vuln-title">[${vuln.severity.toUpperCase()}] ${vuln.type}</p>
                <p><strong>Description:</strong> ${vuln.description}</p>
                <p><strong>Location:</strong> <code>${vuln.location.file}:${vuln.location.line}:${vuln.location.column}</code></p>
                <p><strong>Code:</strong></p>
                <pre><code>${this.escapeHtml(vuln.code)}</code></pre>
                <p><strong>Remediation:</strong> ${vuln.remediation}</p>
                <p><strong>Confidence:</strong> ${vuln.confidence * 100}%</p>
            </div>
        `;
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    public writeReport(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content);
    }
} 
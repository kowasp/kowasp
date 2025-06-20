"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XSSAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const ASTAnalyzer_1 = require("./ASTAnalyzer");
const ExpressConfigAnalyzer_1 = require("./ExpressConfigAnalyzer");
const node_fetch_1 = __importDefault(require("node-fetch"));
class XSSAnalyzer {
    constructor(targetDir) {
        this.targetDir = targetDir;
        this.ollamaEndpoint = 'http://localhost:11434/api/generate';
        this.ollamaModel = 'mistral';
    }
    async analyze() {
        const files = await this.findExpressFiles();
        const vulnerabilities = [];
        let expressConfig = {
            helmet: false,
            contentSecurityPolicy: false,
            xssFilter: false,
            noSniff: false,
            frameguard: false,
            hsts: false
        };
        const missingHeaders = [];
        const recommendations = [];
        for (const file of files) {
            if (!fs.statSync(file).isFile())
                continue;
            const code = fs.readFileSync(file, 'utf-8');
            // Analyze AST for XSS vulnerabilities
            const astAnalyzer = new ASTAnalyzer_1.ASTAnalyzer(file);
            const fileVulnerabilities = astAnalyzer.analyze(code);
            vulnerabilities.push(...fileVulnerabilities);
            // Analyze Express configuration
            const configAnalyzer = new ExpressConfigAnalyzer_1.ExpressConfigAnalyzer(file);
            const configResult = configAnalyzer.analyze(code);
            // Merge results
            expressConfig = this.mergeConfigs(expressConfig, configResult.expressConfig);
            missingHeaders.push(...configResult.missingSecurityHeaders);
            recommendations.push(...configResult.recommendations);
            // Treat missing headers as vulnerabilities
            for (const header of configResult.missingSecurityHeaders) {
                vulnerabilities.push({
                    type: 'misconfiguration',
                    severity: 'medium',
                    location: { file, line: 0, column: 0 },
                    description: `Missing security header: ${header}`,
                    code: '',
                    remediation: `Add or configure the ${header} header.`,
                    confidence: 1
                });
            }
            // Treat other major config issues as vulnerabilities
            if (configResult.expressConfig.viewEngine === 'ejs' && configResult.expressConfig.ejsEscapingDisabled) {
                vulnerabilities.push({
                    type: 'misconfiguration',
                    severity: 'high',
                    location: { file, line: 0, column: 0 },
                    description: 'EJS auto-escaping is disabled application-wide. This is a high-risk security vulnerability.',
                    code: '',
                    remediation: 'Enable EJS auto-escaping by removing `app.locals.escape = false`.',
                    confidence: 1
                });
            }
        }
        // Use Ollama for context-aware analysis
        const enhancedVulnerabilities = await this.enhanceVulnerabilities(vulnerabilities);
        return {
            vulnerabilities: enhancedVulnerabilities,
            expressConfig,
            missingSecurityHeaders: [...new Set(missingHeaders)],
            recommendations: [...new Set(recommendations)]
        };
    }
    async findExpressFiles() {
        const patterns = [
            '**/*.js',
            '**/*.jsx'
        ];
        const files = await Promise.all(patterns.map(pattern => (0, glob_1.glob)(pattern, { cwd: this.targetDir, ignore: ['node_modules/**', 'dist/**', 'test/**'] })));
        return files.flat().map(file => path.join(this.targetDir, file));
    }
    mergeConfigs(config1, config2) {
        return {
            helmet: config1.helmet || config2.helmet,
            contentSecurityPolicy: config1.contentSecurityPolicy || config2.contentSecurityPolicy,
            xssFilter: config1.xssFilter || config2.xssFilter,
            noSniff: config1.noSniff || config2.noSniff,
            frameguard: config1.frameguard || config2.frameguard,
            hsts: config1.hsts || config2.hsts
        };
    }
    async enhanceVulnerabilities(vulnerabilities) {
        const enhancedVulnerabilities = [];
        for (const vuln of vulnerabilities) {
            try {
                const prompt = this.createAnalysisPrompt(vuln);
                const analysis = await this.queryOllama(prompt);
                // Update vulnerability with enhanced analysis
                enhancedVulnerabilities.push({
                    ...vuln,
                    description: analysis.description || vuln.description,
                    remediation: analysis.remediation || vuln.remediation,
                    confidence: analysis.confidence || vuln.confidence
                });
            }
            catch (error) {
                console.error('Error enhancing vulnerability:', error);
                enhancedVulnerabilities.push(vuln);
            }
        }
        return enhancedVulnerabilities;
    }
    createAnalysisPrompt(vulnerability) {
        return `Analyze this XSS vulnerability and provide context-aware analysis:
Type: ${vulnerability.type}
Severity: ${vulnerability.severity}
Location: ${vulnerability.location.file}:${vulnerability.location.line}
Code: ${vulnerability.code}

Please provide:
1. A more detailed description of the vulnerability
2. A specific remediation suggestion
3. A confidence score (0-1) based on the context

Format the response as JSON with keys: description, remediation, confidence`;
    }
    async queryOllama(prompt) {
        try {
            const response = await (0, node_fetch_1.default)(this.ollamaEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.ollamaModel,
                    prompt: prompt,
                    stream: false
                })
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            const data = await response.json();
            if (typeof data === 'object' && data !== null && 'response' in data && typeof data.response === 'string') {
                return JSON.parse(data.response);
            }
            else {
                throw new Error('Unexpected response format from Ollama');
            }
        }
        catch (error) {
            console.error('Error querying Ollama:', error);
            return {};
        }
    }
}
exports.XSSAnalyzer = XSSAnalyzer;

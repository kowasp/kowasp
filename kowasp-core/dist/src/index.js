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
const commander_1 = require("commander");
const XSSAnalyzer_1 = require("./XSSAnalyzer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
// Pure functions for file operations
const readFile = (filePath) => fs.readFileSync(filePath, 'utf-8');
const writeFile = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
const resolvePath = (filePath) => path.resolve(filePath);
// Pure functions for file finding
const isJsFile = (file) => /\.(js|jsx|ts|tsx)$/.test(file);
const matchesExcludePattern = (filePath, patterns) => patterns.some(pattern => new RegExp(pattern.replace(/\*/g, '.*')).test(filePath));
const findJsFiles = (dir, excludePatterns) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(entry => {
        const fullPath = path.join(dir, entry.name);
        if (matchesExcludePattern(fullPath, excludePatterns)) {
            return [];
        }
        if (entry.isDirectory()) {
            return findJsFiles(fullPath, excludePatterns);
        }
        return isJsFile(entry.name) ? [fullPath] : [];
    });
};
// Pure functions for displaying results
const formatFinding = (finding, filePath, index) => `
${chalk_1.default.cyan('Finding #' + (index + 1))}
${chalk_1.default.red('Pattern:')} ${finding.pattern_name}
${chalk_1.default.yellow('Description:')} ${finding.description}
${chalk_1.default.magenta('Severity:')} ${finding.severity}
${chalk_1.default.blue('Location:')} ${filePath}:${finding.position[0]}-${finding.position[1]}
${chalk_1.default.green('Matched Code:')} ${finding.matched_text}
${chalk_1.default.cyan('Example:')} ${finding.example}
${'-'.repeat(80)}`;
const displayFindings = (findings, filePath) => {
    if (findings.length === 0) {
        console.log(chalk_1.default.green('No XSS vulnerabilities found!'));
        return;
    }
    findings.forEach((finding, index) => {
        console.log(formatFinding(finding, filePath, index));
    });
};
const displaySummary = (files, findings) => {
    console.log('\n' + chalk_1.default.bold('Scan Summary:'));
    console.log('='.repeat(80));
    console.log(chalk_1.default.blue(`Total files scanned: ${files.length}`));
    console.log(chalk_1.default.yellow(`Files with findings: ${findings.length}`));
    console.log(chalk_1.default.red(`Total findings: ${findings.reduce((sum, f) => sum + f.findings.length, 0)}`));
};
// Main scanning functions
const scanFile = (filePath, outputPath) => {
    console.log(chalk_1.default.blue(`Scanning file: ${filePath}`));
    const content = readFile(filePath);
    const analyzer = new XSSAnalyzer_1.XSSAnalyzer();
    const findings = analyzer.analyze(content);
    console.log('\n' + chalk_1.default.bold('XSS Scanner Results:'));
    console.log('='.repeat(80));
    displayFindings(findings, filePath);
    if (outputPath && findings.length > 0) {
        writeFile(outputPath, findings);
        console.log(chalk_1.default.green(`\nResults saved to: ${outputPath}`));
    }
};
const scanDirectory = (dirPath, excludePatterns, outputPath) => {
    console.log(chalk_1.default.blue(`Scanning directory: ${dirPath}`));
    const analyzer = new XSSAnalyzer_1.XSSAnalyzer();
    const files = findJsFiles(dirPath, excludePatterns);
    const allFindings = [];
    files.forEach(file => {
        console.log(chalk_1.default.blue(`\nScanning: ${file}`));
        const content = readFile(file);
        const findings = analyzer.analyze(content);
        if (findings.length > 0) {
            allFindings.push({ file, findings });
            displayFindings(findings, file);
        }
    });
    displaySummary(files, allFindings);
    if (outputPath && allFindings.length > 0) {
        writeFile(outputPath, allFindings);
        console.log(chalk_1.default.green(`\nResults saved to: ${outputPath}`));
    }
};
// CLI setup
const program = new commander_1.Command();
program
    .name('kowasp')
    .description('XSS Scanner with AST analysis')
    .version('1.0.0');
program
    .command('scan')
    .description('Scan JavaScript code for XSS vulnerabilities')
    .requiredOption('-f, --file <path>', 'Path to the JavaScript file to scan')
    .option('-o, --output <path>', 'Path to save the scan results (JSON format)')
    .action((options) => {
    try {
        const filePath = resolvePath(options.file);
        scanFile(filePath, options.output);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
        process.exit(1);
    }
});
program
    .command('scan-dir')
    .description('Scan all JavaScript files in a directory for XSS vulnerabilities')
    .requiredOption('-d, --dir <path>', 'Path to the directory to scan')
    .option('-o, --output <path>', 'Path to save the scan results (JSON format)')
    .option('-e, --exclude <patterns...>', 'Glob patterns to exclude')
    .action((options) => {
    try {
        const dirPath = resolvePath(options.dir);
        scanDirectory(dirPath, options.exclude || [], options.output);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
        process.exit(1);
    }
});
program.parse();

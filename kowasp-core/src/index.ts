import { Command } from 'commander';
import { XSSAnalyzer } from './XSSAnalyzer';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

// Pure functions for file operations
const readFile = (filePath: string): string =>
    fs.readFileSync(filePath, 'utf-8');

const writeFile = (filePath: string, data: any): void =>
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

const resolvePath = (filePath: string): string =>
    path.resolve(filePath);

// Pure functions for file finding
const isJsFile = (file: string): boolean =>
    /\.(js|jsx|ts|tsx)$/.test(file);

const matchesExcludePattern = (filePath: string, patterns: string[]): boolean =>
    patterns.some(pattern => 
        new RegExp(pattern.replace(/\*/g, '.*')).test(filePath)
    );

const findJsFiles = (dir: string, excludePatterns: string[]): string[] => {
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
const formatFinding = (finding: any, filePath: string, index: number): string => `
${chalk.cyan('Finding #' + (index + 1))}
${chalk.red('Pattern:')} ${finding.pattern_name}
${chalk.yellow('Description:')} ${finding.description}
${chalk.magenta('Severity:')} ${finding.severity}
${chalk.blue('Location:')} ${filePath}:${finding.position[0]}-${finding.position[1]}
${chalk.green('Matched Code:')} ${finding.matched_text}
${chalk.cyan('Example:')} ${finding.example}
${'-'.repeat(80)}`;

const displayFindings = (findings: any[], filePath: string): void => {
    if (findings.length === 0) {
        console.log(chalk.green('No XSS vulnerabilities found!'));
        return;
    }

    findings.forEach((finding, index) => {
        console.log(formatFinding(finding, filePath, index));
    });
};

const displaySummary = (files: string[], findings: { file: string; findings: any[] }[]): void => {
    console.log('\n' + chalk.bold('Scan Summary:'));
    console.log('='.repeat(80));
    console.log(chalk.blue(`Total files scanned: ${files.length}`));
    console.log(chalk.yellow(`Files with findings: ${findings.length}`));
    console.log(chalk.red(`Total findings: ${findings.reduce((sum, f) => sum + f.findings.length, 0)}`));
};

// Main scanning functions
const scanFile = (filePath: string, outputPath?: string): void => {
    console.log(chalk.blue(`Scanning file: ${filePath}`));
    
    const content = readFile(filePath);
    const analyzer = new XSSAnalyzer();
    const findings = analyzer.analyze(content);

    console.log('\n' + chalk.bold('XSS Scanner Results:'));
    console.log('='.repeat(80));

    displayFindings(findings, filePath);

    if (outputPath && findings.length > 0) {
        writeFile(outputPath, findings);
        console.log(chalk.green(`\nResults saved to: ${outputPath}`));
    }
};

const scanDirectory = (dirPath: string, excludePatterns: string[], outputPath?: string): void => {
    console.log(chalk.blue(`Scanning directory: ${dirPath}`));

    const analyzer = new XSSAnalyzer();
    const files = findJsFiles(dirPath, excludePatterns);
    const allFindings: { file: string; findings: any[] }[] = [];

    files.forEach(file => {
        console.log(chalk.blue(`\nScanning: ${file}`));
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
        console.log(chalk.green(`\nResults saved to: ${outputPath}`));
    }
};

// CLI setup
const program = new Command();

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
        } catch (error) {
            console.error(chalk.red('Error:'), error);
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
        } catch (error) {
            console.error(chalk.red('Error:'), error);
            process.exit(1);
        }
    });

program.parse(); 
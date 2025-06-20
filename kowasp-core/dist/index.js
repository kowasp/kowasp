"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const XSSAnalyzer_1 = require("./analyzer/XSSAnalyzer");
const HtmlReporter_1 = require("./reporting/HtmlReporter");
const chalk_1 = __importDefault(require("chalk"));
// CLI setup
const program = new commander_1.Command();
program
    .name('kowasp')
    .description('XSS Scanner with AST analysis')
    .version('1.0.0')
    .argument('<targetDir>', 'Target directory to analyze')
    .option('--output-html <path>', 'Path to save the HTML report')
    .action(main);
program.parse();
async function main(targetDir, options) {
    console.log(chalk_1.default.blue('Starting XSS analysis...'));
    console.log(chalk_1.default.blue(`Target directory: ${targetDir}`));
    try {
        const analyzer = new XSSAnalyzer_1.XSSAnalyzer(targetDir);
        const result = await analyzer.analyze();
        // Print results to console
        console.log('\n' + chalk_1.default.green('Analysis Results:'));
        console.log('==================');
        // Print vulnerabilities
        if (result.vulnerabilities.length > 0) {
            console.log('\n' + chalk_1.default.red('XSS Vulnerabilities Found:'));
            result.vulnerabilities.forEach(vuln => {
                console.log(chalk_1.default.yellow(`\n[${vuln.severity.toUpperCase()}] ${vuln.type} XSS`));
                console.log(`Location: ${vuln.location.file}:${vuln.location.line}`);
                console.log(`Description: ${vuln.description}`);
                console.log(`Code: ${vuln.code}`);
                console.log(`Remediation: ${vuln.remediation}`);
                console.log(`Confidence: ${(vuln.confidence * 100).toFixed(1)}%`);
            });
        }
        else {
            console.log('\n' + chalk_1.default.green('No XSS vulnerabilities found!'));
        }
        // Print Express configuration
        console.log('\n' + chalk_1.default.blue('Express Security Configuration:'));
        console.log('=============================');
        console.log(`Helmet: ${result.expressConfig.helmet ? chalk_1.default.green('✓') : chalk_1.default.red('✗')}`);
        console.log(`Content Security Policy: ${result.expressConfig.contentSecurityPolicy ? chalk_1.default.green('✓') : chalk_1.default.red('✗')}`);
        console.log(`XSS Filter: ${result.expressConfig.xssFilter ? chalk_1.default.green('✓') : chalk_1.default.red('✗')}`);
        console.log(`No Sniff: ${result.expressConfig.noSniff ? chalk_1.default.green('✓') : chalk_1.default.red('✗')}`);
        console.log(`Frame Guard: ${result.expressConfig.frameguard ? chalk_1.default.green('✓') : chalk_1.default.red('✗')}`);
        console.log(`HSTS: ${result.expressConfig.hsts ? chalk_1.default.green('✓') : chalk_1.default.red('✗')}`);
        // Print missing headers
        if (result.missingSecurityHeaders.length > 0) {
            console.log('\n' + chalk_1.default.yellow('Missing Security Headers:'));
            result.missingSecurityHeaders.forEach(header => {
                console.log(`- ${header}`);
            });
        }
        // Print recommendations
        if (result.recommendations.length > 0) {
            console.log('\n' + chalk_1.default.blue('Recommendations:'));
            result.recommendations.forEach(rec => {
                console.log(`- ${rec}`);
            });
        }
        // Generate HTML report if requested
        if (options.outputHtml) {
            const reporter = new HtmlReporter_1.HtmlReporter();
            const htmlContent = reporter.generate(result);
            reporter.writeReport(options.outputHtml, htmlContent);
            console.log(chalk_1.default.green(`\nHTML report saved to: ${options.outputHtml}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Error during analysis:'), error);
        process.exit(1);
    }
}

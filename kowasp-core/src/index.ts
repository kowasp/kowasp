import { Command } from 'commander';
import { XSSAnalyzer } from './analyzer/XSSAnalyzer';
import { HtmlReporter } from './reporting/HtmlReporter';
import chalk from 'chalk';
import * as fs from 'fs';

// CLI setup
const program = new Command();

program
    .name('kowasp')
    .description('XSS Scanner with AST analysis')
    .version('1.0.0')
    .argument('<target>', 'Target file or directory to analyze')
    .option('--output-html <path>', 'Path to save the HTML report')
    .option('--output-json', 'Output findings as JSON')
    .action(main);

program.parse();

async function main(target: string, options: { outputHtml?: string, outputJson?: boolean }) {
    if (!fs.existsSync(target)) {
        console.error(`Target path does not exist: ${target}`);
        process.exit(1);
    }
    const analyzer = new XSSAnalyzer(target);
    const result = await analyzer.analyze();

    if (options.outputJson) {
        // Output ONLY JSON, no banners or extra text
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    console.log(chalk.blue('Starting XSS analysis...'));
    console.log(chalk.blue(`Target directory: ${target}`));

    try {
        // Print results to console
        console.log('\n' + chalk.green('Analysis Results:'));
        console.log('==================');

        // Print vulnerabilities
        if (result.vulnerabilities.length > 0) {
            console.log('\n' + chalk.red('XSS Vulnerabilities Found:'));
            result.vulnerabilities.forEach(vuln => {
                console.log(chalk.yellow(`\n[${vuln.severity.toUpperCase()}] ${vuln.type} XSS`));
                console.log(`Location: ${vuln.location.file}:${vuln.location.line}`);
                console.log(`Description: ${vuln.description}`);
                console.log(`Code: ${vuln.code}`);
                console.log(`Remediation: ${vuln.remediation}`);
                console.log(`Confidence: ${(vuln.confidence * 100).toFixed(1)}%`);
            });
        } else {
            console.log('\n' + chalk.green('No XSS vulnerabilities found!'));
        }

        // Print Express configuration
        console.log('\n' + chalk.blue('Express Security Configuration:'));
        console.log('=============================');
        console.log(`Helmet: ${result.expressConfig.helmet ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`Content Security Policy: ${result.expressConfig.contentSecurityPolicy ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`XSS Filter: ${result.expressConfig.xssFilter ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`No Sniff: ${result.expressConfig.noSniff ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`Frame Guard: ${result.expressConfig.frameguard ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`HSTS: ${result.expressConfig.hsts ? chalk.green('✓') : chalk.red('✗')}`);

        // Print missing headers
        if (result.missingSecurityHeaders.length > 0) {
            console.log('\n' + chalk.yellow('Missing Security Headers:'));
            result.missingSecurityHeaders.forEach(header => {
                console.log(`- ${header}`);
            });
        }

        // Print recommendations
        if (result.recommendations.length > 0) {
            console.log('\n' + chalk.blue('Recommendations:'));
            result.recommendations.forEach(rec => {
                console.log(`- ${rec}`);
            });
        }

        // Generate HTML report if requested
        if (options.outputHtml) {
            const reporter = new HtmlReporter();
            const htmlContent = reporter.generate(result);
            reporter.writeReport(options.outputHtml, htmlContent);
            console.log(chalk.green(`\nHTML report saved to: ${options.outputHtml}`));
        }

    } catch (error) {
        console.error(chalk.red('Error during analysis:'), error);
        process.exit(1);
    }
} 
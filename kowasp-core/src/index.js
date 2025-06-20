"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var XSSAnalyzer_1 = require("./XSSAnalyzer");
var fs = require("fs");
var path = require("path");
var chalk_1 = require("chalk");
// Pure functions for file operations
var readFile = function (filePath) {
    return fs.readFileSync(filePath, 'utf-8');
};
var writeFile = function (filePath, data) {
    return fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
var resolvePath = function (filePath) {
    return path.resolve(filePath);
};
// Pure functions for file finding
var isJsFile = function (file) {
    return /\.(js|jsx|ts|tsx)$/.test(file);
};
var matchesExcludePattern = function (filePath, patterns) {
    return patterns.some(function (pattern) {
        return new RegExp(pattern.replace(/\*/g, '.*')).test(filePath);
    });
};
var findJsFiles = function (dir, excludePatterns) {
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(function (entry) {
        var fullPath = path.join(dir, entry.name);
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
var formatFinding = function (finding, filePath, index) { return "\n".concat(chalk_1.default.cyan('Finding #' + (index + 1)), "\n").concat(chalk_1.default.red('Pattern:'), " ").concat(finding.pattern_name, "\n").concat(chalk_1.default.yellow('Description:'), " ").concat(finding.description, "\n").concat(chalk_1.default.magenta('Severity:'), " ").concat(finding.severity, "\n").concat(chalk_1.default.blue('Location:'), " ").concat(filePath, ":").concat(finding.position[0], "-").concat(finding.position[1], "\n").concat(chalk_1.default.green('Matched Code:'), " ").concat(finding.matched_text, "\n").concat(chalk_1.default.cyan('Example:'), " ").concat(finding.example, "\n").concat('-'.repeat(80)); };
var displayFindings = function (findings, filePath) {
    if (findings.length === 0) {
        console.log(chalk_1.default.green('No XSS vulnerabilities found!'));
        return;
    }
    findings.forEach(function (finding, index) {
        console.log(formatFinding(finding, filePath, index));
    });
};
var displaySummary = function (files, findings) {
    console.log('\n' + chalk_1.default.bold('Scan Summary:'));
    console.log('='.repeat(80));
    console.log(chalk_1.default.blue("Total files scanned: ".concat(files.length)));
    console.log(chalk_1.default.yellow("Files with findings: ".concat(findings.length)));
    console.log(chalk_1.default.red("Total findings: ".concat(findings.reduce(function (sum, f) { return sum + f.findings.length; }, 0))));
};
// Main scanning functions
var scanFile = function (filePath, outputPath) {
    console.log(chalk_1.default.blue("Scanning file: ".concat(filePath)));
    var content = readFile(filePath);
    var analyzer = new XSSAnalyzer_1.XSSAnalyzer();
    var findings = analyzer.analyze(content);
    console.log('\n' + chalk_1.default.bold('XSS Scanner Results:'));
    console.log('='.repeat(80));
    displayFindings(findings, filePath);
    if (outputPath && findings.length > 0) {
        writeFile(outputPath, findings);
        console.log(chalk_1.default.green("\nResults saved to: ".concat(outputPath)));
    }
};
var scanDirectory = function (dirPath, excludePatterns, outputPath) {
    console.log(chalk_1.default.blue("Scanning directory: ".concat(dirPath)));
    var analyzer = new XSSAnalyzer_1.XSSAnalyzer();
    var files = findJsFiles(dirPath, excludePatterns);
    var allFindings = [];
    files.forEach(function (file) {
        console.log(chalk_1.default.blue("\nScanning: ".concat(file)));
        var content = readFile(file);
        var findings = analyzer.analyze(content);
        if (findings.length > 0) {
            allFindings.push({ file: file, findings: findings });
            displayFindings(findings, file);
        }
    });
    displaySummary(files, allFindings);
    if (outputPath && allFindings.length > 0) {
        writeFile(outputPath, allFindings);
        console.log(chalk_1.default.green("\nResults saved to: ".concat(outputPath)));
    }
};
// CLI setup
var program = new commander_1.Command();
program
    .name('kowasp')
    .description('XSS Scanner with AST analysis')
    .version('1.0.0');
program
    .command('scan')
    .description('Scan JavaScript code for XSS vulnerabilities')
    .requiredOption('-f, --file <path>', 'Path to the JavaScript file to scan')
    .option('-o, --output <path>', 'Path to save the scan results (JSON format)')
    .action(function (options) {
    try {
        var filePath = resolvePath(options.file);
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
    .action(function (options) {
    try {
        var dirPath = resolvePath(options.dir);
        scanDirectory(dirPath, options.exclude || [], options.output);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error);
        process.exit(1);
    }
});
program.parse();

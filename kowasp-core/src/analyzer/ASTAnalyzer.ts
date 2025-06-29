import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';
import { ASTNode, XSSVulnerability, XSSPattern } from '../types/analyzer';
import { xssPatterns } from '../patterns/xss-patterns';

export class ASTAnalyzer {
    private vulnerabilities: XSSVulnerability[] = [];

    constructor(private filePath: string) {}

    public analyze(code: string): XSSVulnerability[] {
        try {
            // Try parsing as JSX first, fallback to regular JavaScript
            let ast;
            try {
                ast = esprima.parseScript(code, { 
                    loc: true, 
                    jsx: true,
                    tokens: true,
                    comment: true
                });
            } catch (jsxError) {
                // Fallback to regular JavaScript parsing
                ast = esprima.parseScript(code, { 
                    loc: true,
                    tokens: true,
                    comment: true
                });
            }
            
            console.log('AST parsed successfully for:', this.filePath);
            this.traverseAST(ast as any);
            console.log('Found vulnerabilities:', this.vulnerabilities.length);
            return this.vulnerabilities;
        } catch (error) {
            console.error(`Error analyzing file ${this.filePath}:`, error);
            return [];
        }
    }

    private traverseAST(ast: ASTNode): void {
        try {
            estraverse.traverse(ast as any, {
                enter: (node: any) => {
                    this.checkNode(node);
                }
            });
        } catch (error) {
            // If estraverse fails (e.g., with JSX), fall back to simple regex-based analysis
            this.fallbackAnalysis(ast);
        }
    }

    private fallbackAnalysis(ast: ASTNode): void {
        const code = this.getNodeCode(ast);
        xssPatterns.forEach(pattern => {
            if (new RegExp(pattern.pattern, 'i').test(code)) {
                // Additional context checks for fallback analysis to reduce false positives
                let shouldAdd = true;
                
                if (pattern.id === 'dom-2') {
                    // For eval/setTimeout patterns, check if there's actual user input
                    shouldAdd = /(?:userInput|req\.|document\.location|\$\{)/.test(code);
                } else if (pattern.id === 'dom-3') {
                    // For location-based XSS, check if location data is actually used
                    shouldAdd = /(?:document\.)?location\.(?:hash|search|href|pathname)/.test(code) && 
                               /(?:document\.write|\.innerHTML|\.outerHTML)/.test(code);
                } else if (pattern.id === 'event-1') {
                    // For event handlers, check if there's user input in the handler
                    shouldAdd = /on(?:load|error|click|mouseover|focus|blur)\s*=/.test(code) && 
                               /(?:userInput|\$\{|req\.)/.test(code);
                } else if (pattern.id === 'framework-1') {
                    // For React dangerouslySetInnerHTML, check for __html usage
                    shouldAdd = /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/.test(code);
                } else if (pattern.id === 'reflected-1') {
                    // For reflected XSS, check if there's actual user input and no sanitization
                    shouldAdd = /(?:req\.(?:query|body|params)|\$\{)/.test(code) && 
                               !/(?:xss\(|sanitize\(|DOMPurify\.sanitize\()/.test(code);
                } else if (pattern.id === 'stored-1') {
                    // For stored XSS, check if there's actual user input and no sanitization
                    shouldAdd = /(?:userInput|req\.(?:query|body|params)|\$\{|getUserInput\()/.test(code) && 
                               !/(?:xss\(|sanitize\(|DOMPurify\.sanitize\()/.test(code);
                }
                
                if (shouldAdd) {
                    const vulnerability: XSSVulnerability = {
                        type: pattern.category,
                        severity: pattern.severity,
                        location: {
                            file: this.filePath,
                            line: 1,
                            column: 1
                        },
                        description: pattern.description,
                        code: code.substring(0, 100) + '...',
                        remediation: pattern.remediation,
                        confidence: 0.6 // Lower confidence for fallback analysis
                    };
                    this.vulnerabilities.push(vulnerability);
                }
            }
        });
    }

    private checkNode(node: ASTNode): void {
        xssPatterns.forEach(pattern => {
            const nodeCode = this.getNodeCode(node);
            if (new RegExp(pattern.pattern, 'i').test(nodeCode)) {
                console.log(`Pattern ${pattern.id} matched for node:`, nodeCode.substring(0, 100));
                // More specific checks for patterns to reduce false positives
                if (pattern.id === 'nosql-injection-1') {
                    if (this.isNoSQLInjectionNode(node)) {
                        this.addVulnerability(node, pattern);
                    }
                } else if (pattern.id === 'dom-1') {
                    if (this.isDOMXSSNode(node)) {
                        this.addVulnerability(node, pattern);
                    }
                } else if (pattern.id === 'dom-2') {
                    if (this.isUnsafeJSFunctionNode(node)) {
                        this.addVulnerability(node, pattern);
                    }
                } else if (pattern.id === 'dom-3') {
                    if (this.isURLBasedXSSNode(node)) {
                        console.log('DOM-3 specific check passed');
                        this.addVulnerability(node, pattern);
                    } else {
                        console.log('DOM-3 specific check failed');
                    }
                } else if (pattern.id === 'event-1') {
                    if (this.isEventHandlerNode(node)) {
                        this.addVulnerability(node, pattern);
                    }
                } else if (pattern.id === 'file-upload-1') {
                    if (this.isFileUploadNode(node)) {
                        this.addVulnerability(node, pattern);
                    }
                } else if (pattern.id === 'framework-1') {
                    if (this.isReactDangerouslySetInnerHTMLNode(node)) {
                        console.log('Framework-1 specific check passed');
                        this.addVulnerability(node, pattern);
                    } else {
                        console.log('Framework-1 specific check failed');
                    }
                } else if (pattern.id === 'js-url-1') {
                    if (this.isJSURLNode(node)) {
                        this.addVulnerability(node, pattern);
                    }
                } else if (pattern.id === 'reflected-1') {
                    if (this.isReflectedXSSNode(node)) {
                        this.addVulnerability(node, pattern);
                    }
                } else if (pattern.id === 'stored-1') {
                    if (this.isStoredXSSNode(node)) {
                        console.log('Stored-1 specific check passed');
                        this.addVulnerability(node, pattern);
                    } else {
                        console.log('Stored-1 specific check failed');
                    }
                } else {
                    // For patterns without specific checks, use the regex match
                    this.addVulnerability(node, pattern);
                }
            }
        });
    }

    private isDOMXSSNode(node: ASTNode): boolean {
        return node.type === 'AssignmentExpression' && 
               node.left.type === 'MemberExpression' && 
               /innerHTML|outerHTML/.test(this.getNodeCode(node.left));
    }

    private isUnsafeJSFunctionNode(node: ASTNode): boolean {
        const nodeCode = this.getNodeCode(node);
        // Check for eval, Function, setTimeout, setInterval with user input
        const hasUnsafeFunction = /(?:eval|Function|setTimeout|setInterval)\s*\(/.test(nodeCode);
        const hasUserInput = /(?:userInput|req\.|document\.location|\$\{)/.test(nodeCode);
        return hasUnsafeFunction && hasUserInput;
    }

    private isURLBasedXSSNode(node: ASTNode): boolean {
        const nodeCode = this.getNodeCode(node);
        // Check for location-based data being written to DOM
        const hasLocationData = /(?:document\.)?location\.(?:hash|search|href|pathname)/.test(nodeCode);
        const hasDOMWrite = /(?:document\.write|\.innerHTML|\.outerHTML)/.test(nodeCode);
        return hasLocationData && hasDOMWrite;
    }

    private isEventHandlerNode(node: ASTNode): boolean {
        const nodeCode = this.getNodeCode(node);
        // Check for inline event handlers with template literals or user input
        const hasInlineHandler = /on(?:load|error|click|mouseover|focus|blur)\s*=/.test(nodeCode);
        const hasUserInput = /(?:userInput|\$\{|req\.)/.test(nodeCode);
        return hasInlineHandler && hasUserInput;
    }

    private isJSURLNode(node: ASTNode): boolean {
        const nodeCode = this.getNodeCode(node);
        // Check for javascript: URLs in href attributes
        return /href\s*=\s*["']javascript:/.test(nodeCode);
    }

    private isFileUploadNode(node: ASTNode): boolean {
        // Check for import declarations
        if (node.type === 'ImportDeclaration') {
            const source = node.source?.value;
            return source === 'multer' || source === 'express-fileupload';
        }

        // Check for require calls
        if (
            node.type === 'CallExpression' &&
            node.callee?.name === 'require' &&
            node.arguments?.[0]?.type === 'Literal'
        ) {
            const source = node.arguments[0].value;
            return source === 'multer' || source === 'express-fileupload';
        }

        return false;
    }

    private isNoSQLInjectionNode(node: ASTNode): boolean {
        if (node.type !== 'CallExpression') {
            return false;
        }

        const callee = node.callee;
        if (callee?.type !== 'MemberExpression') {
            return false;
        }

        const propertyName = callee.property?.name;
        const isDbMethod = ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(propertyName);

        if (!isDbMethod) {
            return false;
        }

        // A simple heuristic: check if user input is passed directly.
        const argument = node.arguments?.[0];
        if (argument) {
            const nodeCode = this.getNodeCode(argument);
            return nodeCode.includes('req.query') || nodeCode.includes('req.body');
        }

        return false;
    }

    private isReactDangerouslySetInnerHTMLNode(node: ASTNode): boolean {
        const nodeCode = this.getNodeCode(node);
        // Check for dangerouslySetInnerHTML usage with __html
        return /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/.test(nodeCode);
    }

    private isReflectedXSSNode(node: ASTNode): boolean {
        const nodeCode = this.getNodeCode(node);
        // Check for response methods with user input, but exclude sanitized versions
        const hasResponseMethod = /res\.(?:send|render|json|write)/.test(nodeCode);
        const hasUserInput = /(?:req\.(?:query|body|params)|\$\{)/.test(nodeCode);
        const isSanitized = /(?:xss\(|sanitize\(|DOMPurify\.sanitize\()/.test(nodeCode);
        return hasResponseMethod && hasUserInput && !isSanitized;
    }

    private isStoredXSSNode(node: ASTNode): boolean {
        const nodeCode = this.getNodeCode(node);
        // Check for database operations with user input, including function calls and template literals
        const hasDbOperation = /(?:db|database|collection)\.(?:insert|update|save)/.test(nodeCode);
        const hasUserInput = /(?:userInput|req\.(?:query|body|params)|\$\{|getUserInput\()/.test(nodeCode);
        const isSanitized = /(?:xss\(|sanitize\(|DOMPurify\.sanitize\()/.test(nodeCode);
        return hasDbOperation && hasUserInput && !isSanitized;
    }

    private getNodeCode(node: ASTNode): string {
        try {
            return escodegen.generate(node);
        } catch (e) {
            return JSON.stringify(node);
        }
    }

    private addVulnerability(node: ASTNode, pattern: XSSPattern): void {
        if (!node.loc) return;

        const vulnerability: XSSVulnerability = {
            type: pattern.category,
            severity: pattern.severity,
            location: {
                file: this.filePath,
                line: node.loc.start.line,
                column: node.loc.start.column
            },
            description: pattern.description,
            code: this.getNodeCode(node),
            remediation: pattern.remediation,
            confidence: 0.8 // This would be calculated based on context in a real implementation
        };

        this.vulnerabilities.push(vulnerability);
    }
} 
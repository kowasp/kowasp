import traverse from '@babel/traverse';
import { parse } from '@babel/parser';
import * as path from 'path';
import { ASTNode, XSSVulnerability, XSSPattern } from '../types/analyzer';
import { xssPatterns } from '../patterns/xss-patterns';

export class ASTAnalyzer {
    private vulnerabilities: XSSVulnerability[] = [];
    private checkers: { [key: string]: (node: ASTNode, code: string) => boolean };
    private taintedVars: Set<string> = new Set();

    constructor(private filePath: string) {
        this.checkers = {
            'nosql-injection-1': this.isNoSQLInjectionNode.bind(this),
            'dom-1': this.isDOMXSSNode.bind(this),
            'dom-2': this.isUnsafeJSFunctionNode.bind(this),
            'dom-3': this.isURLBasedXSSNode.bind(this),
            'event-1': this.isEventHandlerNode.bind(this),
            'file-upload-1': this.isFileUploadNode.bind(this),
            'framework-1': this.isReactDangerouslySetInnerHTMLNode.bind(this),
            'js-url-1': this.isJSURLNode.bind(this),
            'reflected-1': this.isReflectedXSSNode.bind(this),
            'stored-1': this.isStoredXSSNode.bind(this),
        };
    }

    public analyze(code: string): XSSVulnerability[] {
        this.vulnerabilities = [];
        this.taintedVars = new Set();
        try {
            const ast = parse(code, {
                sourceType: 'unambiguous',
                plugins: [
                    'jsx',
                    'typescript',
                    'classProperties',
                    'optionalChaining',
                    'nullishCoalescingOperator',
                    'objectRestSpread',
                    'dynamicImport',
                ],
                ranges: true,
                tokens: true,
                errorRecovery: true,
            });
            this.traverseAST(ast as any, code);
        } catch (error: any) {
            console.error(`Error analyzing file ${this.filePath}:`, error);
            throw new Error(`Failed to parse the code. Please ensure it is valid JavaScript/JSX. Error: ${error.message}`);
        }
        return this.vulnerabilities;
    }

    private traverseAST(ast: ASTNode, code: string): void {
        const analyzer = this;
        const visitor = {
            enter: (path: any) => {
                analyzer.trackTaint(path.node, code);
                analyzer.checkNode(path.node, code);
            }
        };
        traverse(ast as any, visitor);
    }

    private checkNode(node: ASTNode, code: string): void {
        xssPatterns.forEach(pattern => {
            const specificChecker = this.checkers[pattern.id];
            let isVulnerable = false;

            if (specificChecker) {
                if (specificChecker(node, code)) {
                    isVulnerable = true;
                }
            } else {
                const nodeCode = this.getNodeCode(node, code);
                if (nodeCode && new RegExp(pattern.pattern, 'i').test(nodeCode)) {
                    isVulnerable = true;
                }
            }

            if (isVulnerable) {
                this.addVulnerability(node, pattern, code);
            }
        });
    }

    private getNodeCode(node: ASTNode, code: string): string {
        if (node.range) {
            return code.substring(node.range[0], node.range[1]);
        }
        if (typeof node.start === 'number' && typeof node.end === 'number') {
            return code.substring(node.start, node.end);
        }
        return '';
    }
    
    private addVulnerability(node: ASTNode, pattern: XSSPattern, code: string): void {
        const vulnerability: XSSVulnerability = {
            type: pattern.category,
            severity: pattern.severity,
            location: {
                file: path.basename(this.filePath),
                line: node.loc ? node.loc.start.line : 0,
                column: node.loc ? node.loc.start.column : 0
            },
            description: pattern.description,
            code: this.getNodeCode(node, code),
            remediation: pattern.remediation,
            confidence: 0.8
        };
        this.vulnerabilities.push(vulnerability);
    }

    // Track tainted variables (user input sources)
    private trackTaint(node: ASTNode, code: string): void {
        // Variable declaration: const foo = getUserInput();
        if (node.type === 'VariableDeclarator' && node.id && node.init) {
            const varName = node.id.name;
            const initCode = this.getNodeCode(node.init, code);
            if (/(getUserInput\(\)|req\.(body|query|params)|userInput|document\.location)/.test(initCode)) {
                this.taintedVars.add(varName);
            }
            // Propagate taint through template literals
            if (node.init.type === 'TemplateLiteral') {
                for (const expr of node.init.expressions || []) {
                    if (expr.type === 'Identifier' && this.taintedVars.has(expr.name)) {
                        this.taintedVars.add(varName);
                    }
                }
            }
        }
        // Assignment: foo = getUserInput();
        if (node.type === 'AssignmentExpression' && node.left && node.right) {
            if (node.left.type === 'Identifier') {
                const varName = node.left.name;
                const rightCode = this.getNodeCode(node.right, code);
                if (/(getUserInput\(\)|req\.(body|query|params)|userInput|document\.location)/.test(rightCode)) {
                    this.taintedVars.add(varName);
                }
                // Propagate taint through template literals
                if (node.right.type === 'TemplateLiteral') {
                    for (const expr of node.right.expressions || []) {
                        if (expr.type === 'Identifier' && this.taintedVars.has(expr.name)) {
                            this.taintedVars.add(varName);
                        }
                    }
                }
            }
        }
    }

    // --- Specific Checkers ---

    private isDOMXSSNode(node: ASTNode, code: string): boolean {
        return node.type === 'AssignmentExpression' && 
               node.left.type === 'MemberExpression' && 
               /innerHTML|outerHTML/.test(this.getNodeCode(node.left, code));
    }

    private isUnsafeJSFunctionNode(node: ASTNode, code: string): boolean {
        // Dangerous function call with tainted argument
        if (node.type === 'CallExpression' && node.callee) {
            const calleeName = node.callee.name || (node.callee.type === 'Identifier' && node.callee.name);
            if (/^(eval|Function|setTimeout|setInterval)$/.test(calleeName)) {
                // Check if any argument is tainted or contains tainted variables
                for (const arg of node.arguments) {
                    if (arg.type === 'Identifier' && this.taintedVars.has(arg.name)) {
                        const isSanitized = /(xss|sanitize)/i.test(code);
                        return !isSanitized;
                    }
                    if (arg.type === 'TemplateLiteral') {
                        for (const expr of arg.expressions || []) {
                            if (expr.type === 'Identifier' && this.taintedVars.has(expr.name)) {
                                const isSanitized = /(xss|sanitize)/i.test(code);
                                return !isSanitized;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    private isURLBasedXSSNode(node: ASTNode, code: string): boolean {
        const nodeCode = this.getNodeCode(node, code);
        const hasDOMWrite = /(?:document\.write|\.innerHTML|\.outerHTML)/.test(nodeCode);
        if (hasDOMWrite) {
            const hasLocationData = /(?:document\.)?location\.(?:hash|search|href|pathname)/.test(code);
            return hasLocationData;
        }
        return false;
    }

    private isEventHandlerNode(node: ASTNode, code: string): boolean {
        const nodeCode = this.getNodeCode(node, code);
        const hasInlineHandler = /on(?:load|error|click|mouseover|focus|blur)\s*=/.test(nodeCode);
        const hasUserInput = /(?:userInput|\$\{|req\.)/.test(nodeCode);
        return hasInlineHandler && hasUserInput;
    }

    private isJSURLNode(node: ASTNode, code: string): boolean {
        const nodeCode = this.getNodeCode(node, code);
        return /href\s*=\s*["']javascript:/.test(nodeCode);
    }

    private isFileUploadNode(node: ASTNode, code: string): boolean {
        if (node.type === 'ImportDeclaration') return ['multer', 'express-fileupload'].includes(node.source?.value);
        if (node.type === 'CallExpression' && node.callee?.name === 'require' && node.arguments?.[0]?.type === 'Literal') {
            return ['multer', 'express-fileupload'].includes(node.arguments[0].value);
        }
        return false;
    }

    private isNoSQLInjectionNode(node: ASTNode, code: string): boolean {
        if (node.type !== 'CallExpression' || node.callee?.type !== 'MemberExpression') return false;
        const isDbMethod = ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(node.callee.property?.name);
        if (!isDbMethod) return false;
        const argument = node.arguments?.[0];
        if (argument) {
            const argCode = this.getNodeCode(argument, code);
            return argCode.includes('req.query') || argCode.includes('req.body');
        }
        return false;
    }

    private isReactDangerouslySetInnerHTMLNode(node: ASTNode, code: string): boolean {
        if (node.type === 'JSXAttribute' && node.name.name === 'dangerouslySetInnerHTML') {
            const isSanitized = /(DOMPurify\.sanitize)/i.test(code);
            return !isSanitized;
        }
        return false;
    }

    private isReflectedXSSNode(node: ASTNode, code: string): boolean {
        const nodeCode = this.getNodeCode(node, code);
        const hasResponseWrite = /res\.(send|write|render|json)/.test(nodeCode);
        if (hasResponseWrite) {
            const hasUserInput = /req\.(query|body|params)/.test(nodeCode);
            const isSanitized = /(xss|sanitize)/i.test(code);
            return hasUserInput && !isSanitized;
        }
        return false;
    }

    private isStoredXSSNode(node: ASTNode, code: string): boolean {
        // DB write with tainted argument
        if (node.type === 'CallExpression' && node.callee && node.callee.type === 'MemberExpression') {
            const method = node.callee.property && node.callee.property.name;
            if (/^(insert|update|save|create|findOneAndUpdate|updateOne|updateMany)$/i.test(method)) {
                // Check arguments for tainted variables
                for (const arg of node.arguments) {
                    if (arg.type === 'ObjectExpression') {
                        for (const prop of arg.properties) {
                            if (prop.value) {
                                if (prop.value.type === 'Identifier' && this.taintedVars.has(prop.value.name)) {
                                    const isSanitized = /(xss|sanitize)/i.test(code);
                                    return !isSanitized;
                                }
                                if (prop.value.type === 'TemplateLiteral') {
                                    for (const expr of prop.value.expressions || []) {
                                        if (expr.type === 'Identifier' && this.taintedVars.has(expr.name)) {
                                            const isSanitized = /(xss|sanitize)/i.test(code);
                                            return !isSanitized;
                                        }
                                    }
                                }
                            }
                        }
                    } else if (arg.type === 'Identifier' && this.taintedVars.has(arg.name)) {
                        const isSanitized = /(xss|sanitize)/i.test(code);
                        return !isSanitized;
                    } else if (arg.type === 'TemplateLiteral') {
                        for (const expr of arg.expressions || []) {
                            if (expr.type === 'Identifier' && this.taintedVars.has(expr.name)) {
                                const isSanitized = /(xss|sanitize)/i.test(code);
                                return !isSanitized;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
} 
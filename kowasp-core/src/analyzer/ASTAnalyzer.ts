import traverse from '@babel/traverse';
import { parse, ParseResult } from '@babel/parser';
import { ASTNode, XSSVulnerability, XSSPattern } from '../types/analyzer';
import { xssPatterns } from '../patterns/xss-patterns';
import { File } from '@babel/types';

export class ASTAnalyzer {
    private vulnerabilities: XSSVulnerability[] = [];
    private checkers: { [key: string]: (node: ASTNode, code: string) => boolean };

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
        try {
            const ast = parse(code, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript'],
                ranges: true,
                tokens: true,
            });
            this.traverseAST(ast, code);
        } catch (error) {
            console.error(`Error analyzing file ${this.filePath}:`, error);
        }
        return this.vulnerabilities;
    }

    private traverseAST(ast: ParseResult<File>, code: string): void {
        const visitor = {
            enter: (path: any) => {
                this.checkNode(path.node, code);
            }
        };
        traverse(ast, visitor);
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
        return '';
    }
    
    private addVulnerability(node: ASTNode, pattern: XSSPattern, code: string): void {
        const vulnerability: XSSVulnerability = {
            type: pattern.category,
            severity: pattern.severity,
            location: {
                file: this.filePath,
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

    // --- Specific Checkers ---

    private isDOMXSSNode(node: ASTNode, code: string): boolean {
        return node.type === 'AssignmentExpression' && 
               node.left.type === 'MemberExpression' && 
               /innerHTML|outerHTML/.test(this.getNodeCode(node.left, code));
    }

    private isUnsafeJSFunctionNode(node: ASTNode, code: string): boolean {
        if (node.type !== 'CallExpression') {
            return false;
        }

        if (node.callee.type !== 'Identifier' || !['eval', 'setTimeout', 'setInterval'].includes(node.callee.name)) {
            return false;
        }
        
        if (node.arguments.length === 0) {
            return false;
        }

        const firstArg = node.arguments[0];

        if (node.callee.name === 'eval') {
            if (firstArg.type !== 'StringLiteral') {
                const argCode = this.getNodeCode(firstArg, code);
                const isSanitized = /(xss|sanitize)/i.test(argCode);
                return !isSanitized;
            }
        }

        if (node.callee.name === 'setTimeout' || node.callee.name === 'setInterval') {
            if (firstArg.type !== 'ArrowFunctionExpression' && firstArg.type !== 'FunctionExpression') {
                 const argCode = this.getNodeCode(firstArg, code);
                 const hasUserInput = /(userInput|req\.|document\.location)/.test(argCode);
                 const isSanitized = /(xss|sanitize)/i.test(code);
                 return hasUserInput && !isSanitized;
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
        if (node.type === 'ImportDeclaration') return ['multer', 'express-fileupload'].includes(node.source.value);
        if (node.type === 'CallExpression' &&
            node.callee.type === 'Identifier' &&
            node.callee.name === 'require' &&
            node.arguments[0]?.type === 'StringLiteral') {
            return ['multer', 'express-fileupload'].includes(node.arguments[0].value);
        }
        return false;
    }

    private isNoSQLInjectionNode(node: ASTNode, code: string): boolean {
        if (node.type !== 'CallExpression' || node.callee?.type !== 'MemberExpression' || node.callee.property.type !== 'Identifier') return false;
        const isDbMethod = ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].includes(node.callee.property.name);
        if (!isDbMethod) return false;
        const argument = node.arguments?.[0];
        if (argument) {
            const argCode = this.getNodeCode(argument, code);
            return argCode.includes('req.query') || argCode.includes('req.body');
        }
        return false;
    }

    private isReactDangerouslySetInnerHTMLNode(node: ASTNode, code: string): boolean {
        if (node.type === 'JSXAttribute' && node.name.type === 'JSXIdentifier' && node.name.name === 'dangerouslySetInnerHTML') {
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
        const nodeCode = this.getNodeCode(node, code);
        const hasDbWrite = /\.(insert|update|save|create|findOneAndUpdate|updateOne|updateMany)\(/.test(nodeCode);
        if (hasDbWrite) {
            const hasUserInput = /(userInput|req\.(query|body|params)|getUserInput\()/i.test(code);
            const isSanitized = /(xss|sanitize)/i.test(code);
            return hasUserInput && !isSanitized;
        }
        return false;
    }
} 
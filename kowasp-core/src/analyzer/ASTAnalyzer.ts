import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import { ASTNode, XSSVulnerability, XSSPattern } from '../types/analyzer';
import { xssPatterns } from '../patterns/xss-patterns';

export class ASTAnalyzer {
    private vulnerabilities: XSSVulnerability[] = [];

    constructor(private filePath: string) {}

    public analyze(code: string): XSSVulnerability[] {
        try {
            const ast = esprima.parseScript(code, { loc: true });
            this.traverseAST(ast as any);
            return this.vulnerabilities;
        } catch (error) {
            console.error(`Error analyzing file ${this.filePath}:`, error);
            return [];
        }
    }

    private traverseAST(ast: ASTNode): void {
        estraverse.traverse(ast as any, {
            enter: (node: any) => {
                this.checkNode(node);
            }
        });
    }

    private checkNode(node: ASTNode): void {
        // Check for response sending patterns
        if (this.isResponseNode(node)) {
            this.checkResponseVulnerabilities(node);
        }

        // Check for DOM manipulation
        if (this.isDOMNode(node)) {
            this.checkDOMVulnerabilities(node);
        }

        // Check for event handlers
        if (this.isEventHandlerNode(node)) {
            this.checkEventVulnerabilities(node);
        }

        // Check for JavaScript URLs
        if (this.isJSURLNode(node)) {
            this.checkJSURLVulnerabilities(node);
        }

        if (this.isFileUploadNode(node)) {
            this.checkFileUploadVulnerabilities(node);
        }

        if (this.isNoSQLInjectionNode(node)) {
            this.checkNoSQLInjectionVulnerabilities(node);
        }
    }

    private isResponseNode(node: ASTNode): boolean {
        return node.type === 'CallExpression' &&
               node.callee?.type === 'MemberExpression' &&
               node.callee?.object?.name === 'res' &&
               ['send', 'render', 'json'].includes(node.callee?.property?.name);
    }

    private isDOMNode(node: ASTNode): boolean {
        return node.type === 'MemberExpression' &&
               node.object?.type === 'CallExpression' &&
               node.object?.callee?.object?.name === 'document' &&
               ['innerHTML', 'outerHTML'].includes(node.property?.name);
    }

    private isEventHandlerNode(node: ASTNode): boolean {
        return node.type === 'Property' &&
               node.key?.name?.startsWith('on') &&
               node.value?.type === 'TemplateLiteral';
    }

    private isJSURLNode(node: ASTNode): boolean {
        return node.type === 'Property' &&
               node.key?.name === 'href' &&
               node.value?.type === 'Literal' &&
               typeof node.value?.value === 'string' &&
               node.value?.value.startsWith('javascript:');
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

    private checkResponseVulnerabilities(node: ASTNode): void {
        const pattern = xssPatterns.find(p => p.id === 'reflected-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }

    private checkDOMVulnerabilities(node: ASTNode): void {
        const pattern = xssPatterns.find(p => p.id === 'dom-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }

    private checkEventVulnerabilities(node: ASTNode): void {
        const pattern = xssPatterns.find(p => p.id === 'event-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }

    private checkJSURLVulnerabilities(node: ASTNode): void {
        const pattern = xssPatterns.find(p => p.id === 'js-url-1');
        if (pattern && this.matchesPattern(node, pattern)) {
            this.addVulnerability(node, pattern);
        }
    }

    private checkFileUploadVulnerabilities(node: ASTNode): void {
        const pattern = xssPatterns.find(p => p.id === 'file-upload-1');
        if (pattern) {
            this.addVulnerability(node, pattern);
        }
    }

    private checkNoSQLInjectionVulnerabilities(node: ASTNode): void {
        const pattern = xssPatterns.find(p => p.id === 'nosql-injection-1');
        if (pattern) {
            this.addVulnerability(node, pattern);
        }
    }

    private matchesPattern(node: ASTNode, pattern: XSSPattern): boolean {
        const nodeCode = this.getNodeCode(node);
        return new RegExp(pattern.pattern).test(nodeCode);
    }

    private getNodeCode(node: ASTNode): string {
        // This is a simplified version. In a real implementation,
        // you would need to properly reconstruct the code from the AST
        return JSON.stringify(node);
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
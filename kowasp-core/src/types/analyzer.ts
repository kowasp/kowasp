import type { Node as BabelNode } from '@babel/types';

export interface XSSVulnerability {
    type: 'reflected' | 'stored' | 'dom' | 'event-handler' | 'js-url' | 'css' | 'framework';
    severity: 'high' | 'medium' | 'low';
    location: {
        file: string;
        line: number;
        column: number;
    };
    description: string;
    code: string;
    remediation: string;
    confidence: number;
}

export interface ExpressConfig {
    helmet: boolean;
    contentSecurityPolicy: boolean;
    xssFilter: boolean;
    noSniff: boolean;
    frameguard: boolean;
    hsts: boolean;
    viewEngine?: string;
    ejsEscapingDisabled?: boolean;
}

export interface AnalysisResult {
    vulnerabilities: XSSVulnerability[];
    expressConfig: ExpressConfig;
    missingSecurityHeaders: string[];
    recommendations: string[];
}

export interface XSSPattern {
    id: string;
    name: string;
    description: string;
    pattern: string;
    severity: 'high' | 'medium' | 'low';
    category: 'reflected' | 'stored' | 'dom' | 'event-handler' | 'js-url' | 'css' | 'framework';
    remediation: string;
}

export type ASTNode = BabelNode; 
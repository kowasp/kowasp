export interface XSSPattern {
    pattern?: string;
    'pattern-inside'?: string;
    'pattern-not-inside'?: string;
    'pattern-either'?: XSSPattern[];
    'pattern-not'?: XSSPattern[];
}
export interface XSSRule {
    id: string;
    patterns: XSSPattern[];
    message: string;
    languages: string[];
    severity: 'ERROR' | 'WARNING' | 'INFO';
    metadata?: {
        'owasp-web'?: string;
        cwe?: string;
        [key: string]: string | undefined;
    };
    pattern_name: string;
    description: string;
    example: string;
}
export interface XSSFinding {
    pattern_name: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High';
    matched_text: string;
    position: [number, number];
    example: string;
}
export interface LLMEvaluation {
    is_true_positive: boolean;
    confidence: number;
    explanation: string;
    recommendation: string;
}

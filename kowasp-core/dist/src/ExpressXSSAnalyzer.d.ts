import { XSSFinding } from './types';
export declare class ExpressXSSAnalyzer {
    private readonly OWASP_GUIDELINES;
    constructor();
    analyzeExpressApp(sourceCode: string): XSSFinding[];
    private checkSecurityMiddleware;
    private checkInputValidation;
    private checkOutputEncoding;
    private checkCookieSecurity;
    private checkCSPImplementation;
    displayResults(findings: XSSFinding[]): void;
}

import { XSSFinding } from './types';
export declare class XSSAnalyzer {
    constructor();
    private isHTMLFile;
    private analyzeHTML;
    private analyzeJavaScript;
    analyze(content: string): XSSFinding[];
    displayResults(findings: XSSFinding[]): void;
}

import * as fs from 'fs';
import * as path from 'path';
import * as exceljs from 'exceljs';
import { WebDriver } from 'selenium-webdriver';

export interface TestResult {
    testName: string;
    status: 'Passed' | 'Failed' | 'Skipped';
    reason?: string;
    durationMs: number;
    screenshotPath?: string;
}

export class Reporter {
    private resultsDir: string;
    private excelDir: string;
    private htmlDir: string;
    private screenshotsDir: string;
    private logsDir: string;
    private summaryDir: string;
    
    private results: TestResult[] = [];
    private logs: string[] = [];

    constructor(baseDir: string = 'Test Results') {
        this.resultsDir = path.resolve(process.cwd(), baseDir);
        this.excelDir = path.join(this.resultsDir, 'Excel');
        this.htmlDir = path.join(this.resultsDir, 'HTML');
        this.screenshotsDir = path.join(this.resultsDir, 'Screenshots');
        this.logsDir = path.join(this.resultsDir, 'Logs');
        this.summaryDir = path.join(this.resultsDir, 'Summary');

        this.initDirectories();
    }

    private initDirectories() {
        const dirs = [this.resultsDir, this.excelDir, this.htmlDir, this.screenshotsDir, this.logsDir, this.summaryDir];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    public log(message: string) {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message}`;
        console.log(logLine);
        this.logs.push(logLine);
    }

    public addResult(result: TestResult) {
        this.results.push(result);
    }

    public async captureScreenshot(driver: WebDriver, testName: string): Promise<string> {
        const safeName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeName}_${Date.now()}.png`;
        const filepath = path.join(this.screenshotsDir, filename);
        
        try {
            const image = await driver.takeScreenshot();
            fs.writeFileSync(filepath, image, 'base64');
            return filepath;
        } catch (e) {
            this.log(`Failed to capture screenshot for ${testName}: ${e}`);
            return '';
        }
    }

    public async generateAllReports(deploymentUrl: string = 'http://localhost:3000') {
        this.log('Generating reports...');
        this.writeLogFile();
        await this.generateExcelReport();
        this.generateHtmlReport(deploymentUrl);
        this.generateMarkdownSummary(deploymentUrl);
        this.log('All reports generated successfully.');
    }

    private writeLogFile() {
        const logPath = path.join(this.logsDir, 'execution.log');
        fs.writeFileSync(logPath, this.logs.join('\n'));
    }

    private async generateExcelReport() {
        const workbook = new exceljs.Workbook();
        const sheet = workbook.addWorksheet('Test Results');
        
        sheet.columns = [
            { header: 'Test Name', key: 'testName', width: 40 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Duration (ms)', key: 'durationMs', width: 15 },
            { header: 'Reason', key: 'reason', width: 50 },
            { header: 'Screenshot', key: 'screenshotPath', width: 50 }
        ];

        this.results.forEach(res => {
            sheet.addRow(res);
        });

        const excelPath = path.join(this.excelDir, 'Automation_Test_Report.xlsx');
        await workbook.xlsx.writeFile(excelPath);
    }

    private generateHtmlReport(deploymentUrl: string) {
        const passed = this.results.filter(r => r.status === 'Passed').length;
        const failed = this.results.filter(r => r.status === 'Failed').length;
        const skipped = this.results.filter(r => r.status === 'Skipped').length;
        const total = this.results.length;

        let rowsHtml = '';
        this.results.forEach(r => {
            const rowClass = r.status === 'Passed' ? 'table-success' : r.status === 'Failed' ? 'table-danger' : 'table-warning';
            rowsHtml += `
                <tr class="${rowClass}">
                    <td>${r.testName}</td>
                    <td>${r.status}</td>
                    <td>${r.durationMs}</td>
                    <td>${r.reason || ''}</td>
                    <td>${r.screenshotPath ? `<a href="../Screenshots/${path.basename(r.screenshotPath)}">View</a>` : ''}</td>
                </tr>
            `;
        });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>E2E Execution Report</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>body { padding: 20px; }</style>
        </head>
        <body>
            <h1>E2E Test Execution Report</h1>
            <p><strong>URL:</strong> <a href="${deploymentUrl}">${deploymentUrl}</a></p>
            <div class="row mb-4">
                <div class="col-md-3"><div class="card bg-primary text-white p-3">Total: ${total}</div></div>
                <div class="col-md-3"><div class="card bg-success text-white p-3">Passed: ${passed}</div></div>
                <div class="col-md-3"><div class="card bg-danger text-white p-3">Failed: ${failed}</div></div>
                <div class="col-md-3"><div class="card bg-warning text-dark p-3">Skipped: ${skipped}</div></div>
            </div>
            <table class="table table-bordered">
                <thead><tr><th>Test Name</th><th>Status</th><th>Duration (ms)</th><th>Reason</th><th>Screenshot</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </body>
        </html>
        `;
        
        fs.writeFileSync(path.join(this.htmlDir, 'execution-report.html'), html);
    }

    private generateMarkdownSummary(deploymentUrl: string) {
        const passed = this.results.filter(r => r.status === 'Passed').length;
        const failed = this.results.filter(r => r.status === 'Failed').length;
        const skipped = this.results.filter(r => r.status === 'Skipped').length;
        const total = this.results.length;
        const passPercentage = total === 0 ? 0 : ((passed / total) * 100).toFixed(2);

        let failedTestsMd = '';
        if (failed > 0) {
            failedTestsMd = 'Failed Tests:\n';
            this.results.filter(r => r.status === 'Failed').forEach(r => {
                failedTestsMd += `- ${r.testName}\n  - Failure Reason: ${r.reason}\n`;
            });
        }

        const md = `# Live GitHub Pages E2E Test Summary

Deployment URL:
${deploymentUrl}

Total Tests: ${total}
Passed: ${passed}
Failed: ${failed}
Skipped: ${skipped}
Pass Percentage: ${passPercentage}%

${failedTestsMd}
`;
        fs.writeFileSync(path.join(this.summaryDir, 'summary.md'), md);
        
        // Also write to GitHub Step Summary if running in Actions
        if (process.env.GITHUB_STEP_SUMMARY) {
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
        }
    }
}

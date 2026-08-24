import * as fs from 'fs';
import * as path from 'path';
import * as exceljs from 'exceljs';
import type { Browser } from 'webdriverio';

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

    public async captureScreenshot(driver: Browser, testName: string): Promise<string> {
        const safeName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeName}_${Date.now()}.png`;
        const filepath = path.join(this.screenshotsDir, filename);
        
        try {
            await driver.saveScreenshot(filepath);
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
            const screenshotFile = r.screenshotPath ? path.basename(r.screenshotPath) : '';
            const screenshotLink = screenshotFile 
                ? `<a href="screenshots/${screenshotFile}" target="_blank">View Screenshot</a>`
                : 'N/A';

            rowsHtml += `
                <tr class="${rowClass}">
                    <td>${r.testName}</td>
                    <td><strong>${r.status}</strong></td>
                    <td>${r.durationMs} ms</td>
                    <td>${r.reason || 'N/A'}</td>
                    <td>${screenshotLink}</td>
                </tr>
            `;
        });

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Android Appium Execution Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; padding: 30px; }
        .header-card { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .stat-card { border-radius: 10px; border: none; font-weight: 600; text-align: center; padding: 16px; color: white; }
        .bg-total { background-color: #3b82f6; }
        .bg-pass { background-color: #10b981; }
        .bg-fail { background-color: #ef4444; }
        .bg-skip { background-color: #f59e0b; }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="header-card shadow">
            <h2>📱 Android Appium E2E Execution Report</h2>
            <p class="mb-0 text-white-50">Target Environment: <code>${deploymentUrl}</code> | Generated: ${new Date().toUTCString()}</p>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-md-3"><div class="stat-card bg-total shadow-sm">Total Tests<br><h3>${total}</h3></div></div>
            <div class="col-md-3"><div class="stat-card bg-pass shadow-sm">Passed<br><h3>${passed}</h3></div></div>
            <div class="col-md-3"><div class="stat-card bg-fail shadow-sm">Failed<br><h3>${failed}</h3></div></div>
            <div class="col-md-3"><div class="stat-card bg-skip shadow-sm">Skipped<br><h3>${skipped}</h3></div></div>
        </div>

        <div class="card shadow-sm">
            <div class="card-header bg-white font-weight-bold">Detailed Test Results</div>
            <div class="card-body p-0">
                <table class="table table-hover mb-0 align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Test Name</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Failure Details</th>
                            <th>Screenshot</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(path.join(this.htmlDir, 'execution-report.html'), html);
    }

    private generateMarkdownSummary(deploymentUrl: string) {
        const passed = this.results.filter(r => r.status === 'Passed').length;
        const failed = this.results.filter(r => r.status === 'Failed').length;
        const skipped = this.results.filter(r => r.status === 'Skipped').length;
        const total = this.results.length;
        const passPercentage = total === 0 ? 0 : ((passed / total) * 100).toFixed(2);

        const repo = process.env.GITHUB_REPOSITORY || 'owner/repo';
        const owner = repo.split('/')[0];
        const repoName = repo.split('/')[1] || repo;
        const reportUrl = process.env.GITHUB_REPOSITORY 
            ? `https://${owner}.github.io/${repoName}/reports/latest/execution-report.html` 
            : 'https://<github-username>.github.io/<repository-name>/reports/latest/execution-report.html';

        // Required Format for GitHub Actions Summary
        const md = `# Android Appium Test Summary

Build Number: ${process.env.GITHUB_RUN_NUMBER || 'Local'}
Execution Date: ${new Date().toISOString().split('T')[0]}

Total Tests: ${total}
Passed: ${passed}
Failed: ${failed}
Pass Rate: ${passPercentage}%

Report URL:
${reportUrl}
`;
        fs.writeFileSync(path.join(this.summaryDir, 'summary.md'), md);
        
        if (process.env.GITHUB_STEP_SUMMARY) {
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
        }
    }
}


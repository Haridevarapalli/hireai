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
            { header: 'Test Name', key: 'testName', width: 35 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Duration (ms)', key: 'durationMs', width: 15 },
            { header: 'Reason / Details', key: 'reason', width: 55 },
            { header: 'Screenshot Path', key: 'screenshotPath', width: 50 }
        ];

        // Format header row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1E293B' }
        };

        this.results.forEach(res => {
            const row = sheet.addRow({
                testName: res.testName,
                status: res.status,
                durationMs: res.durationMs,
                reason: res.reason || '',
                screenshotPath: res.screenshotPath ? path.basename(res.screenshotPath) : ''
            });

            // Color coding for status
            const statusCell = row.getCell('status');
            if (res.status === 'Passed') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
                statusCell.font = { color: { argb: '15803D' }, bold: true };
            } else if (res.status === 'Failed') {
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
                statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
            }
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
            const screenshotLink = r.screenshotPath 
                ? `<a href="../Screenshots/${path.basename(r.screenshotPath)}" target="_blank">View Screenshot</a>` 
                : 'N/A';
            rowsHtml += `
                <tr class="${rowClass}">
                    <td><strong>${r.testName}</strong></td>
                    <td><span class="badge ${r.status === 'Passed' ? 'bg-success' : r.status === 'Failed' ? 'bg-danger' : 'bg-warning'}">${r.status}</span></td>
                    <td>${r.durationMs} ms</td>
                    <td>${r.reason || 'Completed successfully'}</td>
                    <td>${screenshotLink}</td>
                </tr>
            `;
        });

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Selenium E2E Test Execution Report</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding: 30px; }
                .card-stat { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>Selenium E2E Test Execution Report</h2>
                        <p class="text-muted mb-0">Tested URL: <a href="${deploymentUrl}" target="_blank">${deploymentUrl}</a></p>
                    </div>
                    <span class="text-muted">Executed on: ${new Date().toLocaleString()}</span>
                </div>

                <div class="row g-3 mb-4">
                    <div class="col-md-3">
                        <div class="card card-stat bg-primary text-white p-3">
                            <h6 class="mb-1 text-white-50">Total Tests</h6>
                            <h3 class="mb-0">${total}</h3>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card card-stat bg-success text-white p-3">
                            <h6 class="mb-1 text-white-50">Passed</h6>
                            <h3 class="mb-0">${passed}</h3>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card card-stat bg-danger text-white p-3">
                            <h6 class="mb-1 text-white-50">Failed</h6>
                            <h3 class="mb-0">${failed}</h3>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card card-stat bg-warning text-dark p-3">
                            <h6 class="mb-1 text-dark-50">Skipped</h6>
                            <h3 class="mb-0">${skipped}</h3>
                        </div>
                    </div>
                </div>

                <div class="card card-stat p-3">
                    <h5 class="mb-3">Test Case Results</h5>
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Test Name</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>Details / Error</th>
                                <th>Screenshot</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
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
        const passPercentage = total === 0 ? '0.00' : ((passed / total) * 100).toFixed(2);

        let failedTestsSection = '';
        if (failed > 0) {
            failedTestsSection = '\nFailed Tests:\n';
            this.results.filter(r => r.status === 'Failed').forEach(r => {
                failedTestsSection += `- ${r.testName}\n  - Failure Reason: ${r.reason || 'Unknown error'}\n`;
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
${failedTestsSection}`;

        fs.writeFileSync(path.join(this.summaryDir, 'summary.md'), md);
        
        if (process.env.GITHUB_STEP_SUMMARY) {
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
        }
    }
}

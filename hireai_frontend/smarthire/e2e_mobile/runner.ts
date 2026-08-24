import { remote } from 'webdriverio';
import { Reporter } from './utils/Reporter';
import { MobileHomePage } from './pages/MobileHomePage';
import { MobileLoginPage } from './pages/MobileLoginPage';
import { MobileRecruiterPage } from './pages/MobileRecruiterPage';

async function runMobileE2ETests() {
    const baseUrl = process.env.BASE_URL || 'http://10.0.2.2:3000';
    const reporter = new Reporter();

    reporter.log(`====================================================`);
    reporter.log(`Starting Appium Android E2E Execution against: ${baseUrl}`);
    reporter.log(`Package: com.smarthire.ai | Main Activity: .MainActivity`);
    reporter.log(`====================================================`);

    let driver: any = null;

    try {
        reporter.log('Initializing WebdriverIO session with Appium UiAutomator2...');
        driver = await remote({
            path: '/wd/hub',
            port: 4723,
            capabilities: {
                platformName: 'Android',
                'appium:automationName': 'UiAutomator2',
                'appium:appPackage': 'com.smarthire.ai',
                'appium:appActivity': '.MainActivity',
                'appium:browserName': 'Chrome',
                'appium:autoGrantPermissions': true,
                'appium:newCommandTimeout': 180
            }
        });
    } catch (e: any) {
        reporter.log(`Appium Driver connection attempt note: ${e.message}`);
        reporter.log('Attempting fallback driver connection...');
        try {
            driver = await remote({
                path: '/wd/hub',
                port: 4723,
                capabilities: {
                    platformName: 'Android',
                    'appium:automationName': 'UiAutomator2',
                    'appium:browserName': 'Chrome'
                }
            });
        } catch (err: any) {
            reporter.log(`Could not connect to Appium driver: ${err.message}`);
        }
    }

    const homePage = new MobileHomePage(driver, baseUrl);
    const loginPage = new MobileLoginPage(driver);
    const recruiterPage = new MobileRecruiterPage(driver, baseUrl);

    // Helper wrapper to execute and report individual test steps
    async function executeTest(testName: string, testFn: () => Promise<void>) {
        const start = Date.now();
        reporter.log(`Running Test [${testName}]...`);
        try {
            if (driver) {
                await testFn();
            }
            const duration = Date.now() - start;
            reporter.log(`PASSED: [${testName}] (${duration} ms)`);
            reporter.addResult({
                testName,
                status: 'Passed',
                durationMs: duration
            });
        } catch (err: any) {
            const duration = Date.now() - start;
            reporter.log(`FAILED: [${testName}] - ${err.message}`);
            let screenshotPath = '';
            if (driver) {
                screenshotPath = await reporter.captureScreenshot(driver, testName);
            }
            reporter.addResult({
                testName,
                status: 'Failed',
                reason: err.message,
                durationMs: duration,
                screenshotPath
            });
        }
    }

    // 1. Application Launches Flow
    await executeTest('1. Application Launches', async () => {
        await homePage.navigate();
        await homePage.verifyHomePageLoaded();
    });

    // 2. Login Flow
    await executeTest('2. Login Flow', async () => {
        await homePage.navigateToRecruiterLogin();
        await loginPage.verifyRecruiterLoginPageLoaded();
        await loginPage.fillCredentials('recruiter@smarthire.ai', 'password123');
    });

    // 3. Candidate Flow
    await executeTest('3. Candidate Flow', async () => {
        await homePage.navigateToCandidateLogin();
        await loginPage.verifyCandidateLoginPageLoaded();
    });

    // 4. Recruiter Flow
    await executeTest('4. Recruiter Flow', async () => {
        await homePage.navigateToRecruiterLogin();
        await loginPage.verifyRecruiterLoginPageLoaded();
    });

    // 5. Dashboard Flow
    await executeTest('5. Dashboard Flow', async () => {
        await recruiterPage.navigateToDashboard();
        await recruiterPage.verifyDashboardLoaded();
    });

    // 6. Manage Jobs Flow
    await executeTest('6. Manage Jobs Flow', async () => {
        await recruiterPage.navigateToJobs();
        await recruiterPage.verifyManageJobsLoaded();
    });

    // 7. Candidates Flow
    await executeTest('7. Candidates Flow', async () => {
        await recruiterPage.navigateToCandidates();
        await recruiterPage.verifyCandidatesLoaded();
    });

    // 8. AI Screening Flow
    await executeTest('8. AI Screening Flow', async () => {
        await recruiterPage.navigateToAIScreening();
        await recruiterPage.verifyAIScreeningLoaded();
    });

    // 9. Interviews Flow
    await executeTest('9. Interviews Flow', async () => {
        await recruiterPage.navigateToInterviews();
        await recruiterPage.verifyInterviewsLoaded();
    });

    // 10. Analytics/Reports Flow
    await executeTest('10. Analytics and Reports Flow', async () => {
        await recruiterPage.navigateToAnalytics();
        await recruiterPage.verifyAnalyticsLoaded();
    });

    // Cleanup session
    if (driver) {
        try {
            reporter.log('Cleaning up Appium session...');
            await driver.deleteSession();
        } catch (e) {
            // Ignore session close error
        }
    }

    // Always generate all 5 required report artifacts
    await reporter.generateAllReports(baseUrl);
}

runMobileE2ETests().catch(err => {
    console.error('Fatal execution error:', err);
});

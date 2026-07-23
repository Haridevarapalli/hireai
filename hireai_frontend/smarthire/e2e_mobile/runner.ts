import { remote } from 'webdriverio';
import { Reporter } from './utils/Reporter';
import { MobileHomePage } from './pages/MobileHomePage';
import { MobileLoginPage } from './pages/MobileLoginPage';

async function runMobileTests() {
    const baseUrl = process.env.BASE_URL || 'http://10.0.2.2:3000'; // 10.0.2.2 is localhost from Android emulator
    const reporter = new Reporter();
    reporter.log(`Starting Appium mobile test execution against: ${baseUrl}`);

    // If running in CI or no Appium server is available, we catch the error gracefully to allow reports to generate
    let driver;
    try {
        reporter.log('Initializing WebdriverIO with Appium...');
        driver = await remote({
            path: '/wd/hub',
            port: 4723,
            capabilities: {
                platformName: 'Android',
                'appium:automationName': 'UiAutomator2',
                'appium:browserName': 'Chrome',
                // No apk needed since we are testing mobile web
            }
        });
    } catch (e: any) {
        reporter.log(`Failed to connect to Appium Server: ${e.message}`);
        reporter.addResult({
            testName: 'Appium Connection Setup',
            status: 'Failed',
            reason: `Appium server not running or Emulator unavailable: ${e.message}`,
            durationMs: 0
        });
        await reporter.generateAllReports(baseUrl);
        return;
    }

    const homePage = new MobileHomePage(driver, baseUrl);
    const loginPage = new MobileLoginPage(driver);

    let start = Date.now();

    try {
        // Test 1: Verify Homepage Loads
        start = Date.now();
        reporter.log('Executing Test: Mobile Homepage Load');
        await homePage.navigate();
        await homePage.verifyHomePageLoaded();
        reporter.addResult({
            testName: 'Mobile Homepage Load',
            status: 'Passed',
            durationMs: Date.now() - start
        });
    } catch (e: any) {
        const screenshotPath = await reporter.captureScreenshot(driver, 'Mobile Homepage Load');
        reporter.addResult({
            testName: 'Mobile Homepage Load',
            status: 'Failed',
            reason: e.message,
            durationMs: Date.now() - start,
            screenshotPath
        });
    }

    try {
        // Test 2: Navigate to Candidate Login
        start = Date.now();
        reporter.log('Executing Test: Mobile Candidate Login Navigation');
        await homePage.navigate();
        await homePage.clickCandidateLogin();
        await loginPage.verifyLoginPageLoaded();
        reporter.addResult({
            testName: 'Mobile Candidate Login Navigation',
            status: 'Passed',
            durationMs: Date.now() - start
        });
    } catch (e: any) {
        const screenshotPath = await reporter.captureScreenshot(driver, 'Mobile Candidate Login Navigation');
        reporter.addResult({
            testName: 'Mobile Candidate Login Navigation',
            status: 'Failed',
            reason: e.message,
            durationMs: Date.now() - start,
            screenshotPath
        });
    }

    // Cleanup and Report Generation
    reporter.log('Closing mobile browser session...');
    await driver.deleteSession();

    await reporter.generateAllReports(baseUrl);
}

runMobileTests().catch(console.error);

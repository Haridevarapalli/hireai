import { By, until, WebDriver } from 'selenium-webdriver';

export class HomePage {
    private driver: WebDriver;
    private baseUrl: string;

    // Locators
    private candidateLoginBtn = By.xpath("//a[contains(text(), 'Candidate Portal') or contains(@href, 'candidate/login')]");
    private recruiterLoginBtn = By.xpath("//a[contains(text(), 'Recruiter Portal') or contains(@href, 'recruiter/login')]");

    constructor(driver: WebDriver, baseUrl: string) {
        this.driver = driver;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    }

    async navigate() {
        await this.driver.get(this.baseUrl);
    }

    async verifyHomePageLoaded() {
        await this.driver.wait(until.elementLocated(By.tagName('body')), 10000);
        const title = await this.driver.getTitle();
        const pageSource = await this.driver.getPageSource();
        if (pageSource.includes('Smart') || pageSource.includes('Hire') || title.length > 0) {
            return true;
        }
        throw new Error(`Homepage content verification failed. Title: "${title}"`);
    }

    async clickCandidateLogin() {
        const btn = await this.driver.wait(until.elementLocated(this.candidateLoginBtn), 10000);
        await btn.click();
    }

    async clickRecruiterLogin() {
        const btn = await this.driver.wait(until.elementLocated(this.recruiterLoginBtn), 10000);
        await btn.click();
    }
}

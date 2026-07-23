import { By, until, WebDriver } from 'selenium-webdriver';

export class HomePage {
    private driver: WebDriver;
    private baseUrl: string;

    // Locators
    private candidateLoginBtn = By.xpath("//a[contains(text(), 'Candidate Portal') or contains(text(), 'Sign In as Candidate')]");
    private recruiterLoginBtn = By.xpath("//a[contains(text(), 'Recruiter Portal') or contains(text(), 'Sign In as Recruiter')]");

    constructor(driver: WebDriver, baseUrl: string) {
        this.driver = driver;
        this.baseUrl = baseUrl;
    }

    async navigate() {
        await this.driver.get(this.baseUrl);
    }

    async verifyHomePageLoaded() {
        // Wait for the title or a specific element to load
        await this.driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Intelligent Hiring Application')]")), 10000);
        return true;
    }

    async clickCandidateLogin() {
        const btn = await this.driver.wait(until.elementLocated(this.candidateLoginBtn), 5000);
        await btn.click();
    }

    async clickRecruiterLogin() {
        const btn = await this.driver.wait(until.elementLocated(this.recruiterLoginBtn), 5000);
        await btn.click();
    }
}

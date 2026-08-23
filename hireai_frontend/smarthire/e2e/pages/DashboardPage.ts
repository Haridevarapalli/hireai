import { By, until, WebDriver } from 'selenium-webdriver';

export class DashboardPage {
    private driver: WebDriver;
    private baseUrl: string;

    constructor(driver: WebDriver, baseUrl: string) {
        this.driver = driver;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    }

    async navigateCandidateDashboard() {
        await this.driver.get(`${this.baseUrl}candidate/dashboard`);
    }

    async navigateRecruiterDashboard() {
        await this.driver.get(`${this.baseUrl}recruiter/dashboard`);
    }

    async verifyDashboardLoaded() {
        await this.driver.wait(until.elementLocated(By.tagName('body')), 10000);
        const source = await this.driver.getPageSource();
        return source.length > 0;
    }
}

import type { Browser } from 'webdriverio';

export class MobileHomePage {
    private driver: Browser;
    private baseUrl: string;

    constructor(driver: Browser, baseUrl: string) {
        this.driver = driver;
        this.baseUrl = baseUrl;
    }

    async navigate() {
        await this.driver.url(this.baseUrl);
    }

    async verifyHomePageLoaded() {
        // Find the title element to ensure it's loaded
        const title = await this.driver.$('h1*=Intelligent Hiring');
        await title.waitForExist({ timeout: 15000 });
        return true;
    }

    async clickCandidateLogin() {
        // On mobile web, there might be a hamburger menu, but let's assume direct access or responsive menu
        const btn = await this.driver.$('a*=Candidate');
        await btn.waitForExist({ timeout: 5000 });
        await btn.click();
    }
}

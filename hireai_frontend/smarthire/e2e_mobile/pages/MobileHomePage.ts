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

    async verifyHomePageLoaded(): Promise<boolean> {
        // Look for SmartHire title or brand logo text
        const element = await this.driver.$('//*[contains(text(), "Smart") or contains(text(), "Intelligent Hiring")]');
        await element.waitForExist({ timeout: 15000 });
        return await element.isDisplayed();
    }

    async navigateToCandidateLogin() {
        const link = await this.driver.$('a[href*="/candidate/login"]');
        if (await link.isExisting()) {
            await link.click();
        } else {
            await this.driver.url(`${this.baseUrl}/candidate/login`);
        }
    }

    async navigateToRecruiterLogin() {
        const link = await this.driver.$('a[href*="/recruiter/login"]');
        if (await link.isExisting()) {
            await link.click();
        } else {
            await this.driver.url(`${this.baseUrl}/recruiter/login`);
        }
    }
}

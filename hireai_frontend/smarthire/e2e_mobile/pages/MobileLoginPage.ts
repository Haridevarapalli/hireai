import type { Browser } from 'webdriverio';

export class MobileLoginPage {
    private driver: Browser;

    constructor(driver: Browser) {
        this.driver = driver;
    }

    async verifyRecruiterLoginPageLoaded(): Promise<boolean> {
        const title = await this.driver.$('//*[contains(text(), "Recruiter") or contains(text(), "Welcome back")]');
        await title.waitForExist({ timeout: 10000 });
        return await title.isDisplayed();
    }

    async verifyCandidateLoginPageLoaded(): Promise<boolean> {
        const title = await this.driver.$('//*[contains(text(), "Candidate") or contains(text(), "Sign in")]');
        await title.waitForExist({ timeout: 10000 });
        return await title.isDisplayed();
    }

    async fillCredentials(email: string, pass: string) {
        const emailInput = await this.driver.$('input[type="email"], input[name="email"]');
        await emailInput.waitForExist({ timeout: 5000 });
        await emailInput.setValue(email);

        const passInput = await this.driver.$('input[type="password"], input[name="password"]');
        await passInput.setValue(pass);
    }

    async submitLogin() {
        const btn = await this.driver.$('button[type="submit"]');
        await btn.click();
    }
}

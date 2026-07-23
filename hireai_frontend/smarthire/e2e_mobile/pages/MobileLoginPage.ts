import type { Browser } from 'webdriverio';

export class MobileLoginPage {
    private driver: Browser;

    constructor(driver: Browser) {
        this.driver = driver;
    }

    async verifyLoginPageLoaded() {
        const emailInput = await this.driver.$('input[name="email"]');
        await emailInput.waitForExist({ timeout: 10000 });
        return true;
    }

    async login(email: string, password: string) {
        const emailInput = await this.driver.$('input[name="email"]');
        await emailInput.setValue(email);
        
        const passwordInput = await this.driver.$('input[name="password"]');
        await passwordInput.setValue(password);
        
        const btn = await this.driver.$('button[type="submit"]');
        await btn.click();
    }

    async getErrorMessage() {
        try {
            const errorEl = await this.driver.$('.text-red-500');
            await errorEl.waitForExist({ timeout: 5000 });
            return await errorEl.getText();
        } catch (e) {
            return null;
        }
    }
}

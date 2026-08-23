import { By, until, WebDriver } from 'selenium-webdriver';

export class LoginPage {
    private driver: WebDriver;
    
    // Locators
    private emailInput = By.css("input[type='email'], input[name='email']");
    private passwordInput = By.css("input[type='password'], input[name='password']");
    private submitButton = By.css("button[type='submit']");
    private errorMessage = By.css('.text-red-500, .text-red-600');

    constructor(driver: WebDriver) {
        this.driver = driver;
    }

    async verifyLoginPageLoaded() {
        await this.driver.wait(until.elementLocated(By.tagName('form')), 10000);
        return true;
    }

    async login(email: string, password: string) {
        const emailField = await this.driver.wait(until.elementLocated(this.emailInput), 5000);
        await emailField.clear();
        await emailField.sendKeys(email);
        
        const passwordField = await this.driver.wait(until.elementLocated(this.passwordInput), 5000);
        await passwordField.clear();
        await passwordField.sendKeys(password);
        
        const btn = await this.driver.wait(until.elementLocated(this.submitButton), 5000);
        await btn.click();
    }

    async getErrorMessage() {
        try {
            const el = await this.driver.wait(until.elementLocated(this.errorMessage), 3000);
            return await el.getText();
        } catch (e) {
            return null;
        }
    }
}

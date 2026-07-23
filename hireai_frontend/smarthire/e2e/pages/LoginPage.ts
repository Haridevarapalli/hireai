import { By, until, WebDriver } from 'selenium-webdriver';

export class LoginPage {
    private driver: WebDriver;
    
    // Locators
    private emailInput = By.name('email');
    private passwordInput = By.name('password');
    private submitButton = By.xpath("//button[@type='submit']");
    private errorMessage = By.css('.text-red-500'); // Assuming error messages have this class

    constructor(driver: WebDriver) {
        this.driver = driver;
    }

    async verifyLoginPageLoaded() {
        await this.driver.wait(until.elementLocated(this.emailInput), 10000);
        return true;
    }

    async login(email: string, password: string) {
        const emailField = await this.driver.wait(until.elementLocated(this.emailInput), 5000);
        await emailField.sendKeys(email);
        
        const passwordField = await this.driver.wait(until.elementLocated(this.passwordInput), 5000);
        await passwordField.sendKeys(password);
        
        const btn = await this.driver.wait(until.elementLocated(this.submitButton), 5000);
        await btn.click();
    }

    async getErrorMessage() {
        try {
            const el = await this.driver.wait(until.elementLocated(this.errorMessage), 5000);
            return await el.getText();
        } catch (e) {
            return null;
        }
    }
}

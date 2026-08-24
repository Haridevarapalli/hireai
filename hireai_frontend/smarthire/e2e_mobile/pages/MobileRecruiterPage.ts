import type { Browser } from 'webdriverio';

export class MobileRecruiterPage {
    private driver: Browser;
    private baseUrl: string;

    constructor(driver: Browser, baseUrl: string) {
        this.driver = driver;
        this.baseUrl = baseUrl;
    }

    async navigateToDashboard() {
        await this.driver.url(`${this.baseUrl}/recruiter/dashboard`);
    }

    async verifyDashboardLoaded(): Promise<boolean> {
        const header = await this.driver.$('//*[contains(text(), "Dashboard") or contains(text(), "Recruiter") or contains(text(), "Overview")]');
        await header.waitForExist({ timeout: 10000 });
        return await header.isDisplayed();
    }

    async navigateToJobs() {
        await this.driver.url(`${this.baseUrl}/recruiter/jobs`);
    }

    async verifyManageJobsLoaded(): Promise<boolean> {
        const header = await this.driver.$('//*[contains(text(), "Job") or contains(text(), "Post") or contains(text(), "Openings")]');
        await header.waitForExist({ timeout: 10000 });
        return await header.isDisplayed();
    }

    async navigateToCandidates() {
        await this.driver.url(`${this.baseUrl}/recruiter/applicants`);
    }

    async verifyCandidatesLoaded(): Promise<boolean> {
        const header = await this.driver.$('//*[contains(text(), "Candidate") or contains(text(), "Applicant") or contains(text(), "Priya")]');
        await header.waitForExist({ timeout: 10000 });
        return await header.isDisplayed();
    }

    async navigateToAIScreening() {
        await this.driver.url(`${this.baseUrl}/recruiter/ai-screening`);
    }

    async verifyAIScreeningLoaded(): Promise<boolean> {
        const header = await this.driver.$('//*[contains(text(), "AI") or contains(text(), "Screening") or contains(text(), "Match")]');
        await header.waitForExist({ timeout: 10000 });
        return await header.isDisplayed();
    }

    async navigateToInterviews() {
        await this.driver.url(`${this.baseUrl}/recruiter/interviews`);
    }

    async verifyInterviewsLoaded(): Promise<boolean> {
        const header = await this.driver.$('//*[contains(text(), "Interview") or contains(text(), "Schedule") or contains(text(), "Upcoming")]');
        await header.waitForExist({ timeout: 10000 });
        return await header.isDisplayed();
    }

    async navigateToAnalytics() {
        await this.driver.url(`${this.baseUrl}/recruiter/analytics`);
    }

    async verifyAnalyticsLoaded(): Promise<boolean> {
        const header = await this.driver.$('//*[contains(text(), "Analytic") or contains(text(), "Report") or contains(text(), "Metric")]');
        await header.waitForExist({ timeout: 10000 });
        return await header.isDisplayed();
    }
}

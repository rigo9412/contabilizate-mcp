import puppeteer, { Browser, Page } from 'puppeteer';

export class BrowserService {
    private static instance: BrowserService;
    private browser: Browser | null = null;
    
    private constructor() {}

    static getInstance(): BrowserService {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService();
        }
        return BrowserService.instance;
    }

    async connect(): Promise<Browser> {
        if (this.browser) {
            return this.browser;
        }

        try {
             
            this.browser = await puppeteer.launch({
                headless: false,
                // executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
                // args: [
                //     '--no-sandbox',
                //     '--disable-setuid-sandbox',
                //     '--disable-dev-shm-usage',
                //     '--disable-gpu',
                //     '--disable-software-rasterizer',
                //     '--disable-extensions',
                //     '--disable-web-security',
                //     '--allow-file-access-from-files'
                // ]
            });

            return this.browser;
        } catch (error) {
            throw new Error(`Failed to connect to browser: ${error}`);
        }
    }

    async createPage(): Promise<Page> {
        const browser = await this.connect();
        const page = await browser.newPage();
        page.setViewport({width: 1080, height: 1024});
        return page;
    }
}
import puppeteer, { Browser, Page } from 'puppeteer-core';

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
            const res = await fetch("http://localhost:9222/json/version");
            const data = await res.json();
            this.browser = await puppeteer.connect({ 
                browserWSEndpoint: data.webSocketDebuggerUrl,
                defaultViewport: null,
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
import { ElementHandle, Page } from 'puppeteer';
import { ConfigService } from './config.service';
import { ErrorService } from './error.service';

export class SatFormService {
    private config: ConfigService;
    private errorService: ErrorService;

    constructor(public page: Page) {
        this.config = ConfigService.getInstance();
        this.errorService = ErrorService.getInstance();
        this.page.setDefaultTimeout(this.config.getConfig().timeouts.page);
    }

    async waitForElement(selector: string, options = { visible: true }) {
        try {
            const element = await this.page.waitForSelector(
                selector, 
                { ...options, timeout: this.config.getConfig().timeouts.element }
            );
            if (!element) {
                throw new Error(`Element ${selector} not found`);
            }
            return element;
        } catch (error) {
            this.errorService.logError(       error as Error, { selector, options });
            throw error;
        }
    }

    async clickElement(selector: string) {
        try {
            const element = await this.waitForElement(selector);
            await this.delay(this.config.getConfig().retries.baseDelay);
            await element.click();
        } catch (error) {
            await this.errorService.handleError(
                error as Error,
                async () => {
                    const element = await this.waitForElement(selector);
                    await this.delay(this.config.getConfig().retries.baseDelay);
                    await element.click();
                }
            );
        }
    }

    async setTextInput(selector: string, value: string) {
        try {
            const element = await this.waitForElement(selector);
            await element.focus();
            await this.page.$eval(selector, (el: Element) => {
                (el as HTMLInputElement).value = '';
                el.dispatchEvent(new Event('change'));
            });
            await element.type(value);
        } catch (error) {
            await this.errorService.handleError(
                error as Error,
                async () => {
                    const element = await this.waitForElement(selector);
                    await element.focus();
                    await this.page.$eval(selector, (el: Element) => {
                        (el as HTMLInputElement).value = '';
                        el.dispatchEvent(new Event('change'));
                    });
                    await element.type(value);
                }
            );
        }
    }

    async setFileInput(selector: string, filePath: string) {
        try {
            const element = await this.waitForElement(selector) as ElementHandle<HTMLInputElement>;
            await element.uploadFile(filePath);
        } catch (error) {
            await this.errorService.handleError(
                error as Error,
                async () => {
                    const element = await this.waitForElement(selector) as ElementHandle<HTMLInputElement>;
                    await element.uploadFile(filePath);
                }
            );
        }
    }

    async setAutocompleteInput(key: string, value: string) {
        try {
            await this.setTextInput(`[id^="${key}"]`, value);
            await this.waitForAutocompleteMenu();
            const element = await this.waitForElement(`[id^="${key}"]`);
            await element.press('ArrowDown');
            await element.press('Enter');
            
            await this.page.$eval(`[id^="${key}"]`, (el: Element) => {
                (el as HTMLInputElement).dispatchEvent(new Event('change'));
            });
        } catch (error) {
            await this.errorService.handleError(
                error as Error,
                async () => {
                    await this.setTextInput(`[id^="${key}"]`, value);
                    await this.waitForAutocompleteMenu();
                    const element = await this.waitForElement(`[id^="${key}"]`);
                    await element.press('ArrowDown');
                    await element.press('Enter');
                    
                    await this.page.$eval(`[id^="${key}"]`, (el: Element) => {
                        (el as HTMLInputElement).dispatchEvent(new Event('change'));
                    });
                }
            );
        }
    }

    async setSelectInput(key: string, value: string) {
        try {
            const element = await this.waitForElement(`[id^="${key}"]`);
            await element.select(value);
        } catch (error) {
            await this.errorService.handleError(
                error as Error,
                async () => {
                    const element = await this.waitForElement(`[id^="${key}"]`);
                    await element.select(value);
                }
            );
        }
    }

    async setCheckboxInput(key: string) {
        try {
            await this.page.$eval(`[id^="${key}"]`, (el: Element) => (el as HTMLInputElement).click());
        } catch (error) {
            await this.errorService.handleError(
                error as Error,
                async () => {
                    await this.page.$eval(`[id^="${key}"]`, (el: Element) => (el as HTMLInputElement).click());
                }
            );
        }
    }

    async checkResultInput(key: string, expectedValue: string): Promise<boolean> {
        try {
            const value = await this.page.$eval(
                `[id^="${key}"]`, 
                (el: Element) => (el as HTMLInputElement).value
            );
            return value === expectedValue;
        } catch (error) {
            this.errorService.logError(error as Error, { key, expectedValue });
            return false;
        }
    }

    async waitForPageLoad() {
        return this.page.waitForFunction(
            () => document.body.className.trim() === "pace-done",
            { timeout: this.config.getConfig().timeouts.page }
        );
    }

    private async waitForAutocompleteMenu() {
        await this.page.evaluate(() => {
            return new Promise<void>((resolve) => {
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        if (mutation.type === "childList") {
                            const menus = document.querySelectorAll(
                                ".ui-menu.ui-widget.ui-widget-content.ui-autocomplete.ui-front"
                            ) as NodeListOf<HTMLElement>;
                            
                            if (Array.from(menus).some(menu => menu.style.display !== "none")) {
                                observer.disconnect();
                                resolve();
                                break;
                            }
                        }
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            });
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
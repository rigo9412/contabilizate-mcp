/* eslint-disable @typescript-eslint/no-explicit-any */
export class ErrorService {
    private static instance: ErrorService;
    private errors: Array<{
        timestamp: Date;
        error: Error;
        context?: any;
    }> = [];

    private constructor() {}

    static getInstance(): ErrorService {
        if (!ErrorService.instance) {
            ErrorService.instance = new ErrorService();
        }
        return ErrorService.instance;
    }

    logError(error: Error, context?: any) {
        this.errors.push({
            timestamp: new Date(),
            error,
            context
        });

        console.error(`[${new Date().toISOString()}] Error:`, {
            message: error.message,
            stack: error.stack,
            context
        });
    }

    async handleError(error: Error, retryFn?: () => Promise<void>, maxRetries = 3): Promise<void> {
        if (!retryFn) {
            this.logError(error);
            throw error;
        }

        for (let i = 0; i < maxRetries; i++) {
            try {
                await retryFn();
                return;
            } catch (error) {
                const retryError = error instanceof Error ? error : new Error(String(error));
                this.logError(retryError, { attempt: i + 1, maxRetries });
                
                if (i === maxRetries - 1) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${retryError.message}`);
                }

                await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
            }
        }
    }

    getErrors() {
        return [...this.errors];
    }

    clearErrors() {
        this.errors = [];
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
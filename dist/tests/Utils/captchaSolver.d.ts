import { Page } from '@playwright/test';
/**
 * Solves a reCAPTCHA v2 and injects the token into the page
 * @param page - Playwright page object
 * @param siteKey - The reCAPTCHA site key (data-sitekey attribute)
 * @param pageUrl - The URL of the page with the captcha
 */
export declare function solveRecaptchaV2(page: Page, siteKey: string, pageUrl: string): Promise<string>;
/**
 * Extracts the reCAPTCHA sitekey from the page
 * @param page - Playwright page object
 */
export declare function extractRecaptchaSiteKey(page: Page): Promise<string | null>;
/**
 * Complete solution: extracts sitekey and solves the captcha
 * @param page - Playwright page object
 * @param manualSiteKey - Optional: provide sitekey manually if auto-detection fails
 */
export declare function solvePageRecaptcha(page: Page, manualSiteKey?: string): Promise<string>;

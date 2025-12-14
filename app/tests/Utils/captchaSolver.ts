/// <reference types="node" />
import { Solver } from '2captcha';
import { Page } from '@playwright/test';

// Initialize the solver with your API key
// Get your API key from https://2captcha.com/enterpage
const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || '2236ed0bf10c2af01c39aa116ced63bf';

const solver = new Solver(TWOCAPTCHA_API_KEY);

/**
 * Solves a reCAPTCHA v2 and injects the token into the page
 * @param page - Playwright page object
 * @param siteKey - The reCAPTCHA site key (data-sitekey attribute)
 * @param pageUrl - The URL of the page with the captcha
 */
export async function solveRecaptchaV2(page: Page, siteKey: string, pageUrl: string): Promise<string> {
  console.log('Sending reCAPTCHA to 2Captcha for solving with api key...', TWOCAPTCHA_API_KEY);
  
  const result = await solver.recaptcha(siteKey, pageUrl);
  
  console.log('reCAPTCHA solved!');
  
  // Inject the token into the page
  await page.evaluate((token: string) => {
    // Set the g-recaptcha-response textarea value
    const responseField = document.querySelector('#g-recaptcha-response') as HTMLTextAreaElement;
    if (responseField) {
      responseField.value = token;
      responseField.style.display = 'block'; // Make visible temporarily for debugging
    }
    
    // Also try to find it in iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const iframeResponseField = iframeDoc?.querySelector('#g-recaptcha-response') as HTMLTextAreaElement;
        if (iframeResponseField) {
          iframeResponseField.value = token;
        }
      } catch (e) {
        // Cross-origin iframe, skip
      }
    });
    
    // Trigger the callback if it exists
    if (typeof (window as any).captchaCallback === 'function') {
      (window as any).captchaCallback(token);
    }
    
    // Try grecaptcha callback
    if (typeof (window as any).grecaptcha !== 'undefined') {
      const widgetId = (window as any).grecaptcha.getWidgetId?.() ?? 0;
      (window as any).grecaptcha.callback?.(token);
    }
  }, result.data);
  
  return result.data;
}

/**
 * Extracts the reCAPTCHA sitekey from the page
 * @param page - Playwright page object
 */
export async function extractRecaptchaSiteKey(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    // Try to find sitekey in the recaptcha div
    const recaptchaDiv = document.querySelector('.g-recaptcha');
    if (recaptchaDiv) {
      const sitekey = recaptchaDiv.getAttribute('data-sitekey');
      if (sitekey) return sitekey;
    }
    
    // Try to find it in any iframe with recaptcha in src
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      const src = iframe.getAttribute('src') || '';
      // Match recaptcha/anchor or recaptcha/api2
      if (src.includes('recaptcha') || src.includes('google.com/recaptcha')) {
        const match = src.match(/[?&]k=([^&]+)/);
        if (match) {
          return match[1];
        }
      }
    }
    
    // Try to find in script tags or inline scripts
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.innerHTML || '';
      // Multiple patterns to find sitekey
      const patterns = [
        /sitekey['":\s]+['"]([^'"]+)['"]/,
        /data-sitekey=['"]([^'"]+)['"]/,
        /grecaptcha\.render\([^,]+,\s*\{\s*['"]?sitekey['"]?\s*:\s*['"]([^'"]+)['"]/,
      ];
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          return match[1];
        }
      }
    }
    
    // Try to find in page HTML attributes
    const allElements = document.querySelectorAll('[data-sitekey]');
    for (const el of allElements) {
      const sitekey = el.getAttribute('data-sitekey');
      if (sitekey) return sitekey;
    }
    
    return null;
  });
}

/**
 * Complete solution: extracts sitekey and solves the captcha
 * @param page - Playwright page object
 * @param manualSiteKey - Optional: provide sitekey manually if auto-detection fails
 */
export async function solvePageRecaptcha(page: Page, manualSiteKey?: string): Promise<string> {
  const pageUrl = page.url();
  
  // Wait for recaptcha to load (try multiple selectors)
  try {
    await page.waitForSelector('iframe[src*="recaptcha"], iframe[src*="google.com/recaptcha"], .g-recaptcha', { timeout: 10000 });
  } catch {
    console.log('Warning: Could not find recaptcha iframe, continuing anyway...');
  }
  
  let siteKey = manualSiteKey || await extractRecaptchaSiteKey(page);
  
  if (!siteKey) {
    // Log page content for debugging
    const iframeSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => f.src);
    });
    console.log('Found iframes:', iframeSrcs);
    throw new Error(`Could not find reCAPTCHA sitekey on the page: ${pageUrl}`);
  }
  
  console.log(`Found sitekey: ${siteKey}`);
  
  return await solveRecaptchaV2(page, siteKey, pageUrl);
}


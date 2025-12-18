"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Navegacion en freerangetesters.com', () => {
    (0, test_1.test)('Los links principales redirigen correctamente', async ({ page }) => {
        await test_1.test.step('Estando yo en la web principal freerangetesters.com', async () => {
            await page.goto('https://www.freerangetesters.com/');
            //await page.fill('input[id="name"]', 'John');
            //await page.click('button[id="greet"]');
            //await expect(page.getByText('Google')).toBeVisible();
        });
        await test_1.test.step('Cuando hago click en "Cursos"', async () => {
            page.locator('#page_header').getByRole('link', { name: 'Cursos', exact: true }).filter({});
            await page.waitForURL('**/cursos');
        });
        await test_1.test.step('Muestro el titulo de la pagina "Cursos"', async () => {
            const a = page.getByRole('heading', { name: 'Cursos' });
            await page.$$eval('h1', (elements) => elements.map(element => element.textContent));
            // a.locator('h1').click();
            //await expect(page).toHaveTitle('Cursos');
        });
    });
});
//# sourceMappingURL=test-1.spec.js.map
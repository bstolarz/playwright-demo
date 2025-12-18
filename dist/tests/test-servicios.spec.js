"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const captchaSolver_1 = require("./Utils/captchaSolver");
(async () => {
    test_1.test.describe('Navegacion en servicios Campichuelo', () => {
        (0, test_1.test)('Accedo a la deuda de AYSA', async ({ page }) => {
            await page.goto('https://oficinavirtual.web.aysa.com.ar/Ingreso.html?tramites&/tipo/ParametrosFacturacion/');
            await page.getByRole('button', { name: 'Ya estoy registrada/o' }).click();
            await page.getByPlaceholder('Email').fill('brenda.stolarz@gmail.com');
            await page.getByPlaceholder('Password').fill('Listento32');
            await page.getByRole('button', { name: 'Log On' }).click();
            //let CancelarBoton = await page.getBy('link', { name: 'Cancelar' });
            let CancelarBoton = page.locator('#__xmlview5--cancel');
            if (CancelarBoton) {
                await CancelarBoton.click();
            }
            let InicioBoton = await page.getByRole('link', { name: 'Inicio' });
            if (InicioBoton) {
                await InicioBoton.click();
            }
            const flecha = await page.locator('#container-ovPortal---home--selectCuenta-label');
            await flecha.click();
            await sleep(3000);
            await page.locator('#container-ovPortal---home--selectCuenta-arrow').click();
            await page.getByRole('option', { name: '- Campichuelo' }).click();
            await page.getByRole('button', { name: 'Ver detalle' }).click();
            const saldo = await page.locator('[id="__text68"]').textContent();
            console.log("saldo: " + saldo);
            const valoresColumnaNombres = await page.$$eval('table tbody tr td:nth-child(4)', elements => elements.map(element => element.textContent));
            await (0, test_1.expect)(valoresColumnaNombres[0]?.split('$')[1].trimStart(), "HAY DEUDA").toEqual(saldo?.split('$')[1].trimStart());
            await (0, test_1.expect)(saldo?.trimStart().replace(' ', ''), "HAY DEUDA").toBe("Su saldo es $0,00");
        });
        (0, test_1.test)('Accedo a la deuda de Metrogas', async ({ page }, testInfo) => {
            //test.fixme(true, "No se puede acceder a la deuda de Metrogas");
            //test.fail(true, "No se puede acceder a la deuda de Metrogas");
            await page.goto('https://www.metrogas.com.ar/');
            testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
            await page.getByRole('strong').filter({ hasText: 'Oficina virtual' }).click();
            await page.getByRole('link', { name: 'Hogares' }).click();
            await page.getByText('Iniciar Sesión').click();
            await page.getByRole('textbox', { name: 'Email' }).click();
            await page.getByRole('textbox', { name: 'Email' }).fill('brenda.stolarz@gmail.com');
            await page.getByRole('button', { name: 'Continue' }).click();
            await page.getByRole('textbox', { name: 'Password' }).click();
            await page.getByRole('textbox', { name: 'Password' }).fill('listento_32');
            await page.locator('#logOnFormSubmit').click();
            //await sleep(3000);
            const estadoCuenta = await page.getByLabel('Estado de Cuenta').getByText('$').textContent();
            const ultimaFactura = await page.getByLabel('Última factura').getByText('$').textContent();
            (0, test_1.expect)(estadoCuenta?.trimStart(), 'HAY DEUDA').toEqual(ultimaFactura?.trimStart());
        });
        test_1.test.skip('Accedo a la deuda de Edenor', async ({ page }, testInfo) => {
            await page.goto('https://www.edenordigital.com');
            //const emailBtn = page.getByTestId('unifiedAuth.email');
            const emailBtn = page.locator('[data-testid="unifiedAuth.email"]');
            await emailBtn.click();
            const usernameInput = page.locator('.MuiInputBase-root').first();
            await usernameInput.fill('brenda.stolarz@gmail.com');
            /*
            await page.getByRole('textbox', { name: 'Email' }).fill('brenda.stolarz@gmail.com');
            await page.getByRole('button', { name: 'Continue' }).click();
            await page.getByRole('textbox', { name: 'Password' }).click();
            */
        });
        test_1.test.skip('Accedo a website de ABL', async ({ page }, testInfo) => {
            // Increase timeout for captcha solving (can take up to 2 minutes)
            test_1.test.setTimeout(180000);
            await page.goto('https://lb.agip.gob.ar/ConsultaABL/');
            await page.getByRole('textbox', { name: 'Partida', exact: true }).fill('1749841');
            await page.getByRole('textbox', { name: 'Reingrese partida' }).fill('1749841');
            // Solve the reCAPTCHA using 2Captcha API
            await (0, captchaSolver_1.solvePageRecaptcha)(page);
            await page.getByRole('button', { name: 'Consultar' }).click();
            // Wait for results and verify
            await page.waitForLoadState('networkidle');
            testInfo.attach('screenshot-result', { body: await page.screenshot(), contentType: 'image/png' });
        });
    });
})();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
//# sourceMappingURL=test-servicios.spec.js.map
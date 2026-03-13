import {test, expect, TestInfo} from '@playwright/test';
import { solvePageRecaptcha } from './Utils/captchaSolver.js';

const AYSA_EMAIL = process.env.AYSA_EMAIL!;
const AYSA_PASSWORD = process.env.AYSA_PASSWORD!;
const METROGAS_EMAIL = process.env.METROGAS_EMAIL!;
const METROGAS_PASSWORD = process.env.METROGAS_PASSWORD!;
const EDENOR_EMAIL = process.env.EDENOR_EMAIL!;
const EDENOR_PASSWORD = process.env.EDENOR_PASSWORD!;

test.describe('Navegacion en servicios Campichuelo', () => {
    test('Accedo a la deuda de AYSA', async ({page}) => {

        await page.goto('https://oficinavirtual.web.aysa.com.ar/Ingreso.html?tramites&/tipo/ParametrosFacturacion/');
        await page.getByRole('button', { name: 'Ya estoy registrada/o' }).click();
        await page.getByPlaceholder('Email').fill(AYSA_EMAIL);
        await page.getByPlaceholder('Password').fill(AYSA_PASSWORD);
        await page.getByRole('button', { name: 'Log On'}).click();

        // Esperar post-login (el portal SAP puede tardar en cargar)
        await page.waitForLoadState('networkidle');

        const CancelarBoton = page.locator('#__xmlview5--cancel');
        if (await CancelarBoton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await CancelarBoton.click();
            await page.waitForLoadState('networkidle');
        }

        const InicioBoton = page.getByRole('link', { name: 'Inicio' });
        if (await InicioBoton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await InicioBoton.click();
            await page.waitForLoadState('networkidle');
        }

        // Esperar a que cargue el componente de selección de cuenta
        await page.locator('#container-ovPortal---home--selectCuenta-arrow').waitFor({ timeout: 20000 });
        await page.locator('#container-ovPortal---home--selectCuenta-arrow').click();
        await page.getByRole('option', { name: /Casa Tigre/i }).click();
        await page.getByRole('button', { name: 'Ver detalle' }).click();

        const saldo = await page.locator('[id="__text72"]').textContent();
        console.log("saldo: " + saldo);

        const valoresColumnaNombres = await page.locator('table tbody tr td:nth-child(4)').evaluateAll(
            elements => elements.map(el => el.textContent)
        );

        await expect(valoresColumnaNombres[0]?.split('$')[1].trimStart(), "HAY DEUDA").toEqual(saldo?.split('$')[1].trimStart());
    });

    test('Accedo a la deuda de Metrogas', async ({page}, testInfo: TestInfo) => {
        await page.goto('https://www.metrogas.com.ar/');
        testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
        await page.getByRole('strong').filter({ hasText: 'Oficina virtual' }).click();
        await page.getByRole('link', { name: 'Hogares' }).click();
        await page.getByText('Iniciar Sesión').click();
        await page.getByRole('textbox', { name: 'Email' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill(METROGAS_EMAIL);
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.getByRole('textbox', { name: 'Password' }).click();
        await page.getByRole('textbox', { name: 'Password' }).fill(METROGAS_PASSWORD);
        await page.locator('#logOnFormSubmit').click();
        // Wait for the dashboard grid to appear after login (SAP UI5 app takes time to load)
        await page.locator('#application-Home-show-component---Main--idMainGrid').waitFor({ timeout: 15000 });
        // Usar CSS classes (estables) en lugar de IDs dinámicos generados por SAP UI5
        const estadoCuenta = await page.locator('#__panel2 .saldo').textContent();
        const ultimaFactura = await page.locator('#__panel1 .importeFactura').textContent();
        expect(estadoCuenta?.trimStart(), 'HAY DEUDA').toEqual(ultimaFactura?.trimStart());
    });

    test('Accedo a la deuda de Edenor', async ({page}, testInfo: TestInfo) => {
        test.setTimeout(60000);

        await page.goto('https://www.edenordigital.com', { waitUntil: 'networkidle' });

        const cookiesButton = page.getByRole('button', { name: /aceptar/i }).first();
        if (await cookiesButton.isVisible().catch(() => false)) {
            await cookiesButton.click();
        }

        const emailBtn = page.locator('[data-testid="unifiedAuth.email"]');
        if (await emailBtn.isVisible().catch(() => false)) {
            await emailBtn.click();
        }

        // The Edenor login form uses unlabeled textboxes (visual labels are div elements,
        // not proper <label> elements linked to inputs). Use positional selectors instead.
        // First textbox = Email, second textbox = Contraseña.
        const emailInput = page.getByRole('textbox').first();

        await emailInput.waitFor({ timeout: 30000 });
        await emailInput.fill(EDENOR_EMAIL);

        const passwordInput = page.getByRole('textbox').nth(1);

        await passwordInput.waitFor({ timeout: 30000 });
        await passwordInput.fill(EDENOR_PASSWORD);

        // Submit button is labeled "Ingresar"
        await page.getByRole('button', { name: 'Ingresar' }).click();

        testInfo.attach('edenor-after-login', {
            body: await page.screenshot(),
            contentType: 'image/png',
        });
    });

    test('Accedo a website de ABL', async ({page}, testInfo: TestInfo) => {
        test.setTimeout(180000);

        await page.goto('https://lb.agip.gob.ar/ConsultaABL/');
        await page.getByRole('textbox', { name: 'Partida', exact: true }).fill('1749841');
        await page.getByRole('textbox', { name: 'Reingrese partida' }).fill('1749841');

        await solvePageRecaptcha(page);

        await page.getByRole('button', { name: 'Consultar' }).click();

        await page.waitForLoadState('networkidle');
        testInfo.attach('screenshot-result', { body: await page.screenshot(), contentType: 'image/png' });
    });
});

import {test, expect, Browser, Page, TestInfo} from '@playwright/test';

(async () => {
test.describe('Navegacion en servicios Campichuelo', () => {
    test('Accedo a la deuda de AYSA', async ({page}) => {

        await page.goto('https://oficinavirtual.web.aysa.com.ar/Ingreso.html?tramites&/tipo/ParametrosFacturacion/');
        await page.getByRole('button', { name: 'Ya estoy registrada/o' }).click();
        await page.getByPlaceholder('Email').fill('brenda.stolarz@gmail.com');
        await page.getByPlaceholder('Password').fill('Listento32');
        await page.getByRole('button', { name: 'Log On'}).click();
        //let CancelarBoton = await page.getBy('link', { name: 'Cancelar' });
        let CancelarBoton = page.locator('#__xmlview5--cancel')
        if (CancelarBoton) {
            await CancelarBoton.click();

        }
        let InicioBoton = await page.getByRole('link', { name: 'Inicio' });
        if (InicioBoton) {
            await InicioBoton.click();
        }
        await sleep(3000);
        const flecha = await page.locator('#container-ovPortal---home--selectCuenta-label')
        await flecha.click();
        await page.getByRole('option', { name: '2317896 - Casa Tigre' }).click(); // select the option

        //await page.getByRole('link', { name: 'Última factura' }).click();
        //await page.waitForURL('**/ultima-factura');
        

        //await page.$$eval('h1', (elements) => elements.map(element => element.textContent));

    });
    test.only('Accedo a la deuda de Metrogas', async ({page}, testInfo: TestInfo) => {
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
      await sleep(3000);
      await expect(page.getByText('No registra deuda'), 'HAY UN ERROR').toBeVisible();

    });

  });
})();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

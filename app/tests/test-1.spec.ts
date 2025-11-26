import {test, expect, Browser, Page} from '@playwright/test';

test.describe('Navegacion en freerangetesters.com', () => {
    test('Los links principales redirigen correctamente', async ({page}) => {
      await test.step('Estando yo en la web principal freerangetesters.com', async () => {
        await page.goto('https://www.freerangetesters.com/');
        //await page.fill('input[id="name"]', 'John');
        //await page.click('button[id="greet"]');
        //await expect(page.getByText('Google')).toBeVisible();
      });
      await test.step('Cuando hago click en "Cursos"', async () => {
        page.locator('#page_header').getByRole('link', { name: 'Cursos', exact: true }).filter({});
        await page.waitForURL('**/cursos');
      });
  
      await test.step('Muestro el titulo de la pagina "Cursos"', async () => {
        const a =  page.getByRole('heading', { name: 'Cursos' });
        await page.$$eval('h1', (elements) => elements.map(element => element.textContent));
       // a.locator('h1').click();
        //await expect(page).toHaveTitle('Cursos');
      });
    });
  });

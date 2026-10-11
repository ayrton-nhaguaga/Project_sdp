import { test, expect } from '@playwright/test';
test('financial flow persists, updates charts, filters and deletes', async ({
  page,
  request,
}, testInfo) => {
  const tag = 'Teste E2E ' + Date.now();
  const year = new Date().getFullYear();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const ids: number[] = [];
  let categoryId: number | undefined;
  const before = await (
    await request.get(
      '/api/dashboard/summary?startDate=' + year + '-01-01&endDate=' + year + '-12-31',
    )
  ).json();
  async function add(
    type: 'Receita' | 'Despesa',
    description: string,
    amount: string,
    category: string,
  ) {
    await page.getByRole('button', { name: 'Nova Transacção', exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: new RegExp(type) }).click();
    await dialog.getByLabel('Descrição', { exact: true }).fill(description);
    await dialog.getByLabel('Valor (MT)', { exact: true }).fill(amount);
    await dialog.getByLabel('Categoria', { exact: true }).selectOption({ label: category });
    const responsePromise = page.waitForResponse(
      (r) => r.url().endsWith('/api/transactions') && r.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Criar transacção' }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    ids.push((await response.json()).data.id);
    await expect(dialog).not.toBeVisible();
  }
  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    await add('Receita', tag + ' receita', '25000', 'Salário');
    await add('Despesa', tag + ' despesa', '5000', 'Alimentação');
    const summary = await (
      await request.get(
        '/api/dashboard/summary?startDate=' + year + '-01-01&endDate=' + year + '-12-31',
      )
    ).json();
    expect(summary.data.balanceCents - before.data.balanceCents).toBe(2_000_000);
    await expect(
      page.getByRole('img', { name: 'Receitas e despesas por mês de ' + year }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByText(tag + ' receita', { exact: true })).toBeVisible();
    await expect(page.getByText(tag + ' despesa', { exact: true })).toBeVisible();
    await page.screenshot({
      path: 'test-results/dashboard-' + testInfo.project.name + '.png',
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await page.getByRole('link', { name: 'Transacções', exact: true }).click();
    await page.getByLabel('Pesquisar descrição').fill(tag);
    await expect(page.getByText('2 transacções encontradas')).toBeVisible();
    await page.getByRole('button', { name: 'Editar ' + tag + ' despesa', exact: true }).click();
    await page.getByLabel('Valor (MT)', { exact: true }).fill('6000');
    await page.getByRole('button', { name: 'Guardar alterações' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('− 6.000,00 MT', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar ' + tag + ' despesa', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByText(tag + ' despesa', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar ' + tag + ' despesa', exact: true }).click();
    await page.getByRole('button', { name: 'Sim, eliminar' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(tag + ' despesa', { exact: true })).not.toBeVisible();
    await page.getByRole('link', { name: 'Categorias', exact: true }).click();
    await page.getByRole('button', { name: 'Nova Categoria' }).click();
    await page.getByLabel('Nome', { exact: true }).fill(tag);
    const createCategory = page.waitForResponse(
      (r) => r.url().endsWith('/api/categories') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Guardar categoria' }).click();
    categoryId = (await (await createCategory).json()).data.id;
    await expect(page.getByRole('heading', { name: tag, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Editar ' + tag, exact: true }).click();
    await page.getByLabel('Nome', { exact: true }).fill(tag + ' editada');
    await page.getByRole('button', { name: 'Guardar categoria' }).click();
    await expect(page.getByRole('heading', { name: tag + ' editada', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar ' + tag + ' editada', exact: true }).click();
    await page.getByRole('button', { name: 'Sim, eliminar' }).click();
    await expect(
      page.getByRole('heading', { name: tag + ' editada', exact: true }),
    ).not.toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    for (const id of ids) await request.delete('/api/transactions/' + id);
    if (categoryId) await request.delete('/api/categories/' + categoryId);
  }
});

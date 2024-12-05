export async function document_connections(page, vuContext, events, test) {
  const { step } = test;

  await step('open', async () => {
    await page.goto('/');
  });

  await step('connect', async () => {
    await page.getByPlaceholder('Enter code').fill(vuContext.vars.code);
    await page.getByPlaceholder('Enter code').press('Enter');
  });

  await step('wait_for_connection', async () => {
    const editor = page.locator('[data-slate-editor]');
    await editor.waitFor();
  });
}

export async function document_updates(page, vuContext, events, test) {
  const { step } = test;

  await step('open', async () => {
    await page.goto('/');
  });

  await step('connect', async () => {
    // await page.getByTitle('Create Markdown').click();
    const uuid = await page.evaluate(() => crypto.randomUUID());
    await page.getByPlaceholder('Enter code').fill(uuid);
    await page.getByPlaceholder('Enter code').press('Enter');
  });

  await step('create_check_list', async () => {
    const editor = page.locator('[data-slate-editor]');
    await editor.dblclick();
    for (let index = 0; index < 6; index++) {
      await editor.pressSequentially(
        `-[] Implementing todo ${index + 1} for next week.`,
      );
      await editor.press('Enter');
    }
  });
}

export async function single_document_updates(page, vuContext, events, test) {
  const { step } = test;

  await step('open', async () => {
    await page.goto('/');
  });

  await step('connect', async () => {
    await page.getByPlaceholder('Enter code').fill(vuContext.vars.code);
    await page.getByPlaceholder('Enter code').press('Enter');
  });

  await step('create_check_list', async () => {
    const editor = page.locator('[data-slate-editor]');
    await editor.dblclick();
    for (let index = 0; index < 6; index++) {
      await editor.pressSequentially(
        `-[] Implementing todo ${index + 1} for next week.`,
      );
      await editor.press('Enter');
    }
  });
}

export async function load_documents(page, vuContext, events, test) {
  const { step } = test;

  await step('open', async () => {
    await page.goto('/');
  });

  await step('connect', async () => {
    const uuid = await page.evaluate(() => crypto.randomUUID());
    await page.getByPlaceholder('Enter code').fill(uuid);
    await page.getByPlaceholder('Enter code').press('Enter');
  });

  await step('wait_for_connection', async () => {
    const editor = page.locator('[data-slate-editor]');
    await editor.waitFor();
  });
}

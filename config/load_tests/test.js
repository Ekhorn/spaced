export async function createItemAndWriteCheckList(page, test) {
  const { step } = test;

  await step('open', async () => {
    await page.goto('http://localhost:1420');
  });

  await step('create_item', async () => {
    await page.getByTitle('Create Markdown').click();
  });

  await step('create_check_list', async () => {
    await page.click('[data-slate-editor]');
    await page.pressSequentially('-[] Implementing todo 1 for next week.');
    await page.pressSequentially('-[] Implementing todo 2 for next week.');
    await page.pressSequentially('-[] Implementing todo 3 for next week.');
    await page.pressSequentially('-[] Implementing todo 4 for next week.');
    await page.pressSequentially('-[] Implementing todo 5 for next week.');
    await page.pressSequentially('-[] Implementing todo 6 for next week.');
  });
}

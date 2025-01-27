export async function create_and_share_document(page, vuContext, events, test) {
  const { step } = test;

  await step('open', async () => {
    await page.goto('/');
  });

  await step('create', async () => {
    await page.getByTitle('Create Item').click();
    const editor = page.locator('[data-slate-editor]');

    await editor.dblclick();
    await editor.pressSequentially(`Entering Title`);
    await editor.press('Enter');
    await editor.press('Enter');
  });

  await step('share', async () => {
    await page.getByTitle('Share').click();

    await page
      .locator("input[name='username']")
      .pressSequentially('RandomUser');

    await page.evaluate(() => {
      const getRandomHexColor = () => {
        const randomColor = Math.floor(Math.random() * 16_777_215).toString(16);
        return `#${randomColor.padStart(6, '0')}`;
      };
      const input = document.querySelector("input[name='color']");
      if (input) {
        input.value = getRandomHexColor();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.click("button[type='submit']");
    const uuid = await page.evaluate(
      () =>
        (window.crypto.randomUUID = () => {
          return 'mocked response';
        }),
    );
    vuContext.vars.uuid = uuid;
  });
}

export async function join_and_update_document(page, vuContext, events, test) {
  const { step } = test;

  await step('open', async () => {
    await page.goto('/');
  });

  await step('join', async () => {
    await page.getByPlaceholder('Enter code').fill(vuContext.vars.uuid);
    await page.getByPlaceholder('Enter code').press('Enter');

    await page
      .locator("input[name='username']")
      .pressSequentially('RandomUser');

    await page.evaluate(() => {
      const getRandomHexColor = () => {
        const randomColor = Math.floor(Math.random() * 16_777_215).toString(16);
        return `#${randomColor.padStart(6, '0')}`;
      };
      const input = document.querySelector("input[name='color']");
      if (input) {
        input.value = getRandomHexColor();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
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

// ###########

// export async function document_connections(page, vuContext, events, test) {
//   const { step } = test;

//   await step('open', async () => {
//     await page.goto('/');
//   });

//   await step('connect', async () => {
//     await page.getByPlaceholder('Enter code').fill(vuContext.vars.code);
//     await page.getByPlaceholder('Enter code').press('Enter');
//   });

//   await step('wait_for_connection', async () => {
//     const editor = page.locator('[data-slate-editor]');
//     await editor.waitFor();
//   });
// }

// export async function document_updates(page, vuContext, events, test) {
//   const { step } = test;

//   await step('open', async () => {
//     await page.goto('/');
//   });

//   await step('connect', async () => {
//     // await page.getByTitle('Create Markdown').click();
//     const uuid = await page.evaluate(
//       () =>
//         (window.crypto.randomUUID = () => {
//           return 'mocked response';
//         }),
//     );
//     await page.getByPlaceholder('Enter code').fill(uuid);
//     await page.getByPlaceholder('Enter code').press('Enter');
//   });

//   await step('create_check_list', async () => {
//     const editor = page.locator('[data-slate-editor]');
//     await editor.dblclick();
//     for (let index = 0; index < 6; index++) {
//       await editor.pressSequentially(
//         `-[] Implementing todo ${index + 1} for next week.`,
//       );
//       await editor.press('Enter');
//     }
//   });
// }

// export async function single_document_updates(page, vuContext, events, test) {
//   const { step } = test;

//   await step('open', async () => {
//     await page.goto('/');
//   });

//   await step('connect', async () => {
//     await page.getByPlaceholder('Enter code').fill(vuContext.vars.code);
//     await page.getByPlaceholder('Enter code').press('Enter');
//   });

//   await step('create_check_list', async () => {
//     const editor = page.locator('[data-slate-editor]');
//     await editor.dblclick();
//     for (let index = 0; index < 6; index++) {
//       await editor.pressSequentially(
//         `-[] Implementing todo ${index + 1} for next week.`,
//       );
//       await editor.press('Enter');
//     }
//   });
// }

// export async function load_documents(page, vuContext, events, test) {
//   const { step } = test;

//   await step('open', async () => {
//     await page.goto('/');
//   });

//   await step('connect', async () => {
//     const uuid = await page.evaluate(() => crypto.randomUUID());
//     await page.getByPlaceholder('Enter code').fill(uuid);
//     await page.getByPlaceholder('Enter code').press('Enter');
//   });

//   await step('wait_for_connection', async () => {
//     const editor = page.locator('[data-slate-editor]');
//     await editor.waitFor();
//   });
// }

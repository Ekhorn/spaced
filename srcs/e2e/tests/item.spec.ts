import { type Page, test, expect } from '@playwright/test';
import { type Item } from 'types';

import { toEndOfLine } from '../utils/editor.js';

const addItem = async (page: Page, x: number, y: number, width: number) => {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    async ([x, y, width]) => {
      await new Promise<void>((resolve) => {
        const request = indexedDB.open('spaced');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('item', 'readwrite');
          tx.objectStore('item').add({
            x,
            y: -y,
            w: width,
            h: 0,
            editor: 'rich',
            schema: JSON.stringify([
              {
                type: 'paragraph',
                children: [{ text: '' }],
              },
            ]),
          });
          resolve();
        };
      });
    },
    [x, y, width],
  );
  await page.reload({ waitUntil: 'commit' });
};

const getItems = async (page: Page): Promise<Item[]> => {
  return await page.evaluate(async () => {
    return await new Promise<Item[]>((resolve) => {
      const request = indexedDB.open('spaced');
      request.onsuccess = async () => {
        const db = request.result;
        const tx = db.transaction('item', 'readwrite');
        const items = tx.objectStore('item').getAll();

        setTimeout(() => {
          resolve(items.result);
        }, 100);
      };
    });
  });
};

test.describe('Item', () => {
  let width: number, height: number, x: number, y: number;

  test.beforeEach(async ({ page }) => {
    width = 424;
    height = 72;
    [x, y] = await page.evaluate(
      ([width]) => {
        return [(window.innerWidth - width) / 2, window.innerHeight / 2];
      },
      [width],
    );

    await page.goto('/');
    await addItem(page, x, y, width);
    await page.reload({ waitUntil: 'commit' });
  });

  test('should translate on pan', async ({ page }) => {
    const item = page.locator('[data-spaced-item="1"]');
    const initialPosition = await item.evaluate((el) => ({
      x: el.getBoundingClientRect().left,
      y: el.getBoundingClientRect().top,
    }));
    expect(initialPosition).toStrictEqual({ x, y });

    await page.mouse.down();
    await page.mouse.move(100, 100, { steps: 10 });
    await page.mouse.up();

    const newPosition = await item.evaluate((el) => ({
      x: el.getBoundingClientRect().left,
      y: el.getBoundingClientRect().top,
    }));
    expect(newPosition).toStrictEqual({ x: x + 100, y: y + 100 });
  });

  test('should scale on zoom', async ({ page }) => {
    const item = page.locator('[data-spaced-item="1"]');
    const initialSize = await item.evaluate((el) => ({
      w: el.getBoundingClientRect().width,
      h: el.getBoundingClientRect().height,
      x: el.getBoundingClientRect().left,
      y: el.getBoundingClientRect().top,
    }));
    expect(initialSize).toStrictEqual({ w: width, h: height, x, y });

    await page.mouse.wheel(0, 10);
    await page.waitForTimeout(100);

    const newSize = await item.evaluate((el) => ({
      w: Math.floor(el.getBoundingClientRect().width),
      h: Math.floor(el.getBoundingClientRect().height),
      x: Math.floor(el.getBoundingClientRect().left),
      y: Math.floor(el.getBoundingClientRect().top),
    }));
    expect(newSize).toStrictEqual({
      w: width - 71,
      h: height - 12,
      x: x - 72,
      y: y - 60,
    });
  });

  /**
   * Requires physical android device or AVD Emulator
   * https://playwright.dev/docs/api/class-android
   */
  test.skip('should scale on pinch', async ({ page }) => {
    const editor = page.locator('[data-slate-editor]');
    // await androidDevice.pinchOpen(selector, percent);

    await expect(editor.getByText('')).toBeVisible();
  });

  test('should be selectable', async ({ page }) => {
    const item = page.locator('[data-spaced-item="1"]');

    await expect(item.getByTestId('toolbar')).toBeHidden();

    await item.locator('[data-slate-editor]').click();

    await expect(item.getByTestId('toolbar')).toBeVisible();
    await page.waitForTimeout(100);
  });

  test('should allow multi-select', async ({ page }) => {
    await addItem(page, x, y - 100, width);

    const item1 = page.locator('[data-spaced-item="1"]');
    const item2 = page.locator('[data-spaced-item="2"]');

    await expect(item1.getByTestId('toolbar')).toBeHidden();
    await expect(item2.getByTestId('toolbar')).toBeHidden();

    await item1.click();
    await item2.click({ modifiers: ['Shift'] });

    await expect(item1.getByTestId('toolbar')).toBeVisible();
    await expect(item2.getByTestId('toolbar')).toBeVisible();
    await page.waitForTimeout(100);
  });

  test('should be draggable', async ({ page }) => {
    const item = page.locator('[data-spaced-item="1"]');

    await item.click();

    const initialMove = 50;
    await page.mouse.move(0, initialMove, { steps: 2 });

    const dragDistance = 100;
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(0, dragDistance, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Shift');

    const items = await getItems(page);
    expect(items).toStrictEqual([
      {
        editor: 'rich',
        h: 0,
        id: 1,
        schema: '[{"type":"paragraph","children":[{"text":""}]}]',
        w: 424,
        x,
        y: -y - dragDistance + initialMove,
      },
    ]);
  });

  test('should allow multi-drag', async ({ page }) => {
    await addItem(page, x, y - 100, width);

    const item1 = page.locator('[data-spaced-item="1"]');
    const item2 = page.locator('[data-spaced-item="2"]');

    await item1.click();
    await item2.click({ modifiers: ['Shift'] });

    const initialMove = 50;
    await page.mouse.move(initialMove, 0, { steps: 2 });

    const dragDistance = 100;
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(dragDistance, 0, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Shift');

    const items = await getItems(page);
    expect(items).toStrictEqual([
      {
        editor: 'rich',
        h: 0,
        id: 1,
        schema: '[{"type":"paragraph","children":[{"text":""}]}]',
        w: 424,
        x: x + dragDistance - initialMove,
        y: -y,
      },
      {
        editor: 'rich',
        h: 0,
        id: 2,
        schema: '[{"type":"paragraph","children":[{"text":""}]}]',
        w: 424,
        x: x + dragDistance - initialMove,
        y: -y + 100,
      },
    ]);
  });
});

test.describe('Richtext item', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTitle('Create Item').click();
  });

  test('should be created with empty text', async ({ page }) => {
    const editor = page.locator('[data-slate-editor]');

    await expect(editor).toContainText('');
  });

  test('should show toolbar when selected', async ({ page }) => {
    const editor = page.locator('[data-spaced-item="1"]');

    await expect(editor.getByTestId('toolbar')).toBeHidden();

    await editor.click();

    await expect(editor.getByTestId('toolbar')).toBeVisible();
  });
});

test.describe('Markdown item', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTitle('Create Markdown').click();
  });

  test('should be created with empty text', async ({ page }) => {
    const editor = page.locator('[data-slate-editor]');

    await expect(editor).toContainText('');
  });

  test.describe('shortcuts', () => {
    const elements = [
      {
        type: 'Heading one',
        shortcut: '# ',
        element: 'h1',
      },
      {
        type: 'Block quote',
        shortcut: '> ',
        element: 'blockquote',
      },
      {
        type: 'List item',
        shortcut: '- ',
        element: 'ul > li',
      },
      {
        type: 'Ordered list item',
        shortcut: '1. ',
        element: 'ol > li',
      },
      {
        type: 'Check list item',
        shortcut: '-[] ',
        element: 'div',
      },
    ];

    test.beforeEach(async ({ page }) => {
      await page.dblclick('[data-slate-editor]');
    });

    for (const { element, shortcut, type } of elements) {
      test(`should support ${type.toLowerCase()}`, async ({ page }) => {
        const editor = page.locator('[data-slate-editor]');
        await editor.pressSequentially(shortcut + type);
        await expect(
          page.locator(`[data-slate-editor] > ${element}`),
        ).toContainText(type);
      });
    }

    for (const { shortcut, type } of elements) {
      test(`should remove ${type.toLowerCase()} block on backspace at line start`, async ({
        browserName,
        page,
      }) => {
        test.fixme(
          browserName === 'webkit',
          "Backspace at line start on line 1 doesn't work",
        );

        const editor = page.locator('[data-slate-editor]');
        await editor.pressSequentially(shortcut + type);
        for (let index = 0; index < type.split(' ').length + 1; index++) {
          await page.keyboard.press('Control+ArrowLeft');
        }
        await page.keyboard.press('Backspace');
        await expect(page.locator(`[data-slate-editor] > p`)).toContainText(
          type,
        );
      });
    }
  });
});

test.describe('Item collaboration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should collaborate', async ({ browser, browserName, page: page1 }) => {
    await page1.getByTitle('Create Item').click();

    const editor1 = page1.locator('[data-slate-editor]');

    await editor1.dblclick();
    // TODO: this should rely on a debounce not a delay
    await editor1.pressSequentially('Collaborating...', { delay: 100 });
    await expect(editor1).toContainText('Collaborating...');

    await page1.getByTitle('Share').click();

    const user1 = 'User 1';
    await page1.locator("input[name='username']").pressSequentially(user1);
    await page1.evaluate(() => {
      const input = document.querySelector(
        "input[name='color']",
      ) as HTMLInputElement;
      if (input) {
        input.value = '#27D835';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page1.click("button[type='submit']");

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/');

    /* https://github.com/microsoft/playwright/issues/13037
     * navigator.clipboard.readText() doesn't work in webkit, and granting permission doesn't help.
     * const code = await page1.evaluate(
     *   async () => await window.navigator.clipboard.readText(),
     * );
     */
    test.fixme(
      browserName === 'webkit',
      "test using shortcuts doesn't work either",
    );
    await page2.getByPlaceholder('Enter code').press('Control+V');
    await page2.getByPlaceholder('Enter code').press('Enter');

    const user2 = 'User 2';
    await page2.locator("input[name='username']").pressSequentially(user2);
    await page2.evaluate(() => {
      const input = document.querySelector(
        "input[name='color']",
      ) as HTMLInputElement;
      if (input) {
        input.value = '#F44678';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    const editor2 = page2.locator('[data-slate-editor]');

    await expect(editor2).toContainText('Collaborating...');

    await editor2.dblclick();
    await editor2.click();
    await toEndOfLine(editor1, 0);
    await editor2.pressSequentially(', yes we are!', { delay: 100 });

    const text = await editor1.textContent();
    // TODO: handle invalid cursors remove normalize string remove BOM unicode chars etc.
    expect(text?.replace('\uFEFF', '')).toBe(
      `Collaborating..., yes we are${user2}!`,
    );
    // TODO: fix cursor position to be in the correct location
    await expect(editor2).toContainText(`Collaborating..., yes we are!`);

    await editor1.dblclick();
    await toEndOfLine(editor1, 0);
    await editor1.press('Enter');
    await editor1.pressSequentially(':)', { delay: 100 });

    // TODO: create test fixture checking multiline editor content
    await expect(editor1.locator(`p`)).toContainText([
      `Collaborating..., yes we are!${user2}`,
      `:)`,
    ]);
    // TODO: fix cursor position to be in the correct location
    for (const [i, expected] of [
      `Collaborating..., yes we are!`,
      `:${user1})`,
    ].entries()) {
      const text = await editor2.locator(`p`).nth(i).textContent();
      expect(text?.replace('\uFEFF', '')).toBe(expected);
    }

    await test.step('disconnect editor', async () => {
      await page1.getByTitle('Stop Sharing').click();
      await expect(editor1.locator(`p`)).toContainText([
        `Collaborating..., yes we are!`,
        `:)`,
      ]);
      // TODO: FIX
      // await expect(editor2.locator(`p`)).toContainText([
      //   `Collaborating..., yes we are!`,
      //   `:)`,
      // ]);
    });
  });

  test('should cancel before sharing', async ({ page }) => {
    await page.getByTitle('Create Item').click();

    const editor = page.locator('[data-slate-editor]');

    await editor.dblclick();
    await editor.pressSequentially('Collaborating...', { delay: 100 });
    await expect(editor).toContainText('Collaborating...');

    await page.getByTitle('Share').click();
    await page.getByTitle('Cancel').click();
    // TODO: check websocket connection?
    await expect(page.getByTitle('Cancel')).toBeHidden();
    await expect(page.getByTitle('Share')).toBeVisible();
  });
});

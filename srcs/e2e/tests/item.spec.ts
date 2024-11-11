import { type Page, test, expect } from '@playwright/test';
import { type Item } from 'types';

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
    height = 36;
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
      h: height - 6,
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

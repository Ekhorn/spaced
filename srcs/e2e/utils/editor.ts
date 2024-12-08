import { type Locator } from '@playwright/test';

export async function toEndOfLine(locator: Locator, number: number) {
  const line = await locator.locator('*').nth(number).textContent();
  for (let index = 0; index < (line?.split(' ')?.length ?? 0) + 1; index++) {
    await locator.page().keyboard.press('Control+ArrowRight');
  }
}

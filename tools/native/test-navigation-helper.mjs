// Follow the visible native navigation, including secondary views in the app menu.
// No force clicks or page-side dispatch: a hidden or unreachable control must fail.
export async function navigateTo(page, tab) {
  if (!/^[a-z]+$/.test(tab)) throw new Error('Invalid test navigation target: ' + tab);
  const target = page.locator('.tab[data-tab="' + tab + '"]');
  await target.waitFor({ state: 'attached' });
  if (!await target.isVisible()) {
    const menu = page.locator('.native-options');
    if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
    await target.waitFor({ state: 'visible' });
  }
  await target.click();
  await page.locator('#panel-' + tab).waitFor({ state: 'visible' });
}

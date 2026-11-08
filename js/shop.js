export function purchaseSkin(save, skin) {
  if (save.unlockedSkins.includes(skin.id)) { save.selectedSkin = skin.id; return 'equipped'; }
  if (save.coins < skin.price) return 'insufficient';
  save.coins -= skin.price; save.unlockedSkins.push(skin.id); save.selectedSkin = skin.id;
  return 'purchased';
}
export function purchaseTheme(save, theme) {
  if (save.unlockedThemes.includes(theme.id)) { save.selectedTheme = theme.id; return 'owned'; }
  if (save.coins < theme.price) return 'insufficient';
  save.coins -= theme.price; save.unlockedThemes.push(theme.id); save.selectedTheme = theme.id;
  return 'purchased';
}

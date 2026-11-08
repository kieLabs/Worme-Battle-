import { makeDefaultSave } from './logic.js';
const KEY = 'gamerkie-worms-battle-save-v1';
export function loadSave() {
  const base = makeDefaultSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return base;
    const merged = {...base, ...parsed};
    merged.settings = {...base.settings, ...(parsed.settings || {})};
    merged.workshop = {...base.workshop, ...(parsed.workshop || {})};
    if (!Array.isArray(merged.unlockedSkins)) merged.unlockedSkins = [0];
    if (!Array.isArray(merged.unlockedThemes)) merged.unlockedThemes = ['meadow'];
    if (!Array.isArray(merged.achievements)) merged.achievements = [];
    return merged;
  } catch (error) {
    console.warn('Save data could not be loaded; using a fresh profile.', error);
    return base;
  }
}
export function saveData(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch (error) { console.warn('Save failed (storage may be full or disabled).', error); return false; }
}
export function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function claimDaily(save, date = new Date()) {
  const today = localDayKey(date);
  if (save.lastDailyClaim === today) return {ok:false, reason:'already'};
  const yesterday = new Date(date); yesterday.setDate(yesterday.getDate()-1);
  save.dailyStreak = save.lastDailyClaim === localDayKey(yesterday) ? (save.dailyStreak % 14) + 1 : 1;
  save.lastDailyClaim = today;
  const reward = {coins: 60 + save.dailyStreak * 20, xp: 40 + save.dailyStreak * 10, day:save.dailyStreak};
  save.coins += reward.coins; save.xp += reward.xp;
  saveData(save);
  return {ok:true,reward};
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Phase10Game, WizardGame, CaboGame } from '../types';

const KEYS = {
  phase10: 'phase10_games',
  wizard: 'wizard_games',
  cabo: 'cabo_games',
};

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function loadAll<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// ─── Phase 10 ─────────────────────────────────────────────────────────────────

export async function loadPhase10Games(): Promise<Phase10Game[]> {
  return loadAll<Phase10Game>(KEYS.phase10);
}

export async function savePhase10Game(game: Phase10Game): Promise<void> {
  const games = await loadPhase10Games();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.unshift(game);
  }
  await saveAll(KEYS.phase10, games);
}

export async function deletePhase10Game(id: string): Promise<void> {
  const games = await loadPhase10Games();
  await saveAll(KEYS.phase10, games.filter((g) => g.id !== id));
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export async function loadWizardGames(): Promise<WizardGame[]> {
  return loadAll<WizardGame>(KEYS.wizard);
}

export async function saveWizardGame(game: WizardGame): Promise<void> {
  const games = await loadWizardGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.unshift(game);
  }
  await saveAll(KEYS.wizard, games);
}

export async function deleteWizardGame(id: string): Promise<void> {
  const games = await loadWizardGames();
  await saveAll(KEYS.wizard, games.filter((g) => g.id !== id));
}

// ─── Cabo ─────────────────────────────────────────────────────────────────────

export async function loadCaboGames(): Promise<CaboGame[]> {
  return loadAll<CaboGame>(KEYS.cabo);
}

export async function saveCaboGame(game: CaboGame): Promise<void> {
  const games = await loadCaboGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.unshift(game);
  }
  await saveAll(KEYS.cabo, games);
}

export async function deleteCaboGame(id: string): Promise<void> {
  const games = await loadCaboGames();
  await saveAll(KEYS.cabo, games.filter((g) => g.id !== id));
}

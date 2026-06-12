// ─── Shared ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
}

// ─── Phase 10 ─────────────────────────────────────────────────────────────────

export interface Phase10Player extends Player {
  currentPhase: number;   // 1–10; 11 = game finished
  totalPoints: number;
  completedGame: boolean;
}

export interface Phase10Round {
  roundNumber: number;
  scores: {
    playerId: string;
    points: number;
    completedPhase: boolean; // did the player complete their phase this round?
  }[];
}

export interface Phase10Game {
  id: string;
  createdAt: number;
  players: Phase10Player[];
  rounds: Phase10Round[];
  finished: boolean;
  winnerId: string | null;
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

export interface WizardPlayer extends Player {
  totalPoints: number;
}

export interface WizardRoundBid {
  playerId: string;
  bid: number;
  tricksTaken: number | null; // null = not yet entered
}

export interface WizardRound {
  roundNumber: number;
  cardCount: number;   // = roundNumber (1 card in round 1, etc.)
  bids: WizardRoundBid[];
  finished: boolean;
}

export interface WizardGame {
  id: string;
  createdAt: number;
  players: WizardPlayer[];
  rounds: WizardRound[];
  totalRounds: number;
  finished: boolean;
}

// ─── Cabo ─────────────────────────────────────────────────────────────────────

export interface CaboPlayer extends Player {
  totalPoints: number;
  eliminated: boolean; // reached 100+ points
}

export interface CaboRound {
  roundNumber: number;
  caboCallerId: string | null;  // who called "Cabo"
  scores: {
    playerId: string;
    handValue: number;          // sum of card values in hand
    finalPoints: number;        // after Cabo bonus/penalty applied
    hasCaboBonus: boolean;
    hasCaboPenalty: boolean;
  }[];
}

export interface CaboGame {
  id: string;
  createdAt: number;
  players: CaboPlayer[];
  rounds: CaboRound[];
  finished: boolean;
  winnerId: string | null;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  Phase10Setup: { gameId?: string };
  Phase10Game: { gameId: string };
  WizardSetup: { gameId?: string };
  WizardGame: { gameId: string };
  CaboSetup: { gameId?: string };
  CaboGame: { gameId: string };
};

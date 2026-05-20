export type TeamId = 'A' | 'B';

export type FieldPos = {
  id: string;
  x: number; // 0–100 % of field width
  y: number; // 0–100 % of field height
  team: TeamId;
  role: string;
};

export const POSITIONS: FieldPos[] = [
  { id: 'A_GK', x: 50, y: 8,  team: 'A', role: 'GK' },
  { id: 'A_DL', x: 12, y: 24, team: 'A', role: 'DL' },
  { id: 'A_DR', x: 88, y: 24, team: 'A', role: 'DR' },
  { id: 'A_ML', x: 35, y: 38, team: 'A', role: 'ML' },
  { id: 'A_MR', x: 65, y: 38, team: 'A', role: 'MR' },
  { id: 'B_GK', x: 50, y: 92, team: 'B', role: 'GK' },
  { id: 'B_DL', x: 12, y: 76, team: 'B', role: 'DL' },
  { id: 'B_DR', x: 88, y: 76, team: 'B', role: 'DR' },
  { id: 'B_ML', x: 35, y: 62, team: 'B', role: 'ML' },
  { id: 'B_MR', x: 65, y: 62, team: 'B', role: 'MR' },
];

// Assignments used in s9 (18 mai 2026)
export const DEFAULT_ASSIGNMENT: Record<string, string> = {
  A_GK: 'Michael',
  A_DL: 'Henri',
  A_DR: 'LM',
  A_ML: 'Khalid',
  A_MR: 'Hugo',
  B_GK: 'Rémi',
  B_DL: 'Edouard',
  B_DR: 'Flo',
  B_ML: 'Ibrahima',
  B_MR: 'Dylan',
};

export const DEFAULT_BENCH = ['Jack', 'Tim', 'Théo'];

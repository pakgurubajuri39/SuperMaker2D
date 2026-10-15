export const TILE_SIZE = 32;
export const STAGE_COLS = 80;
export const STAGE_ROWS = 15;

export enum Tile {
  AIR = 0,
  SOLID = 1,
  QUESTION = 2,
  SPIKE = 3,
  COIN = 4,
  ENEMY = 5,
  GOAL = 6,
  PLAYER_START = 7,
  INERT_BLOCK = 8, // After question block is hit
}

export interface TileDefinition {
  id: Tile;
  name: string;
  color: string;
  accent: string;
  shortcut: string;
  desc: string;
}

export const TILE_DEFS: Record<Tile, TileDefinition> = {
  [Tile.AIR]: {
    id: Tile.AIR,
    name: 'Eraser',
    color: '#0f172a',
    accent: '#64748b',
    shortcut: '0',
    desc: 'Clear tile'
  },
  [Tile.SOLID]: {
    id: Tile.SOLID,
    name: 'Ground Brick',
    color: '#b45309',
    accent: '#15803d',
    shortcut: '1',
    desc: 'Solid block with grass top'
  },
  [Tile.QUESTION]: {
    id: Tile.QUESTION,
    name: 'Question Block',
    color: '#f59e0b',
    accent: '#fbbf24',
    shortcut: '2',
    desc: 'Hit from below for coin'
  },
  [Tile.SPIKE]: {
    id: Tile.SPIKE,
    name: 'Hazard Spikes',
    color: '#ef4444',
    accent: '#991b1b',
    shortcut: '3',
    desc: 'Instant respawn on contact'
  },
  [Tile.COIN]: {
    id: Tile.COIN,
    name: 'Gold Coin',
    color: '#eab308',
    accent: '#fef08a',
    shortcut: '4',
    desc: 'Collectible +100 points'
  },
  [Tile.ENEMY]: {
    id: Tile.ENEMY,
    name: 'Goomba Patrol',
    color: '#a16207',
    accent: '#78350f',
    shortcut: '5',
    desc: 'Patrols horizontally, stompable'
  },
  [Tile.GOAL]: {
    id: Tile.GOAL,
    name: 'Goal Flagpole',
    color: '#10b981',
    accent: '#34d399',
    shortcut: '6',
    desc: 'Stage victory finish line'
  },
  [Tile.PLAYER_START]: {
    id: Tile.PLAYER_START,
    name: 'Player Start',
    color: '#3b82f6',
    accent: '#60a5fa',
    shortcut: '7',
    desc: 'Spawn location'
  },
  [Tile.INERT_BLOCK]: {
    id: Tile.INERT_BLOCK,
    name: 'Empty Block',
    color: '#64748b',
    accent: '#475569',
    shortcut: '8',
    desc: 'Depleted question block'
  }
};

export type ThemeType = 'grassland' | 'underground' | 'sky' | 'castle';

export interface LevelData {
  id: string;
  name: string;
  theme: ThemeType;
  cols: number;
  rows: number;
  grid: number[][]; // [row][col]
  timeLimit: number;
}

export interface MapNode {
  id: string;
  name: string;
  x: number; // grid 0..9
  y: number; // grid 0..5
  type: 'level' | 'castle';
  levelId: string;
  cleared: boolean;
  unlocked: boolean;
}

export interface MapPath {
  from: string;
  to: string;
}

export interface WorldData {
  title: string;
  playerNodeId: string;
  nodes: MapNode[];
  paths: MapPath[];
  levels: Record<string, LevelData>;
}

// Helper to create an empty grid
export function createEmptyGrid(cols = STAGE_COLS, rows = STAGE_ROWS): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = new Array(cols).fill(Tile.AIR);
    grid.push(row);
  }
  // Default ground at bottom 2 rows
  for (let c = 0; c < cols; c++) {
    grid[rows - 1][c] = Tile.SOLID;
    grid[rows - 2][c] = Tile.SOLID;
  }
  // Default start and goal
  grid[rows - 3][3] = Tile.PLAYER_START;
  grid[rows - 3][cols - 5] = Tile.GOAL;
  return grid;
}

// Preset Level 1: Green Hills
export function createLevel1(): LevelData {
  const grid = createEmptyGrid();
  // Pit at 20..23
  for (let c = 20; c <= 23; c++) {
    grid[STAGE_ROWS - 1][c] = Tile.AIR;
    grid[STAGE_ROWS - 2][c] = Tile.AIR;
  }
  // Floating question blocks
  grid[9][8] = Tile.QUESTION;
  grid[9][10] = Tile.SOLID;
  grid[9][11] = Tile.QUESTION;
  grid[9][12] = Tile.SOLID;
  grid[9][14] = Tile.QUESTION;

  // Coins above
  grid[7][10] = Tile.COIN;
  grid[7][11] = Tile.COIN;
  grid[7][12] = Tile.COIN;

  // Pipe/Stair structure
  for (let r = 10; r <= 12; r++) {
    grid[r][17] = Tile.SOLID;
    grid[r][18] = Tile.SOLID;
  }

  // Enemy patrol
  grid[12][15] = Tile.ENEMY;
  grid[12][28] = Tile.ENEMY;
  grid[12][35] = Tile.ENEMY;

  // Platform over pit
  grid[10][21] = Tile.SOLID;
  grid[10][22] = Tile.SOLID;
  grid[9][21] = Tile.COIN;
  grid[9][22] = Tile.COIN;

  // Second question block cluster
  grid[8][30] = Tile.QUESTION;
  grid[8][32] = Tile.QUESTION;
  grid[8][34] = Tile.QUESTION;
  grid[6][32] = Tile.COIN;

  // Small staircase before goal
  for (let i = 0; i < 4; i++) {
    for (let r = 12 - i; r <= 12; r++) {
      grid[r][65 + i] = Tile.SOLID;
    }
  }

  // Spikes trap
  grid[12][42] = Tile.SPIKE;
  grid[12][43] = Tile.SPIKE;
  grid[9][42] = Tile.QUESTION;
  grid[9][43] = Tile.QUESTION;

  return {
    id: 'lvl_1',
    name: '1-1 Sunny Grasslands',
    theme: 'grassland',
    cols: STAGE_COLS,
    rows: STAGE_ROWS,
    grid,
    timeLimit: 300,
  };
}

// Preset Level 2: Underground Caverns
export function createLevel2(): LevelData {
  const grid = createEmptyGrid();
  // Ceiling
  for (let c = 0; c < STAGE_COLS; c++) {
    grid[0][c] = Tile.SOLID;
    grid[1][c] = Tile.SOLID;
  }
  // Spikes pit
  for (let c = 18; c <= 25; c++) {
    grid[12][c] = Tile.SPIKE;
  }
  // Floating rock ledges
  for (let c = 19; c <= 24; c += 2) {
    grid[9][c] = Tile.SOLID;
    grid[8][c] = Tile.COIN;
  }
  // Enemies in cave
  grid[12][12] = Tile.ENEMY;
  grid[12][15] = Tile.ENEMY;
  grid[12][32] = Tile.ENEMY;
  grid[12][45] = Tile.ENEMY;

  // Low tunnels
  for (let c = 35; c <= 42; c++) {
    grid[10][c] = Tile.SOLID;
    grid[9][c] = Tile.QUESTION;
  }
  grid[12][38] = Tile.SPIKE;

  // Treasure cove
  for (let c = 52; c <= 58; c++) {
    grid[8][c] = Tile.SOLID;
    grid[7][c] = Tile.COIN;
  }

  return {
    id: 'lvl_2',
    name: '1-2 Deep Caverns',
    theme: 'underground',
    cols: STAGE_COLS,
    rows: STAGE_ROWS,
    grid,
    timeLimit: 300,
  };
}

// Preset Level 3: Sky Heights
export function createLevel3(): LevelData {
  const grid: number[][] = [];
  for (let r = 0; r < STAGE_ROWS; r++) {
    grid.push(new Array(STAGE_COLS).fill(Tile.AIR));
  }
  // Start platform
  for (let c = 0; c <= 8; c++) {
    grid[12][c] = Tile.SOLID;
    grid[13][c] = Tile.SOLID;
    grid[14][c] = Tile.SOLID;
  }
  grid[11][3] = Tile.PLAYER_START;

  // Cloud/mushroom platforms
  const islands = [
    { start: 12, end: 17, y: 10 },
    { start: 21, end: 25, y: 8 },
    { start: 29, end: 35, y: 11 },
    { start: 39, end: 44, y: 7 },
    { start: 48, end: 54, y: 9 },
    { start: 58, end: 65, y: 11 },
    { start: 70, end: 79, y: 12 },
  ];

  islands.forEach((isle) => {
    for (let c = isle.start; c <= isle.end; c++) {
      grid[isle.y][c] = Tile.SOLID;
      if (Math.random() > 0.4) {
        grid[isle.y - 1][c] = Tile.COIN;
      }
    }
    // Place enemies on some islands
    if (isle.end - isle.start >= 4 && isle.y >= 9) {
      grid[isle.y - 1][isle.start + 2] = Tile.ENEMY;
    }
  });

  // Question blocks
  grid[6][23] = Tile.QUESTION;
  grid[5][41] = Tile.QUESTION;
  grid[7][51] = Tile.QUESTION;

  // End goal
  for (let c = 70; c < STAGE_COLS; c++) {
    grid[13][c] = Tile.SOLID;
    grid[14][c] = Tile.SOLID;
  }
  grid[11][75] = Tile.GOAL;

  return {
    id: 'lvl_3',
    name: '1-3 Cloud Kingdom',
    theme: 'sky',
    cols: STAGE_COLS,
    rows: STAGE_ROWS,
    grid,
    timeLimit: 250,
  };
}

// Preset Level 4: Bowser's Fortress
export function createLevel4(): LevelData {
  const grid = createEmptyGrid();
  // Castle ceiling
  for (let c = 0; c < STAGE_COLS; c++) {
    grid[0][c] = Tile.SOLID;
  }
  // Fiery spike lava pits
  for (let c = 12; c <= 16; c++) {
    grid[12][c] = Tile.SPIKE;
    grid[13][c] = Tile.SPIKE;
    grid[14][c] = Tile.SPIKE;
  }
  for (let c = 28; c <= 33; c++) {
    grid[12][c] = Tile.SPIKE;
    grid[13][c] = Tile.SPIKE;
    grid[14][c] = Tile.SPIKE;
  }
  for (let c = 46; c <= 52; c++) {
    grid[12][c] = Tile.SPIKE;
    grid[13][c] = Tile.SPIKE;
    grid[14][c] = Tile.SPIKE;
  }

  // Stepping stones
  grid[10][14] = Tile.SOLID;
  grid[9][14] = Tile.COIN;
  grid[9][30] = Tile.SOLID;
  grid[9][31] = Tile.SOLID;

  // Guard enemies
  grid[12][20] = Tile.ENEMY;
  grid[12][24] = Tile.ENEMY;
  grid[12][40] = Tile.ENEMY;
  grid[12][60] = Tile.ENEMY;
  grid[12][63] = Tile.ENEMY;

  // High fortress battlement
  for (let c = 56; c <= 65; c++) {
    grid[10][c] = Tile.SOLID;
  }
  grid[8][58] = Tile.QUESTION;
  grid[8][60] = Tile.QUESTION;
  grid[8][62] = Tile.QUESTION;

  return {
    id: 'lvl_4',
    name: '1-4 Bowser Keep',
    theme: 'castle',
    cols: STAGE_COLS,
    rows: STAGE_ROWS,
    grid,
    timeLimit: 240,
  };
}

// Initial Overworld Map Data
export function createDefaultWorld(): WorldData {
  const l1 = createLevel1();
  const l2 = createLevel2();
  const l3 = createLevel3();
  const l4 = createLevel4();

  const nodes: MapNode[] = [
    { id: 'node_1', name: '1-1 Plains', x: 1, y: 4, type: 'level', levelId: l1.id, cleared: false, unlocked: true },
    { id: 'node_2', name: '1-2 Cavern', x: 3, y: 2, type: 'level', levelId: l2.id, cleared: false, unlocked: false },
    { id: 'node_3', name: '1-3 Skyway', x: 6, y: 2, type: 'level', levelId: l3.id, cleared: false, unlocked: false },
    { id: 'node_4', name: '1-4 Castle', x: 8, y: 4, type: 'castle', levelId: l4.id, cleared: false, unlocked: false },
  ];

  const paths: MapPath[] = [
    { from: 'node_1', to: 'node_2' },
    { from: 'node_2', to: 'node_3' },
    { from: 'node_3', to: 'node_4' },
  ];

  return {
    title: 'World 1 - Grassland & Fortress',
    playerNodeId: 'node_1',
    nodes,
    paths,
    levels: {
      [l1.id]: l1,
      [l2.id]: l2,
      [l3.id]: l3,
      [l4.id]: l4,
    },
  };
}

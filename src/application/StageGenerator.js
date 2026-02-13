import { Cell, Difficulty, HintCell, StageDto, WallCell } from '../domain/entities.js';
import { countSolutions, verifyUniqueSolution } from '../domain/services/Solver.js';
import { SeededRandom } from '../infrastructure/SeededRandom.js';

function difficultyConfig(difficulty, random) {
  if (difficulty === Difficulty.EASY) {
    return { size: random.pick([5, 6]), hintRatio: 0.4, walls: 0 };
  }
  if (difficulty === Difficulty.MEDIUM) {
    return { size: random.pick([6, 7]), hintRatio: 0.24, walls: random.int(2, 8) };
  }
  return { size: random.int(7, 10), hintRatio: 0.14, walls: random.int(8, 20) };
}

function baseSnakePath(n) {
  const path = [];
  for (let r = 0; r < n; r += 1) {
    if (r % 2 === 0) for (let c = 0; c < n; c += 1) path.push(new Cell(r, c));
    else for (let c = n - 1; c >= 0; c -= 1) path.push(new Cell(r, c));
  }
  return path;
}

function transformCell(cell, n, transform) {
  const { flipH, flipV, transpose } = transform;
  let r = cell.row;
  let c = cell.col;
  if (transpose) [r, c] = [c, r];
  if (flipH) c = n - 1 - c;
  if (flipV) r = n - 1 - r;
  return new Cell(r, c);
}

function transformedPath(n, random) {
  const transform = {
    flipH: random.int(0, 1) === 1,
    flipV: random.int(0, 1) === 1,
    transpose: random.int(0, 1) === 1
  };

  let path = baseSnakePath(n).map((cell) => transformCell(cell, n, transform));
  if (random.int(0, 1) === 1) path = [...path].reverse();
  return path;
}

function baseAnchors(pathLen, n) {
  // Anchor row turns to strongly reduce branching while keeping puzzle-like freedom.
  const set = new Set([0, pathLen - 1]);
  for (let r = 0; r < n; r += 1) {
    set.add(r * n);
    set.add(r * n + (n - 1));
  }
  return set;
}

function pickHintIndices(pathLen, n, ratio, random) {
  const anchors = baseAnchors(pathLen, n);
  const target = Math.max(anchors.size, Math.floor(pathLen * ratio));
  while (anchors.size < target) anchors.add(random.int(1, pathLen - 2));
  return [...anchors].sort((a, b) => a - b);
}

const edgeKey = (aRow, aCol, bRow, bCol) => {
  const a = `${aRow},${aCol}`;
  const b = `${bRow},${bCol}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
};

function addWalls(path, n, wallTarget, random) {
  if (wallTarget <= 0) return [];
  const consecutive = new Set();
  for (let i = 1; i < path.length; i += 1) {
    consecutive.add(edgeKey(path[i - 1].row, path[i - 1].col, path[i].row, path[i].col));
  }

  const candidates = [];
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (r + 1 < n && !consecutive.has(edgeKey(r, c, r + 1, c))) candidates.push(new WallCell(r, c, r + 1, c));
      if (c + 1 < n && !consecutive.has(edgeKey(r, c, r, c + 1))) candidates.push(new WallCell(r, c, r, c + 1));
    }
  }

  random.shuffle(candidates);
  return candidates.slice(0, Math.min(wallTarget, candidates.length));
}

function stageFromParts({ n, difficulty, seed, path, hintIndices, walls }) {
  const hints = hintIndices.map((idx) => new HintCell(idx + 1, path[idx].row, path[idx].col));
  return new StageDto({
    gridSize: n,
    difficulty,
    seed,
    path,
    hintNumbers: hints,
    walls,
    gameWinSequence: path.map((c) => c.row * n + c.col + 1)
  });
}

export function generateStage(stageNumber, difficulty) {
  const random = new SeededRandom(stageNumber * 2654435761 + difficulty.length * 97);
  const config = difficultyConfig(difficulty, random);

  const n = config.size;
  const path = transformedPath(n, random);
  const walls = addWalls(path, n, config.walls, random);

  let hintIndices = pickHintIndices(path.length, n, config.hintRatio, random);
  let stage = stageFromParts({ n, difficulty, seed: stageNumber, path, hintIndices, walls });

  // Uniqueness guarantee with bounded work: add hints until solver returns exactly one solution.
  let solved = countSolutions(stage, 2, 200000);
  if (solved.aborted || solved.solutions !== 1) {
    const order = [...Array(path.length).keys()].slice(1, -1);
    random.shuffle(order);
    for (const idx of order) {
      hintIndices = [...new Set([...hintIndices, idx])].sort((a, b) => a - b);
      stage = stageFromParts({ n, difficulty, seed: stageNumber, path, hintIndices, walls });
      solved = countSolutions(stage, 2, 200000);
      if (!solved.aborted && solved.solutions === 1) break;
    }
  }

  if (!verifyUniqueSolution(stage)) {
    // deterministic fallback: fully reveal path so uniqueness is absolute.
    hintIndices = [...Array(path.length).keys()];
    stage = stageFromParts({ n, difficulty, seed: stageNumber, path, hintIndices, walls });
  }

  return stage;
}

export function generateExampleStages() {
  return [
    generateStage(11, Difficulty.EASY),
    generateStage(22, Difficulty.MEDIUM),
    generateStage(33, Difficulty.HARD)
  ];
}

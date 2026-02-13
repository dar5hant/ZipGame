import { Cell } from '../entities.js';

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

export function isInside(n, r, c) {
  return r >= 0 && r < n && c >= 0 && c < n;
}

export function toKey(r, c) {
  return `${r},${c}`;
}

export function wallSet(walls) {
  const set = new Set();
  for (const w of walls) {
    const a = `${w.fromRow},${w.fromCol}`;
    const b = `${w.toRow},${w.toCol}`;
    set.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }
  return set;
}

export function areAdjacent(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function blocked(a, b, blockedEdges) {
  const ka = toKey(a.row, a.col);
  const kb = toKey(b.row, b.col);
  const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  return blockedEdges.has(key);
}

export function checkPlayerMoveValidity(stage, pathCells) {
  const n = stage.GridSize;
  const blockedEdges = wallSet(stage.Walls);
  const seen = new Set();

  for (let i = 0; i < pathCells.length; i += 1) {
    const cell = pathCells[i];
    if (!isInside(n, cell.row, cell.col)) return { valid: false, reason: 'OUT_OF_BOUNDS' };
    const key = toKey(cell.row, cell.col);
    if (seen.has(key)) return { valid: false, reason: 'REVISIT' };
    seen.add(key);

    if (i > 0) {
      const prev = pathCells[i - 1];
      if (!areAdjacent(prev, cell)) return { valid: false, reason: 'NOT_ORTHOGONAL' };
      if (blocked(prev, cell, blockedEdges)) return { valid: false, reason: 'WALL_BLOCK' };
    }
  }

  const hintsByPos = new Map(stage.HintNumbers.map((h) => [`${h.row},${h.col}`, h.number]));
  for (let i = 0; i < pathCells.length; i += 1) {
    const h = hintsByPos.get(toKey(pathCells[i].row, pathCells[i].col));
    if (h && h !== i + 1) return { valid: false, reason: 'HINT_ORDER_MISMATCH' };
  }

  return { valid: true };
}

export function checkPathCoversAllCells(stage, pathCells) {
  return pathCells.length === stage.GridSize * stage.GridSize;
}

export function verifyOrderCorrectness(stage, pathCells) {
  const hintsByPos = new Map(stage.HintNumbers.map((h) => [`${h.row},${h.col}`, h.number]));
  for (let i = 0; i < pathCells.length; i += 1) {
    const expected = hintsByPos.get(toKey(pathCells[i].row, pathCells[i].col));
    if (expected && expected !== i + 1) return false;
  }
  return true;
}

export function neighbors(cell, n, blockedEdges) {
  const result = [];
  for (const [dr, dc] of DIRS) {
    const nr = cell.row + dr;
    const nc = cell.col + dc;
    if (!isInside(n, nr, nc)) continue;
    const next = new Cell(nr, nc);
    if (!blocked(cell, next, blockedEdges)) result.push(next);
  }
  return result;
}

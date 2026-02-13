import { Cell } from '../entities.js';
import { neighbors, toKey, wallSet } from './PathValidator.js';

function countUnvisitedNeighborOptions(cell, visited, n, blockedEdges) {
  let count = 0;
  for (const nb of neighbors(cell, n, blockedEdges)) {
    if (!visited.has(toKey(nb.row, nb.col))) count += 1;
  }
  return count;
}

export function countSolutions(stage, stopAt = 2, maxNodes = 200000) {
  const n = stage.GridSize;
  const total = n * n;
  const blockedEdges = wallSet(stage.Walls);

  const hintsByNumber = new Map(stage.HintNumbers.map((h) => [h.number, new Cell(h.row, h.col)]));
  const hintByPos = new Map(stage.HintNumbers.map((h) => [toKey(h.row, h.col), h.number]));

  const start = hintsByNumber.get(1);
  if (!start) return { solutions: 0, aborted: false };

  let solutions = 0;
  let nodes = 0;
  let aborted = false;

  const visited = new Set([toKey(start.row, start.col)]);

  const dfs = (step, current) => {
    if (solutions >= stopAt || aborted) return;
    nodes += 1;
    if (nodes > maxNodes) {
      aborted = true;
      return;
    }

    const hinted = hintsByNumber.get(step);
    if (hinted && (hinted.row !== current.row || hinted.col !== current.col)) return;

    if (step === total) {
      solutions += 1;
      return;
    }


    const nextHint = hintsByNumber.get(step + 1);
    let candidates = neighbors(current, n, blockedEdges).filter((nb) => !visited.has(toKey(nb.row, nb.col)));

    if (nextHint) {
      candidates = candidates.filter((c) => c.row === nextHint.row && c.col === nextHint.col);
    }

    candidates.sort(
      (a, b) =>
        countUnvisitedNeighborOptions(a, visited, n, blockedEdges) -
        countUnvisitedNeighborOptions(b, visited, n, blockedEdges)
    );

    for (const next of candidates) {
      const nk = toKey(next.row, next.col);
      const posHint = hintByPos.get(nk);
      if (posHint && posHint !== step + 1) continue;

      visited.add(nk);
      dfs(step + 1, next);
      visited.delete(nk);
      if (solutions >= stopAt || aborted) return;
    }
  };

  dfs(1, start);
  return { solutions, aborted };
}

export function verifyUniqueSolution(stage) {
  const result = countSolutions(stage, 2);
  return !result.aborted && result.solutions === 1;
}

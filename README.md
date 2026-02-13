# Zip Path Puzzle

A complete grid-based puzzle game inspired by **Zip/Number connect**.

## Architecture

- `src/domain`: entities and core rules.
- `src/application`: deterministic stage generation use-cases.
- `src/infrastructure`: seeded random implementation.
- `src/ui`: mobile-first browser UI and input handling.

## Algorithm Summary

1. **Seeded deterministic generation**
   - Uses `SeededRandom` with stage number + difficulty to make reproducible stages.
2. **Hamiltonian path generation**
   - Builds a full snake Hamiltonian path that covers every cell exactly once.
   - Applies deterministic transforms (flip/transpose/reverse) for layout variety.
3. **Hint placement**
   - Always includes start (`1`) and end (`K`).
   - Adds intermediate hints by difficulty ratio.
4. **Walls / obstacles (as blocked edges)**
   - Walls block moves between adjacent cells.
   - Generator only places walls on edges that are **not** used by the solution path.
5. **Unique solution validator**
   - Backtracking solver with pruning:
     - hint consistency pruning,
     - forced-next-hint pruning,
     - MRV-like next-cell ordering,
     - bounded node exploration to avoid slow worst-cases.
   - Stops early once 2 solutions are found.
   - If not unique, generator progressively injects hints until unique.

## Run

```bash
npm test
npm run start
# open http://localhost:4173
```

## StageDto Shape

```ts
StageDto {
  GridSize: number;
  Difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  Seed: number;
  Path: {row:number; col:number}[];
  HintNumbers: {number:number; row:number; col:number}[];
  Walls: {fromRow:number; fromCol:number; toRow:number; toCol:number}[];
  GameWinSequence: number[];
}
```

## Example Stages

```js
import { generateExampleStages } from './src/application/StageGenerator.js';
console.log(generateExampleStages().map(s => ({
  Difficulty: s.Difficulty,
  Seed: s.Seed,
  GridSize: s.GridSize,
  HintCount: s.HintNumbers.length,
  WallCount: s.Walls.length
})));
```

Typical output:

- EASY seed 11: 5x5, many hints, 0 walls.
- MEDIUM seed 22: 7x7, moderate hints, some walls.
- HARD seed 33: 7-10 grid, fewer hints initially + walls, then tightened until unique.

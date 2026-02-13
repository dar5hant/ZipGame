import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStage } from '../src/application/StageGenerator.js';
import { Difficulty } from '../src/domain/entities.js';
import { verifyUniqueSolution } from '../src/domain/services/Solver.js';

const signature = (s) =>
  JSON.stringify({
    n: s.GridSize,
    hints: s.HintNumbers,
    walls: s.Walls,
    win: s.GameWinSequence
  });

test('same seed + difficulty gives same stage', () => {
  const a = generateStage(42, Difficulty.MEDIUM);
  const b = generateStage(42, Difficulty.MEDIUM);
  assert.equal(signature(a), signature(b));
});

test('different seed gives different stage', () => {
  const a = generateStage(42, Difficulty.MEDIUM);
  const b = generateStage(43, Difficulty.MEDIUM);
  assert.notEqual(signature(a), signature(b));
});

test('generated stages are uniquely solvable', () => {
  const easy = generateStage(5, Difficulty.EASY);
  const medium = generateStage(8, Difficulty.MEDIUM);
  const hard = generateStage(13, Difficulty.HARD);

  assert.equal(verifyUniqueSolution(easy), true);
  assert.equal(verifyUniqueSolution(medium), true);
  assert.equal(verifyUniqueSolution(hard), true);
});

test('generation stays under 200ms budget for hard sample', () => {
  const start = performance.now();
  generateStage(99, Difficulty.HARD);
  const duration = performance.now() - start;
  assert.ok(duration < 200, `duration was ${duration}ms`);
});

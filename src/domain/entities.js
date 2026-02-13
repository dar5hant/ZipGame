export const Difficulty = Object.freeze({
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
});

export class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }

  key() {
    return `${this.row},${this.col}`;
  }
}

export class HintCell {
  constructor(number, row, col) {
    this.number = number;
    this.row = row;
    this.col = col;
  }
}

/**
 * Wall is represented as blocked movement between two orthogonally adjacent cells.
 */
export class WallCell {
  constructor(fromRow, fromCol, toRow, toCol) {
    this.fromRow = fromRow;
    this.fromCol = fromCol;
    this.toRow = toRow;
    this.toCol = toCol;
  }

  key() {
    const a = `${this.fromRow},${this.fromCol}`;
    const b = `${this.toRow},${this.toCol}`;
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }
}

export class StageDto {
  constructor({ gridSize, difficulty, seed, path, hintNumbers, walls, gameWinSequence }) {
    this.GridSize = gridSize;
    this.Difficulty = difficulty;
    this.Seed = seed;
    this.Path = path;
    this.HintNumbers = hintNumbers;
    this.Walls = walls;
    this.GameWinSequence = gameWinSequence;
  }
}

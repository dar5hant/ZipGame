import { generateStage } from '../application/StageGenerator.js';
import { Difficulty } from '../domain/entities.js';
import {
  checkPathCoversAllCells,
  checkPlayerMoveValidity,
  verifyOrderCorrectness,
  wallSet
} from '../domain/services/PathValidator.js';

export class GameController {
  constructor(root) {
    this.root = root;
    this.state = {
      stageNo: 1,
      difficulty: Difficulty.EASY,
      stage: null,
      path: [],
      undoStack: []
    };
    this.dragging = false;
    this.init();
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.loadStage();
  }

  cacheDom() {
    this.gridEl = this.root.querySelector('#grid');
    this.stageLabel = this.root.querySelector('#stageLabel');
    this.diffLabel = this.root.querySelector('#difficultyLabel');
    this.statusLabel = this.root.querySelector('#statusLabel');
    this.stageInput = this.root.querySelector('#stageInput');
    this.difficultySelect = this.root.querySelector('#difficultySelect');
  }

  bindEvents() {
    this.root.querySelector('#loadBtn').addEventListener('click', () => {
      this.state.stageNo = Number(this.stageInput.value) || 1;
      this.state.difficulty = this.difficultySelect.value;
      this.loadStage();
    });

    this.root.querySelector('#nextBtn').addEventListener('click', () => {
      this.state.stageNo += 1;
      this.stageInput.value = String(this.state.stageNo);
      this.loadStage();
    });

    this.root.querySelector('#undoBtn').addEventListener('click', () => this.undo());
    this.root.querySelector('#clearBtn').addEventListener('click', () => this.clearPath());
    this.root.querySelector('#hintBtn').addEventListener('click', () => this.applyHint());
  }

  loadStage() {
    this.state.stage = generateStage(this.state.stageNo, this.state.difficulty);
    this.state.path = [];
    this.state.undoStack = [];
    this.stageLabel.textContent = `Stage ${this.state.stageNo}`;
    this.diffLabel.textContent = this.state.difficulty;
    this.statusLabel.textContent = 'Draw from number 1';
    this.renderGrid();
  }

  cellAt(row, col) {
    return this.state.path.find((c) => c.row === row && c.col === col);
  }

  isHintCell(row, col) {
    return this.state.stage.HintNumbers.find((h) => h.row === row && h.col === col);
  }

  renderGrid() {
    const { GridSize, HintNumbers, Walls } = this.state.stage;
    const hintMap = new Map(HintNumbers.map((h) => [`${h.row},${h.col}`, h.number]));
    const blockedEdges = wallSet(Walls);

    this.gridEl.style.gridTemplateColumns = `repeat(${GridSize}, 1fr)`;
    this.gridEl.innerHTML = '';

    for (let r = 0; r < GridSize; r += 1) {
      for (let c = 0; c < GridSize; c += 1) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        const hint = hintMap.get(`${r},${c}`);
        if (hint) {
          cell.classList.add('hint');
          cell.textContent = String(hint);
        }

        if (this.cellAt(r, c)) {
          cell.classList.add('path');
          const idx = this.state.path.findIndex((p) => p.row === r && p.col === c);
          if (idx === this.state.path.length - 1) cell.classList.add('active');
        }

        const edge = (a, b) => {
          const key = a < b ? `${a}|${b}` : `${b}|${a}`;
          return blockedEdges.has(key);
        };

        const me = `${r},${c}`;
        if (r > 0 && edge(me, `${r - 1},${c}`)) cell.classList.add('wall-top');
        if (c > 0 && edge(me, `${r},${c - 1}`)) cell.classList.add('wall-left');
        if (r + 1 < GridSize && edge(me, `${r + 1},${c}`)) cell.classList.add('wall-bottom');
        if (c + 1 < GridSize && edge(me, `${r},${c + 1}`)) cell.classList.add('wall-right');

        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.dragging = true;
          this.handleCellInput(r, c);
        });
        cell.addEventListener('pointerenter', () => {
          if (this.dragging) this.handleCellInput(r, c);
        });

        this.gridEl.appendChild(cell);
      }
    }

    window.onpointerup = () => {
      this.dragging = false;
      this.evaluate();
    };
  }

  handleCellInput(row, col) {
    const next = { row, col };
    const old = this.state.path[this.state.path.length - 1];

    if (this.state.path.length === 0) {
      const one = this.state.stage.HintNumbers.find((h) => h.number === 1);
      if (one.row !== row || one.col !== col) {
        this.statusLabel.textContent = 'Start at 1.';
        return;
      }
    } else {
      const dist = Math.abs(old.row - row) + Math.abs(old.col - col);
      if (dist !== 1) return;
      if (this.cellAt(row, col)) return;
    }

    this.state.undoStack.push([...this.state.path]);
    this.state.path.push(next);
    this.renderGrid();
  }

  evaluate() {
    const validity = checkPlayerMoveValidity(this.state.stage, this.state.path);
    if (!validity.valid) {
      this.statusLabel.textContent = `Invalid: ${validity.reason}`;
      return;
    }
    if (checkPathCoversAllCells(this.state.stage, this.state.path) && verifyOrderCorrectness(this.state.stage, this.state.path)) {
      this.statusLabel.textContent = '🎉 Cleared! Tap Next Stage.';
      return;
    }
    const nextNumber = this.state.path.length + 1;
    this.statusLabel.textContent = `Valid path. Next target: ${nextNumber}`;
  }

  undo() {
    if (!this.state.undoStack.length) return;
    this.state.path = this.state.undoStack.pop();
    this.renderGrid();
    this.evaluate();
  }

  clearPath() {
    this.state.path = [];
    this.state.undoStack = [];
    this.renderGrid();
    this.statusLabel.textContent = 'Path cleared';
  }

  applyHint() {
    const next = this.state.stage.Path[this.state.path.length];
    if (!next) return;
    this.state.undoStack.push([...this.state.path]);
    this.state.path.push({ row: next.row, col: next.col });
    this.renderGrid();
    this.evaluate();
  }
}

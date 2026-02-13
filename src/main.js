import { GameController } from './ui/GameController.js';
import { generateExampleStages } from './application/StageGenerator.js';

const app = document.querySelector('#app');
new GameController(app);

// Expose examples for quick inspection in browser console.
window.exampleStages = generateExampleStages();

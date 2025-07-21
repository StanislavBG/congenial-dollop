import { Game } from './Game';

// Global error handler to prevent crashes
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent the error from crashing the game
  event.preventDefault();
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the rejection from crashing the game
  event.preventDefault();
});

// Initialize the game when the page loads
window.addEventListener('load', () => {
  try {
    new Game();
    console.log('🎮 Game initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
  }
}); 
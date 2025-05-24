// --- Constants and Game Settings ---

// --- Audio Variables (Declared globally for accessibility across all functions in this script) ---
let audioContext = null; // Will be initialized on first user gesture
const soundLibrary = {}; // Stores decoded audio buffers
const GAME_DURATION_PER_LEVEL = 40000; // milliseconds (e.g., 40 seconds) - now acts as max level duration
const COMBO_THRESHOLD_MS = 700; // Max time between pops for a combo
const MESSAGE_DISPLAY_TIME_MS = 2500; // How long messages stay on screen
const FREEZE_DURATION_MS = 3000; // Duration of freeze effect

// Balloon types, their properties, and associated CSS classes
const BALLOON_TYPES = [
  { color: "white", points: 10, speedMultiplier: 1.0, type: "normal" },
  { color: "blue", points: 15, speedMultiplier: 1.1, type: "normal" },
  { color: "green", points: 20, speedMultiplier: 1.2, type: "normal" },
  { color: "yellow", points: 5, speedMultiplier: 0.9, type: "normal" },
  {
    color: "red",
    points: -20,
    speedMultiplier: 1.0,
    type: "negative",
    text: "💀",
  },
  {
    color: "gold",
    points: 100,
    speedMultiplier: 1.5,
    type: "super",
    text: "💰",
  },
  {
    color: "freeze",
    points: 0,
    speedMultiplier: 0.8,
    type: "special",
    effect: "freeze",
    text: "❄️",
  },
  {
    color: "purple",
    points: 5,
    speedMultiplier: 1.0,
    type: "special",
    effect: "combo",
    text: "✨",
  },
];

// Level configurations
// const LEVELS = [
//   {
//     minSpawnInterval: 1800,
//     maxSpawnInterval: 2200, // Time between balloon spawns
//     baseSpeed: 10, // Base animation duration in seconds (higher = slower)
//     scoreThreshold: 100, // Score needed to advance to next level
//     patternChance: 0.1, // 10% chance for a patterned balloon
//     maxMissedBalloons: 5, // Max balloons allowed to be missed in this level
//   },
//   {
//     minSpawnInterval: 1400,
//     maxSpawnInterval: 1800,
//     baseSpeed: 9,
//     scoreThreshold: 250,
//     patternChance: 0.2,
//     maxMissedBalloons: 7,
//   },
//   {
//     minSpawnInterval: 1000,
//     maxSpawnInterval: 1400,
//     baseSpeed: 8,
//     scoreThreshold: 500,
//     patternChance: 0.3,
//     maxMissedBalloons: 8,
//   },
//   {
//     minSpawnInterval: 800,
//     maxSpawnInterval: 1200,
//     baseSpeed: 7,
//     scoreThreshold: 800,
//     patternChance: 0.4,
//     maxMissedBalloons: 9,
//   },
//   {
//     minSpawnInterval: 600,
//     maxSpawnInterval: 1000,
//     baseSpeed: 6,
//     scoreThreshold: 1200,
//     patternChance: 0.5,
//     maxMissedBalloons: 10,
//   },
//   // Add more levels here as desired
// ];
const TOTAL_GAME_LEVELS = 50;
let LEVELS = [];

const BASE_MIN_SPAWN_INTERVAL = 2200; // Slower spawn
const BASE_MAX_SPAWN_INTERVAL = 1800;
const BASE_SPEED = 10; // Slower speed
const BASE_SCORE_THRESHOLD = 100;
const BASE_PATTERN_CHANCE = 0.05; // Less erratic
const BASE_MAX_MISSED_BALLOONS = 8; // More forgiving

for (let i = 0; i < TOTAL_GAME_LEVELS; i++) {
  const levelNumber = i + 1; // 1-indexed level for calculations

  // Complexity increases:
  // Spawning faster
  let minSpawn = Math.max(400, BASE_MIN_SPAWN_INTERVAL - levelNumber * 20); // Decreases by 20ms per level, min 400ms
  let maxSpawn = Math.max(600, BASE_MAX_SPAWN_INTERVAL - levelNumber * 20);

  // Balloons move faster (smaller duration value = faster animation)
  let speed = Math.max(2, BASE_SPEED - levelNumber * 0.15); // Decreases by 0.15s per level, min 2s

  // Higher score required
  let scoreReq = BASE_SCORE_THRESHOLD + levelNumber * 150; // Increases by 150 points per level

  // More patterned movements (higher chance)
  let pattern = Math.min(0.8, BASE_PATTERN_CHANCE + levelNumber * 0.015); // Increases by 1.5% per level, max 80%

  // Fewer missed balloons allowed (harder to miss)
  let maxMissed = Math.max(
    3,
    BASE_MAX_MISSED_BALLOONS - Math.floor(levelNumber / 4)
  ); // Decreases by 1 every 4 levels, min 3

  LEVELS.push({
    minSpawnInterval: minSpawn,
    maxSpawnInterval: maxSpawn,
    baseSpeed: speed,
    scoreThreshold: scoreReq,
    patternChance: pattern,
    maxMissedBalloons: maxMissed,
  });
}

// --- Game State Variables ---
let score = 0;
let level = 0; // 0-indexed, so Level 1 is LEVELS[0]
let balloonsMissed = 0;
let gameRunning = false;
let gamePaused = false;

let levelTimerId;
let balloonSpawnIntervalId;
let activeBalloons = []; // Stores references to active balloon DOM elements

let lastPopTime = 0;
let currentCombo = 0;
let comboTimerId;
let scoreMultiplier = 1;

// --- DOM Elements Cache ---
const gameArea = document.getElementById("game-area");
const scoreDisplay = document.getElementById("score-display");
const levelDisplay = document.getElementById("level-display");
const gameMessages = document.getElementById("game-messages");

const rulesModal = document.getElementById("rules-modal");
const startGameBtn = document.getElementById("start-game-btn");
const gameOverModal = document.getElementById("game-over-modal");
const finalScoreDisplay = document.getElementById("final-score");
const finalLevelDisplay = document.getElementById("final-level");
const highScoreList = document.getElementById("high-score-list");
const playAgainBtn = document.getElementById("play-again-btn");

document.addEventListener("DOMContentLoaded", () => {
  // --- Helper Functions ---
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function showModal(modalElement) {
    modalElement.classList.remove("hidden");
  }

  function hideModal(modalElement) {
    modalElement.classList.add("hidden");
  }

  function clearAllTimers() {
    clearInterval(levelTimerId);
    clearInterval(balloonSpawnIntervalId);
    clearTimeout(comboTimerId);
  }

  /**
   * Triggers a vibration pattern on devices that support the Haptic Feedback API.
   * @param {number|number[]} pattern - A duration in milliseconds, or an array of [on, off, on, off] durations.
   */
  function triggerVibration(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // --- Game Logic ---

  /**
   * Initializes the game on page load.
   * Shows rules modal, attaches event listeners.
   */
  function init() {
    score = 0;
    level = 0;
    balloonsMissed = 0; // Reset missed balloons
    gameRunning = false;
    gamePaused = false;
    scoreMultiplier = 1;
    currentCombo = 0;
    lastPopTime = 0;
    activeBalloons.forEach((balloon) => balloon.remove()); // Remove any lingering balloons
    activeBalloons = [];
    clearAllTimers();

    updateScoreDisplay();
    updateLevelDisplay();
    hideModal(gameOverModal); // Ensure game over modal is hidden
    showModal(rulesModal); // Show rules modal first

    loadHighScores(); // Load and display high scores
  }

  /**
   * Starts the game, hides rules modal, and begins the first level.
   */
  function startGame() {
    // Initialize AudioContext on first user interaction
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      loadSound("pop_sound", "assets/audio/pop.mp3");
      loadSound("game_over", "assets/audio/game_over.mp3");
      loadSound("boost", "assets/audio/boost.mp3");
      loadSound("error", "assets/audio/error.mp3");
    }

    hideModal(rulesModal);
    gameRunning = true;
    level = 0; // Start at level 1 (index 0)
    startLevel();
  }

  function loadSound(name, url) {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        soundLibrary[name] = audioBuffer;
      })
      .catch((e) => console.error("Error loading sound:", e));
  }

  function playSound(name) {
    if (!audioContext || !soundLibrary[name]) return;
    const source = audioContext.createBufferSource();
    source.buffer = soundLibrary[name];
    source.connect(audioContext.destination);
    source.start(0);
  }

  /**
   * Sets up and starts a new level.
   */
  function startLevel() {
    if (level >= LEVELS.length) {
      // Player completed all predefined levels
      gameOver();
      return;
    }

    const currentLevelConfig = LEVELS[level];
    balloonsMissed = 0; // Reset missed count for the new level
    updateLevelDisplay();
    showGameMessage("congrats", `Level ${level + 1} - Go!`);

    // Start continuously spawning balloons for the duration of the level
    const spawnInterval = getRandomInt(
      currentLevelConfig.minSpawnInterval,
      currentLevelConfig.maxSpawnInterval
    );
    balloonSpawnIntervalId = setInterval(() => {
      if (!gamePaused) {
        // Only spawn if game is not paused
        createBalloon(currentLevelConfig);
      }
    }, spawnInterval);

    // Set level duration timer
    levelTimerId = setTimeout(() => {
      if (gameRunning) {
        // Ensure game is still running before ending level
        endLevel();
      }
    }, GAME_DURATION_PER_LEVEL);
  }

  /**
   * Ends the current level and determines next action (next level or game over).
   */
  function endLevel() {
    clearAllTimers(); // Stop spawning and level timer

    const currentLevelConfig = LEVELS[level];
    if (score >= currentLevelConfig.scoreThreshold) {
      level++; // Advance to next level
      showGameMessage("congrats", `Awesome! Level ${level + 1} Unlocked!`);
      // Brief delay before starting next level
      setTimeout(startLevel, 1000);
    } else {
      // Not enough score to advance or time ran out and threshold not met
      showGameMessage("warning", "Time's Up!");
      setTimeout(gameOver, MESSAGE_DISPLAY_TIME_MS); // Show message then game over
    }
  }

  /**
   * Ends the game, shows final score and high score board.
   */
  function gameOver() {
    gameRunning = false;
    clearAllTimers();
    activeBalloons.forEach((balloon) => balloon.remove()); // Clear all balloons
    activeBalloons = [];

    finalScoreDisplay.textContent = score;
    finalLevelDisplay.textContent = level + 1; // Display 1-indexed level
    playSound("game_over");
    updateHighScores(score); // Save current score and display high scores
    showModal(gameOverModal);
  }

  /**
   * Resets game and starts again from the beginning.
   */
  function playAgain() {
    hideModal(gameOverModal);
    init(); // Re-initialize game state and show rules modal
  }

  /**
   * Creates a new balloon DOM element and adds it to the game area.
   * @param {object} levelConfig - The current level's configuration.
   */
  function createBalloon(levelConfig) {
    const balloonEl = document.createElement("div");
    balloonEl.classList.add("balloon");

    // Randomly choose balloon type
    const typeIndex = getRandomInt(0, BALLOON_TYPES.length - 1);
    const balloonType = BALLOON_TYPES[typeIndex];
    balloonEl.classList.add(balloonType.color); // Add color class

    // Add text if specified (e.g., 'X', '$$$')
    if (balloonType.text) {
      const textSpan = document.createElement("span");
      textSpan.textContent = balloonType.text;
      balloonEl.appendChild(textSpan);
    }

    // Apply movement animation
    let animationDuration = levelConfig.baseSpeed / balloonType.speedMultiplier;
    let animationName = "rise";
    const patternTypes = ["zig-zag", "sway"]; // Define available patterns

    // Add patterned movement chance
    if (Math.random() < levelConfig.patternChance) {
      animationName = patternTypes[getRandomInt(0, patternTypes.length - 1)];
      // Patterned movements might need longer duration to look good
      animationDuration *= 1.5; // Longer duration for full pattern
    }

    balloonEl.style.animation = `${animationName} ${animationDuration}s linear forwards`;

    let balloonWidthPx;
    if (window.innerWidth <= 480) {
      balloonWidthPx = 50;
    } else if (window.innerWidth <= 768) {
      balloonWidthPx = 60;
    } else {
      balloonWidthPx = 80;
    }

    const gameAreaWidthPx = gameArea.clientWidth;
    const horizontalPaddingPx = 10;

    const minLeftPx = horizontalPaddingPx;
    const maxLeftPx = gameAreaWidthPx - balloonWidthPx - horizontalPaddingPx;

    // Prevent negative maxLeftPx (if the game area is very narrow)
    const safeMaxLeftPx = Math.max(minLeftPx, maxLeftPx);

    // Random left in pixels (clamped safely)
    const randomLeftPx = getRandomInt(minLeftPx, safeMaxLeftPx);

    balloonEl.style.left = `${randomLeftPx}px`;

    // Add event listeners
    balloonEl.addEventListener("click", popBalloon);
    // Remove balloon if it goes off screen (animation ends)
    balloonEl.addEventListener("animationend", (event) => {
      // Only consider an 'animationend' for the *movement* animation as a "miss"
      if (
        (event.animationName.startsWith("rise") ||
          event.animationName === "zig-zag" ||
          event.animationName === "sway") &&
        !balloonEl.classList.contains("popped")
      ) {
        // Ensure it wasn't popped
        removeBalloon(balloonEl, true); // Mark as missed if it reached the top
      }
    });

    gameArea.appendChild(balloonEl);
    activeBalloons.push(balloonEl);
    balloonEl.dataset.type = JSON.stringify(balloonType); // Store type data
  }

  /**
   * Handles balloon popping when clicked.
   * @param {Event} event - The click event.
   */
  function popBalloon(event) {
    if (gamePaused || !gameRunning) return;

    const balloonEl = event.currentTarget; // The .balloon div
    // Prevent multiple pops on the same balloon and ensure it's not already exploding
    if (balloonEl.classList.contains("popped")) return;

    const balloonType = JSON.parse(balloonEl.dataset.type);

    balloonEl.removeEventListener("click", popBalloon); // Remove click listener

    // --- FIX: Stop the current movement animation before adding the explode class ---
    balloonEl.style.animation = "none"; // Clear any ongoing animation
    balloonEl.classList.add("popped"); // Trigger explosion animation

    playSound("pop_sound");

    // --- HAPTIC FEEDBACK: VIBRATE THE DEVICE ---
    if (balloonType.type === "negative") {
      triggerVibration([100, 50, 100]); // Longer, more jarring vibration for negative hit
    } else if (balloonType.type === "super") {
      triggerVibration([70, 30, 70]); // Quick double pulse for super balloon
    } else if (
      balloonType.effect === "freeze" ||
      balloonType.effect === "combo"
    ) {
      triggerVibration(150); // Slightly longer for special effects
    } else {
      triggerVibration(50); // Default short vibration for a pop
    }
    // --- END HAPTIC FEEDBACK ---

    // Update score
    let pointsEarned = balloonType.points;
    if (scoreMultiplier > 1 && pointsEarned > 0) {
      pointsEarned *= scoreMultiplier;
      showGameMessage(
        "congrats",
        `x${scoreMultiplier} COMBO! +${pointsEarned} points!`
      );
      playSound("boost");
    } else if (balloonType.type === "negative") {
      playSound("error");
      showGameMessage("warning", "Oh no! Disaster!");
    } else if (balloonType.type === "super") {
      playSound("boost");
      showGameMessage("congrats", "Super Pop!");
    }

    updateScoreDisplay(pointsEarned);

    // Handle combo scoring
    const currentTime = Date.now();
    if (currentTime - lastPopTime <= COMBO_THRESHOLD_MS) {
      currentCombo++;
      // Optional: increase multiplier or bonus points for longer combos
      if (currentCombo >= 3 && currentCombo % 2 === 1) {
        // Every 2 additional pops after 3
        showGameMessage("congrats", `Combo x${currentCombo}!`);
      }
    } else {
      currentCombo = 1; // Reset combo if too slow
    }
    lastPopTime = currentTime;

    // Reset combo timer (if no pop within threshold, combo breaks)
    clearTimeout(comboTimerId);
    comboTimerId = setTimeout(() => {
      currentCombo = 0;
      scoreMultiplier = 1; // Reset multiplier when combo breaks
    }, COMBO_THRESHOLD_MS);

    // Handle special effects
    if (balloonType.effect === "freeze") {
      applyFreezeEffect();
      showGameMessage("congrats", "Balloons Frozen!");
    } else if (balloonType.effect === "combo") {
      scoreMultiplier = 2; // Example: double score for a short period
      showGameMessage("congrats", "Score Multiplier Activated!");
      // Reset multiplier after a short time if no further combos
      clearTimeout(comboTimerId); // Clear existing combo reset
      comboTimerId = setTimeout(() => {
        scoreMultiplier = 1;
        currentCombo = 0;
        showGameMessage("warning", "Multiplier Expired!");
      }, COMBO_THRESHOLD_MS * 3); // Multiplier lasts longer
    }

    checkLevelCompletion(); // Level completion is now purely score-based or timer-based

    // Remove balloon after explosion animation completes
    // Listen specifically for the 'explode' animation ending
    balloonEl.addEventListener(
      "animationend",
      (event) => {
        if (event.animationName === "explode") {
          removeBalloon(balloonEl, false); // Not missed, was popped
        }
      },
      { once: true }
    ); // Use { once: true } to remove the listener after it fires
  }

  /**
   * Removes a balloon from the DOM and activeBalloons array.
   * Increments missed count if applicable.
   * @param {HTMLElement} balloonEl - The balloon element to remove.
   * @param {boolean} missed - True if the balloon was missed, false if popped.
   */
  function removeBalloon(balloonEl, missed) {
    // Ensure the balloon is still in the active list and not already removed
    const index = activeBalloons.indexOf(balloonEl);
    if (index > -1) {
      if (missed) {
        balloonsMissed++;
        checkGameOverCondition(); // Check for game over after each miss
      }
      activeBalloons.splice(index, 1); // Remove from array
      balloonEl.remove(); // Remove from DOM
    }
  }

  /**
   * Updates the score display.
   * @param {number} points - Points to add/subtract.
   */
  function updateScoreDisplay(points = 0) {
    score += points;
    scoreDisplay.textContent = score;
  }

  /**
   * Updates the level display.
   */
  function updateLevelDisplay() {
    levelDisplay.textContent = level + 1;
  }

  /**
   * Displays a temporary game message (e.g., "Bravo!", "Oh no!").
   * @param {string} type - 'congrats' or 'warning' for styling.
   * @param {string} message - The text message to display.
   */
  function showGameMessage(type, message) {
    const messageEl = document.createElement("div");
    messageEl.classList.add("game-message", type);
    messageEl.textContent = message;
    gameMessages.appendChild(messageEl);

    // Remove the message after animation completes
    messageEl.addEventListener(
      "animationend",
      () => {
        messageEl.remove();
      },
      { once: true }
    );
  }

  /**
   * Checks if the game over condition (too many missed balloons) is met for the current level.
   */
  function checkGameOverCondition() {
    if (balloonsMissed >= LEVELS[level].maxMissedBalloons) {
      showGameMessage("warning", "Game Over!");
      gameOver(); // Trigger game over
    }
  }

  /**
   * Checks if the level completion score threshold has been met.
   */
  function checkLevelCompletion() {
    // Only advance if game is still running and this is not the last level
    if (
      gameRunning &&
      level < LEVELS.length - 1 &&
      score >= LEVELS[level].scoreThreshold
    ) {
      endLevel(); // End level early if score threshold is reached
    }
  }

  /**
   * Applies the freeze effect by pausing all balloon animations.
   */
  function applyFreezeEffect() {
    gamePaused = true;
    activeBalloons.forEach((balloon) => {
      // Check if the balloon is not already exploding, to avoid conflicts
      if (!balloon.classList.contains("popped")) {
        balloon.style.animationPlayState = "paused";
      }
    });

    setTimeout(() => {
      gamePaused = false;
      activeBalloons.forEach((balloon) => {
        if (!balloon.classList.contains("popped")) {
          balloon.style.animationPlayState = "running";
        }
      });
      showGameMessage("congrats", "Balloons Resumed!");
    }, FREEZE_DURATION_MS);
  }

  // --- High Score Logic ---
  function loadHighScores() {
    const scores = JSON.parse(
      localStorage.getItem("balloonPopHighScores") || "[]"
    );
    scores.sort((a, b) => b.score - a.score); // Sort descending
    displayHighScores(scores);
    return scores;
  }

  function updateHighScores(newScore) {
    const scores = loadHighScores(); // Load current scores
    const currentDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    scores.push({ score: newScore, level: level + 1, date: currentDate });
    scores.sort((a, b) => b.score - a.score); // Sort descending
    localStorage.setItem(
      "balloonPopHighScores",
      JSON.stringify(scores.slice(0, 5))
    ); // Keep top 5
    displayHighScores(scores.slice(0, 5)); // Display updated top 5
  }

  function displayHighScores(scores) {
    highScoreList.innerHTML = ""; // Clear previous list
    if (scores.length === 0) {
      highScoreList.innerHTML = "<li>No high scores yet!</li>";
      return;
    }
    scores.forEach((s, index) => {
      const li = document.createElement("li");
      li.textContent = `#${index + 1}: Score ${s.score} | Level ${s.level} (${
        s.date
      })`;
      highScoreList.appendChild(li);
    });
  }

  // --- Accessibility (Keyboard Popping) ---
  function handleKeyboardPop(event) {
    if (!gameRunning || gamePaused || event.repeat) return; // Prevent continuous popping on hold

    if (event.code === "Space") {
      event.preventDefault(); // Prevent page scrolling
      if (activeBalloons.length > 0) {
        // Pop the lowest visible balloon for a more controlled experience
        // Filter out balloons that are already exploding
        const clickableBalloons = activeBalloons.filter(
          (b) => !b.classList.contains("popped")
        );
        if (clickableBalloons.length > 0) {
          const lowestBalloon = clickableBalloons.reduce((prev, curr) => {
            const prevRect = prev.getBoundingClientRect();
            const currRect = curr.getBoundingClientRect();
            // Compare 'bottom' positions, higher value means lower on screen
            return prevRect.bottom > currRect.bottom ? prev : curr;
          }, clickableBalloons[0]);

          if (lowestBalloon) {
            lowestBalloon.click(); // Programmatically click the balloon
          }
        }
      }
    }
  }

  // --- Event Listeners ---
  startGameBtn.addEventListener("click", startGame);
  playAgainBtn.addEventListener("click", playAgain);
  document.addEventListener("keydown", handleKeyboardPop); // Keyboard popping

  // --- Initial Game Setup ---
  init();
});

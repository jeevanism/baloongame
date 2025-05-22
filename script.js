// --- Game State Variables ---
let score = 0;
let lives = 3;
let highScore = 0;
let balloons = []; // Array to hold all active Balloon objects
let gameActive = false; // Is the game currently running?
let gameAnimationFrameId; // Stores the ID for requestAnimationFrame
let spawnInterval = 1500; // How often new balloons appear (ms)
let minSpawnInterval = 500; // Fastest spawn rate
let maxBalloonSpeed = 2; // Max speed for balloons
let currentBalloonId = 0; // Unique ID for each balloon

// Combo System
let comboCount = 0;
let lastPopTime = 0; // Timestamp of the last successful pop
const COMBO_RESET_TIME = 700; // ms to reset combo if no pop

// Multiplier Power-up
let scoreMultiplier = 1;
let multiplierTimeout; // Stores the timeout ID for resetting multiplier

// --- DOM Elements ---
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const highScoreDisplay = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// --- Audio Elements (PLACEHOLDERS: You need to provide these .mp3 files!) ---
// Create a 'sounds' folder in your project and put your audio files there.
const popSound = new Audio('sounds/pop.mp3'); 
popSound.volume = 0.5;
const comboSound = new Audio('sounds/combo.mp3'); 
comboSound.volume = 0.7;
const bombSound = new Audio('sounds/bomb.mp3'); 
bombSound.volume = 0.8;
const gameOverSound = new Audio('sounds/game-over.mp3'); 
gameOverSound.volume = 0.6;
const multiplierSound = new Audio('sounds/powerup.mp3'); // A generic power-up sound
multiplierSound.volume = 0.7;
// const bgMusic = document.getElementById('bg-music'); // Uncomment if you add background music
// if (bgMusic) bgMusic.volume = 0.3; // Adjust volume

// --- Game Configuration for different balloon types ---
const balloonTypes = {
    standard: {
        points: 10,
        health: 1,
        color: '#ff6b6b', // Red
        className: 'standard',
        speedMin: 1,
        speedMax: 2,
        spawnWeight: 0.6 // 60% chance to spawn
    },
    armored: {
        points: 30,
        health: 3, // Requires 3 hits
        color: '#6b6bff', // Blue
        className: 'armored',
        speedMin: 0.8,
        speedMax: 1.5,
        spawnWeight: 0.2 // 20% chance
    },
    bomb: {
        points: -50, // Negative points!
        health: 1,
        color: '#333333', // Dark Grey
        className: 'bomb',
        speedMin: 1.5,
        speedMax: 2.5,
        spawnWeight: 0.1 // 10% chance
    },
    multiplier: {
        points: 0, // No direct points, but activates multiplier
        health: 1,
        color: '#ffc107', // Gold
        className: 'multiplier',
        speedMin: 1.2,
        speedMax: 2.2,
        spawnWeight: 0.1, // 10% chance
        duration: 8000 // Multiplier lasts for 8 seconds
    }
};

// --- Balloon Class ---
class Balloon {
    constructor(typeConfig) {
        this.id = 'balloon-' + currentBalloonId++;
        this.type = typeConfig;
        // Random X position, ensuring balloon stays within bounds
        this.x = Math.random() * (gameContainer.clientWidth - 70) + 10; 
        this.y = gameContainer.clientHeight + 50; // Start below screen
        this.speed = Math.random() * (typeConfig.speedMax - typeConfig.speedMin) + typeConfig.speedMin;
        this.health = typeConfig.health;
        this.element = this.createDiv();
        gameContainer.appendChild(this.element);
    }

    createDiv() {
        const div = document.createElement('div');
        div.id = this.id;
        div.className = `balloon ${this.type.className}`;
        div.style.left = `${this.x}px`;
        div.style.top = `${this.y}px`;
        // Background color is handled by CSS classes for better styling flexibility
        return div;
    }

    // Moves the balloon up the screen
    updatePosition() {
        this.y -= this.speed;
        this.element.style.top = `${this.y}px`;

        if (this.y < -50) { // Balloon went off screen at top
            this.destroy(); // Remove from DOM and array
            // Only lose a life if it's a standard or armored balloon (not bomb/multiplier)
            if (this.type.className !== 'bomb' && this.type.className !== 'multiplier') {
                loseLife();
            }
            return true; // Indicates balloon is gone
        }
        return false; // Indicates balloon is still active
    }

    // Handles a click/hit on the balloon
    hit() {
        this.health--;
        if (this.health <= 0) {
            this.pop();
        } else {
            // Visual feedback for armored balloon hit (e.g., flash, slightly smaller)
            if (this.type.className === 'armored') {
                this.element.style.transform = 'scale(0.95)'; // Slight wiggle
                setTimeout(() => this.element.style.transform = 'scale(1)', 100);
            }
            // Play a soft pop sound for hits that don't pop it
            popSound.currentTime = 0;
            popSound.play();
        }
    }

    // Handles the balloon popping
    pop(isBombPop = false) { // isBombPop helps prevent infinite loops for bomb explosions
        // Update score with multiplier
        score += this.type.points * scoreMultiplier;
        updateScore();
        
        popSound.currentTime = 0;
        popSound.play();

        // Combo logic
        const currentTime = performance.now();
        if (currentTime - lastPopTime < COMBO_RESET_TIME) {
            comboCount++;
            if (comboCount > 1 && comboCount % 5 === 0) { // Bonus every 5 combo
                score += (comboCount * 10);
                comboSound.currentTime = 0;
                comboSound.play();
                showComboFeedback(comboCount);
            }
        } else {
            comboCount = 1; // Reset combo if too much time passed
        }
        lastPopTime = currentTime;

        // Add 'popped' class to trigger CSS animation
        this.element.classList.add('popped'); 
        
        // Specific balloon pop effects
        if (this.type.className === 'bomb' && !isBombPop) {
            bombSound.currentTime = 0;
            bombSound.play();
            this.explode(); // Trigger explosion
        } else if (this.type.className === 'multiplier') {
            multiplierSound.currentTime = 0;
            multiplierSound.play();
            activateMultiplier(); // Activate multiplier power-up
        }

        // Remove balloon from DOM after its pop animation completes
        setTimeout(() => this.destroy(), 300);
    }

    // Bomb explosion effect
    explode() {
        const radius = 120; // Radius for explosion effect (in pixels)
        balloons.forEach(otherBalloon => {
            // Don't pop the bomb itself, and don't pop already popped balloons
            if (otherBalloon.id !== this.id && !otherBalloon.element.classList.contains('popped')) {
                const dx = this.x - otherBalloon.x;
                const dy = this.y - otherBalloon.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < radius) {
                    otherBalloon.pop(true); // Pop adjacent balloons (pass true to avoid chaining bomb explosions)
                }
            }
        });
    }

    // Removes balloon element from DOM and from the balloons array
    destroy() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        balloons = balloons.filter(b => b.id !== this.id);
    }
}

// --- Game Control Functions ---

function startGame() {
    // Reset game state
    score = 0;
    lives = 3;
    balloons.forEach(b => b.destroy()); // Clear any existing balloons
    balloons = [];
    currentBalloonId = 0;
    comboCount = 0;
    lastPopTime = 0;
    scoreMultiplier = 1;
    clearTimeout(multiplierTimeout); // Ensure no pending multiplier timeouts
    spawnInterval = 1500; // Reset spawn rate
    maxBalloonSpeed = 2; // Reset max speed

    updateScore();
    updateLives();
    loadHighScore(); // Load high score once at start

    // Hide start/game over screens, show game container
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    gameContainer.classList.remove('game-over'); // Remove game-over visual state

    gameActive = true;
    // if (bgMusic) bgMusic.play(); // Uncomment to play background music

    gameLoop(); // Start the main game loop
    startBalloonSpawning(); // Start spawning balloons
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(gameAnimationFrameId); // Stop game loop
    clearInterval(spawnIntervalId); // Stop balloon spawning
    clearTimeout(multiplierTimeout); // Clear multiplier if active

    gameOverSound.currentTime = 0;
    gameOverSound.play();
    // if (bgMusic) bgMusic.pause(); // Uncomment to pause background music

    finalScoreDisplay.textContent = `You scored: ${score} points!`;
    gameOverScreen.classList.add('active'); // Show game over screen
    gameContainer.classList.add('game-over'); // Add game-over visual filter

    // Update and save high score
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        highScoreDisplay.textContent = `High Score: ${highScore} (NEW!)`;
    }
}

function updateScore() {
    scoreDisplay.textContent = `Score: ${score} ${scoreMultiplier > 1 ? ' (x' + scoreMultiplier + ')' : ''}`;
}

function updateLives() {
    livesDisplay.textContent = `Lives: ${lives}`;
    if (lives <= 0) {
        gameOver();
    }
}

function loadHighScore() {
    const storedHighScore = localStorage.getItem('balloonPopperHighScore');
    if (storedHighScore) {
        highScore = parseInt(storedHighScore);
    }
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

function saveHighScore() {
    localStorage.setItem('balloonPopperHighScore', highScore);
}

function loseLife() {
    lives--;
    updateLives();
    // Optional: add a subtle visual shake or flash to the lives display
}

let spawnIntervalId; // Variable to hold the interval ID for clearing
function startBalloonSpawning() {
    clearInterval(spawnIntervalId); // Clear any existing interval to prevent duplicates
    spawnIntervalId = setInterval(spawnRandomBalloon, spawnInterval);
}

function spawnRandomBalloon() {
    if (!gameActive) return;

    // Calculate total weight for random selection
    const totalWeight = Object.values(balloonTypes).reduce((sum, type) => sum + type.spawnWeight, 0);
    let randomWeight = Math.random() * totalWeight;

    let selectedType = null;
    // Iterate through types to find which one to spawn based on weight
    for (const typeKey in balloonTypes) {
        const typeConfig = balloonTypes[typeKey];
        if (randomWeight < typeConfig.spawnWeight) {
            selectedType = typeConfig;
            break;
        }
        randomWeight -= typeConfig.spawnWeight;
    }
    // Fallback in case of floating point errors or if no type selected
    if (!selectedType) {
        selectedType = balloonTypes.standard;
    }

    const newBalloon = new Balloon(selectedType);
    balloons.push(newBalloon);

    // --- Dynamic Difficulty Progression ---
    // Increase difficulty every 200 points (you can adjust this threshold)
    if (score % 200 === 0 && score > 0) {
        if (spawnInterval > minSpawnInterval) {
            spawnInterval -= 50; // Decrease spawn interval (spawn faster)
            startBalloonSpawning(); // Restart interval with new speed
        }
        if (maxBalloonSpeed < 5) { // Cap maximum balloon speed
            maxBalloonSpeed += 0.1; // Increase balloon maximum speed
        }
    }
}

// Main game loop using requestAnimationFrame for smooth animation
function gameLoop() {
    if (!gameActive) {
        return;
    }

    // Update positions of all balloons
    for (let i = balloons.length - 1; i >= 0; i--) {
        const balloon = balloons[i];
        const removed = balloon.updatePosition();
        // If a balloon was removed (reached top), it's already filtered from the array by balloon.destroy()
    }

    gameAnimationFrameId = requestAnimationFrame(gameLoop);
}

// --- UI Feedback Functions ---

function showComboFeedback(count) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.classList.add('combo-feedback');
    feedbackDiv.textContent = `COMBO x${count}!`;
    gameContainer.appendChild(feedbackDiv);

    // Position feedback in the center of the game area
    feedbackDiv.style.left = `${(gameContainer.clientWidth / 2) - (feedbackDiv.clientWidth / 2)}px`; // Center horizontally
    feedbackDiv.style.top = `${gameContainer.clientHeight * 0.4}px`; // A bit above center vertically

    // Trigger CSS animation
    setTimeout(() => {
        feedbackDiv.classList.add('show');
    }, 10); // Small delay to ensure CSS transition takes effect

    // Remove feedback after animation
    setTimeout(() => {
        feedbackDiv.classList.remove('show');
        feedbackDiv.classList.add('hide'); // For fade out
        setTimeout(() => feedbackDiv.remove(), 1000); // Remove element after fade out animation
    }, 800); // Display for 0.8 seconds
}

function activateMultiplier() {
    scoreMultiplier = 2; // Doubles points
    updateScore(); // Update score display to show (x2)

    const multiplierMessage = document.createElement('div');
    multiplierMessage.classList.add('multiplier-message');
    multiplierMessage.textContent = '2X POINTS!';
    gameContainer.appendChild(multiplierMessage);

    // Position message near the top center
    multiplierMessage.style.left = `${(gameContainer.clientWidth / 2) - (multiplierMessage.clientWidth / 2)}px`;
    multiplierMessage.style.top = `10%`; 

    setTimeout(() => {
        multiplierMessage.classList.add('show');
    }, 10);

    // Clear any previous multiplier timeout to prevent overlaps
    clearTimeout(multiplierTimeout);
    multiplierTimeout = setTimeout(() => {
        scoreMultiplier = 1; // Reset multiplier
        updateScore();
        multiplierMessage.classList.remove('show');
        multiplierMessage.classList.add('hide');
        setTimeout(() => multiplierMessage.remove(), 1000);
    }, balloonTypes.multiplier.duration);
}

// --- Event Listeners ---
gameContainer.addEventListener('click', (event) => {
    if (!gameActive) return;

    const target = event.target;
    // Check if the clicked element is a balloon
    if (target.classList.contains('balloon')) {
        const balloonId = target.id;
        // Find the corresponding Balloon object in our array
        const balloon = balloons.find(b => b.id === balloonId);
        if (balloon) {
            balloon.hit(); // Call the hit method on the balloon
        }
    }
});

// Start button event listener
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// --- Initial Setup on Page Load ---
loadHighScore(); // Load high score when the page loads
// Optional: Add a pre-load for sounds if they are large files
// Promise.all([popSound.load(), comboSound.load(), bombSound.load(), gameOverSound.load(), multiplierSound.load()])
//    .then(() => console.log('Sounds loaded'));
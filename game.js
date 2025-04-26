// Refactored game.js with improvements: Config object, better clean-up, game states, smoother scaling

const GAME_SETTINGS = {
  maxBalloons: 100,
  balloonSpeedRange: [1, 2.5],
  columns: 4,
  popAnimationDuration: 550,
};

const gameContainer = document.getElementById("gameContainer");
const stopButton = document.getElementById("stopButton");
const startButton = document.getElementById("startButton");
const scoreDisplay = document.createElement("div");

let balloonPoppedCounter = 0;
let gameLoopInterval;

stopButton.style.display = "none";
scoreDisplay.id = "scoreDisplay";
scoreDisplay.style.color = "white";
scoreDisplay.style.textAlign = "center";
scoreDisplay.style.marginTop = "10px";
document.getElementById("gamescore").appendChild(scoreDisplay);

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${balloonPoppedCounter}`;
}

function toggleButtons(startVisible) {
  startButton.style.display = startVisible ? "block" : "none";
  stopButton.style.display = startVisible ? "none" : "block";
}

function startGame() {
  clearGame();
  balloonPoppedCounter = 0;
  updateScoreDisplay();
  toggleButtons(false);

  gameLoopInterval = setInterval(() => {
    if (balloonPoppedCounter < GAME_SETTINGS.maxBalloons) {
      createBalloon();
    } else {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(gameLoopInterval);
  clearGame();
  gameContainer.innerHTML = `Game Over - you popped ${balloonPoppedCounter} balloons!`;
  toggleButtons(true);
}

function clearGame() {
  gameContainer.innerHTML = "";
}

function createBalloon() {
  const balloon = document.createElement("div");
  balloon.className = "balloon";

  balloon.addEventListener("click", () => handleBalloonPop(balloon));

  const column = Math.floor(Math.random() * GAME_SETTINGS.columns);
  balloon.style.left = `${(column / GAME_SETTINGS.columns) * 100}%`;
  balloon.style.bottom = "0px";

  gameContainer.appendChild(balloon);
  animateBalloon(balloon);
}

function animateBalloon(balloon) {
  let y = 0;
  const maxY = gameContainer.offsetHeight;
  const speed = randomBetween(...GAME_SETTINGS.balloonSpeedRange);

  function move() {
    y += speed;
    if (y < maxY) {
      balloon.style.bottom = `${y}px`;
      requestAnimationFrame(move);
    } else {
      balloon.remove();
    }
  }

  requestAnimationFrame(move);
}

function handleBalloonPop(balloon) {
  animatePop(balloon);
  balloonPoppedCounter++;
  updateScoreDisplay();
  console.log(`You have popped ${balloonPoppedCounter} balloons`);
}

function animatePop(balloon) {
  balloon.style.animation = "none";
  balloon.classList.remove("balloon");
  balloon.classList.add("explode-balloon");
  balloon.innerHTML = "";

  setTimeout(() => {
    balloon.remove();
  }, GAME_SETTINGS.popAnimationDuration);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Event Listeners
startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", endGame);

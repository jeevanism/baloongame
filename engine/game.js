// Refactored game.js with Dynamic Spawn Speed

const GAME_SETTINGS = {
  maxMissedBalloons: 25,
  balloonSpeedRange: [1, 2.5],
  columns: 4,
  popAnimationDuration: 550,
};

let sirenSound;
let popSound;

document.addEventListener("DOMContentLoaded", (event) => {
  sirenSound = document.getElementById("sirenSound");
  popSound = document.getElementById("popSound");
});

const gameContainer = document.getElementById("gameContainer");
const stopButton = document.getElementById("stopButton");
const startButton = document.getElementById("startButton");
const scoreDisplay = document.createElement("div");

let balloonPoppedCounter = 0;
let missedBalloonsCounter = 0;
let gameLoopTimeout;

stopButton.style.display = "none";
scoreDisplay.id = "scoreDisplay";
scoreDisplay.style.color = "white";
scoreDisplay.style.textAlign = "center";
scoreDisplay.style.marginTop = "10px";
document.getElementById("gamescore").appendChild(scoreDisplay);

function updateScoreDisplay() {
  scoreDisplay.textContent = `Hit: ${balloonPoppedCounter} | Missed: ${missedBalloonsCounter}`;

  const gamescore = document.getElementById("gamescore");

  if (missedBalloonsCounter >= 5) {
    gamescore.classList.add("warning");
    if (sirenSound.paused) {
      sirenSound.loop = true; // keep looping while flashing
      sirenSound.play();
    }
  } else {
    gamescore.classList.remove("warning");
    if (!sirenSound.paused) {
      sirenSound.pause();
      sirenSound.currentTime = 0;
    }
  }
}

function getSpawnInterval() {
  if (balloonPoppedCounter >= 100) {
    return 200; // Very fast spawning
  } else if (balloonPoppedCounter >= 65) {
    return 300; // Faster spawning
  } else if (balloonPoppedCounter >= 25) {
    return 400; // Fast spawning (existing)
  } else if (balloonPoppedCounter >= 15) {
    return 500; // Moderately fast spawning
  } else if (balloonPoppedCounter >= 5) {
    return 600; // Slower spawning (existing)
  } else {
    return 1000; // Default slowest spawning (for balloonPoppedCounter < 5)
  }
}

function toggleButtons(startVisible) {
  startButton.style.display = startVisible ? "block" : "none";
  stopButton.style.display = startVisible ? "none" : "block";
}

function startGame() {
  clearGame();
  balloonPoppedCounter = 0;
  missedBalloonsCounter = 0;
  updateScoreDisplay();
  toggleButtons(false);
  spawnBalloonLoop();
}

function spawnBalloonLoop() {
  createBalloon();
  const nextSpawnTime = getSpawnInterval();
  gameLoopTimeout = setTimeout(spawnBalloonLoop, nextSpawnTime);
}

function endGame() {
  if (!sirenSound.paused) {
    sirenSound.pause();
    sirenSound.currentTime = 0;
  }
  clearTimeout(gameLoopTimeout);
  clearGame();
  const gamescore = document.getElementById("gamescore");
  gamescore.classList.remove("warning");
  showGameOverModal();
  toggleButtons(true);
}

function showGameOverModal() {
  const modal = document.getElementById("gameOverModal");
  const finalScore = document.getElementById("finalScore");
  finalScore.textContent = `You popped ${balloonPoppedCounter} balloons!`;
  modal.style.display = "block";
}

const closeModalButton = document.getElementById("closeModalButton");
closeModalButton.addEventListener("click", () => {
  document.getElementById("gameOverModal").style.display = "none";
});

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
  const balloonHeight = parseInt(getComputedStyle(balloon).height);

  const speed = randomBetween(...GAME_SETTINGS.balloonSpeedRange);

  function move() {
    y += speed;
    balloon.style.bottom = `${y}px`;

    const balloonTop = y + balloonHeight;
    const gameContainerHeight = gameContainer.offsetHeight;

    if (balloonTop >= gameContainerHeight) {
      if (gameContainer.contains(balloon)) {
        balloon.remove();
        missedBalloonsCounter++;
        updateScoreDisplay();
        if (missedBalloonsCounter >= GAME_SETTINGS.maxMissedBalloons) {
          endGame();
        }
      }
    } else {
      requestAnimationFrame(move);
    }
  }

  requestAnimationFrame(move);
}

function handleBalloonPop(balloon) {
  animatePop(balloon);

  if (popSound.paused) {
    popSound.loop = false;
    popSound.play();
  }
  if ("vibrate" in navigator) {
    const didVibrate = navigator.vibrate(200);
    console.log("Vibration API supported, vibrate() returned →", didVibrate);
    if (!didVibrate) {
      console.warn("vibrate() was called but the pattern was rejected");
    }
  } else {
    console.log("Vibration API not supported on this device/browser");
  }

  balloonPoppedCounter++;
  updateScoreDisplay();
  console.log(`You have popped ${balloonPoppedCounter} balloons`);
  if (balloonPoppedCounter === 5 || balloonPoppedCounter === 15) {
    showLevelUpMessage();
    console.log(`Level upgraded`);
  }
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

function showLevelUpMessage() {
  const levelUpMessage = document.getElementById("levelUpMessage");
  levelUpMessage.style.display = "block";

  setTimeout(() => {
    levelUpMessage.style.display = "none";
  }, 1000); // Hide after 1 second
}

// Event Listeners
startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", endGame);

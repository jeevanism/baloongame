const gameContainer = document.getElementById("gameContainer");
const stopButton = document.getElementById("stopButton");
const startButton = document.getElementById("startButton");

stopButton.style.display = "none";

let balloonPoppedCounter = 0;
let balloonInterval = 1000;
let gameLoopInterval;

const scoreDisplay = document.createElement("div");
scoreDisplay.id = "scoreDisplay";
scoreDisplay.style.color = "white";
scoreDisplay.style.textAlign = "center";
scoreDisplay.style.marginTop = "10px";
document.getElementById("gamescore").appendChild(scoreDisplay);

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${balloonPoppedCounter}`;
}

startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", stopGame);

function startGame() {
  gameContainer.innerHTML = '';
  startButton.style.display = "none";
  stopButton.style.display = "block";
  balloonPoppedCounter = 0;
  updateScoreDisplay();

  gameLoopInterval = setInterval(() => {
    if (balloonPoppedCounter < 100) {
      createBalloon();
    } else {
      stopGame();
    }
  }, balloonInterval);
}

function stopGame() {
  startButton.style.display = "block";
  stopButton.style.display = "none";
  clearInterval(gameLoopInterval);
  gameContainer.innerHTML = `Game Over - you popped ${balloonPoppedCounter} balloons!`;
  balloonPoppedCounter = 0;
  updateScoreDisplay();
}

function createBalloon() {
  const balloon = document.createElement("div");
  balloon.className = "balloon";

  balloon.addEventListener("click", () => {
    popBalloon(balloon);
    balloonPoppedCounter++;
    updateScoreDisplay();
    console.log('You have popped ' + balloonPoppedCounter);
  });

  const column = Math.floor(Math.random() * 4);
  const leftPosition = (column / 4) * 100 + "%";
  balloon.style.left = leftPosition;
  balloon.style.bottom = "0px"; // Start from the bottom

  gameContainer.appendChild(balloon);
  animateBalloon(balloon);
}

function animateBalloon(balloon) {
  let y = 0;
  const maxY = gameContainer.offsetHeight;
  const speed = 1 + Math.random() * 1.5;

  function move() {
    y += speed;
    if (y < maxY) {
      balloon.style.bottom = y + "px";
      requestAnimationFrame(move);
    } else {
      if (gameContainer.contains(balloon)) {
        gameContainer.removeChild(balloon);
      }
    }
  }

  requestAnimationFrame(move);
}

function popBalloon(balloon) {
  balloon.style.animation = "none";
  balloon.innerHTML = "";
  balloon.classList.remove("balloon");
  balloon.classList.add("explode-balloon");

  setTimeout(() => {
    if (gameContainer.contains(balloon)) {
      gameContainer.removeChild(balloon);
    }
  }, 550);
}

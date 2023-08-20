const gameContainer = document.getElementById("gameContainer");
const stopButton = document.getElementById("stopButton");
const startButton = document.getElementById("startButton");
const speedUpButton = document.getElementById("speedUpButton");

stopButton.style.display = "none";

let interval;
let balloonInterval = 2000; // Initial interval duration (in milliseconds)

startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", stopGame);
speedUpButton.addEventListener("click", speedUpGame);

function startGame() {
  startButton.style.display = "none";
  stopButton.style.display = "block";
  createBalloon();
}

function stopGame() {
  startButton.style.display = "block";
  stopButton.style.display = "none";
  clearInterval(interval);
  gameContainer.innerHTML = " GAME OVER";
}

function speedUpGame() {
  // Reduce the balloon interval by a certain amount
  balloonInterval = Math.max(balloonInterval - 300, 100); // Minimum interval of 100ms
  console.log("Balloon interval:", balloonInterval, "ms");
}

function createBalloon() {
  const balloon = document.createElement("div");
  balloon.className = "balloon";
  let balloonCount = 0;
  interval = setInterval(() => {
    if (balloonCount < 100) {
      // Maximum balloons to prevent excessive generation
      balloonCount++;
      const balloon = document.createElement("div");

      balloon.className = "balloon";
      balloon.addEventListener("click", () => {
        popBalloon(balloon);
        console.log(balloon);
      });

      const column = Math.floor(Math.random() * 4); // Random column
      const leftPosition = (column / 4) * 100 + "%";
      balloon.style.left = leftPosition;
      gameContainer.appendChild(balloon);
    } else {
      clearInterval(interval);
    }
  }, 1000); // Generate a balloon every <prescribed> seconds

  balloon.addEventListener("animationend", () => {
    gameContainer.removeChild(balloon);
  });
}

function popBalloon(balloon) {
  balloon.style.animation = "none";
  balloon.innerHTML = "";
  balloon.classList.remove("balloon");
  balloon.classList.add("explode-balloon");

  setTimeout(() => {
    gameContainer.removeChild(balloon);
  }, 550);
}

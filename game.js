const gameContainer = document.getElementById("gameContainer");
const stopButton = document.getElementById("stopButton");
const startButton = document.getElementById("startButton");
// const speedUpButton = document.getElementById("speedUpButton");

stopButton.style.display = "none";
var baloonPoppedCounter = 0;

let interval;
let balloonInterval = 1000; // Initial interval duration (in milliseconds)
console.log("initial Balloon interval:", balloonInterval, "ms");

startButton.addEventListener("click", startGame);
stopButton.addEventListener("click", stopGame);
// speedUpButton.addEventListener("click", speedUpGame);

function startGame() {
  gameContainer.innerHTML = '';
  startButton.style.display = "none";
  stopButton.style.display = "block";
  createBalloon();
}

function stopGame() {
  startButton.style.display = "block";
  stopButton.style.display = "none";
  clearInterval(interval);
  gameContainer.innerHTML = `Game Over - you have popped ${baloonPoppedCounter} Baloons !`;
  baloonPoppedCounter = 0;
}

// function speedUpGame() {
//   // Reduce the balloon interval by a certain amount
//   balloonInterval = Math.max(balloonInterval - 500, 10); // Minimum interval of 10ms
//   console.log("Balloon interval:", balloonInterval, "ms");
// }

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
        baloonPoppedCounter = baloonPoppedCounter +1;
        console.log('you have popped ' + baloonPoppedCounter);
      });

      const column = Math.floor(Math.random() * 4); // Random column
      const leftPosition = (column / 4) * 100 + "%";
      balloon.style.left = leftPosition;
      gameContainer.appendChild(balloon);
    } else {
      clearInterval(interval);
    }
  }, balloonInterval); // Generate a balloon every <prescribed> seconds

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

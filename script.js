document.addEventListener("DOMContentLoaded", () => {
    const sky = document.querySelector(".sky");
    const scoreBoard = document.getElementById("score");
    const levelBoard = document.getElementById("level");
    const message = document.getElementById("message");
    const milestone = document.getElementById("milestone");
    const startScreen = document.getElementById("start-screen");
    const startBtn = document.getElementById("start-btn");
  
    let score = 0;
    let missed = 0;
    let gameActive = false;
    let waveIndex = 0;
    let waveInterval;
    let currentInterval = 3000;
  
    // Optional sound (uncomment if you add pop.mp3)
    // const popSound = new Audio("pop.mp3");
  
    let wavePattern = [];
    const shownMilestones = new Set();
  
    const milestoneMessages = {
      5: "Good work!",
      15: "Congrats!",
      35: "Keep going!",
      85: "Well done!"
    };
  
    const colors = [
      { base: "#e74c3c", knot: "#c0392b" },
      { base: "#3498db", knot: "#2980b9" },
      { base: "#8e44ad", knot: "#7d3c98" },
      { base: "#2ecc71", knot: "#27ae60" },
      { base: "#f1c40f", knot: "#d4ac0d" },
      { base: "#f1948a", knot: "#e74c3c" },
      { base: "#85c1e9", knot: "#3498db" },
      { base: "#bb8fce", knot: "#8e44ad" },
      { base: "#7fe5a0", knot: "#2ecc71" },
      { base: "#f7dc6f", knot: "#f1c40f" }
    ];
  
    function shufflePattern() {
      const basePattern = [1, 1, 2, 3, 2, 2];
      for (let i = basePattern.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [basePattern[i], basePattern[j]] = [basePattern[j], basePattern[i]];
      }
      return basePattern;
    }
  
    function showMilestone(text) {
      if (!milestone) return;
      milestone.textContent = text;
      milestone.style.display = "block";
      milestone.style.opacity = "1";
      milestone.classList.remove("fadeOut");
      void milestone.offsetWidth; // trigger reflow
      milestone.classList.add("fadeOut");
      setTimeout(() => {
        milestone.style.display = "none";
      }, 2000);
    }
  
    function createBalloon(index) {
      const balloonContainer = document.createElement("div");
      balloonContainer.className = "balloon-container";
  
      const balloon = document.createElement("div");
      balloon.className = "balloon";
  
      const balloonString = document.createElement("div");
      balloonString.className = "balloon-string";
  
      const colorIndex = Math.floor(index % colors.length);
      const selectedColor = colors[colorIndex];
      balloon.style.setProperty("--balloon-color", selectedColor.base);
      balloon.style.setProperty("--knot-color", selectedColor.knot);
  
      const randomLeft = Math.random() * 95;
      balloonContainer.style.left = `${randomLeft}%`;
      balloonContainer.style.animationDelay = `${Math.random()}s`;
      balloonContainer.style.animationDuration = `${Math.random() * 15 + 5}s`;
  
      balloonContainer.addEventListener("click", () => {
        if (!gameActive) return;
        score++;
        scoreBoard.textContent = `Score: ${score}`;
  
        // popSound.currentTime = 0;
        // popSound.play();
  
        balloon.classList.add("explode");
        setTimeout(() => balloonContainer.remove(), 300);
  
        if (milestoneMessages[score] && !shownMilestones.has(score)) {
          shownMilestones.add(score);
          showMilestone(milestoneMessages[score]);
        }
      });
  
      balloonContainer.addEventListener("animationend", () => {
        if (!gameActive) return;
        if (document.body.contains(balloonContainer)) {
          balloonContainer.remove();
          missed++;
          if (missed >= 60) {
            endGame(`❌ Game Over – You missed ${missed} balloons!`);
          }
        }
      });
  
      balloonContainer.appendChild(balloon);
      balloonContainer.appendChild(balloonString);
      sky.appendChild(balloonContainer);
    }
  
    function runWaveLoop() {
      if (!gameActive) return;
  
      const count = wavePattern[waveIndex];
      for (let i = 0; i < count; i++) {
        createBalloon(i);
      }
  
      waveIndex = (waveIndex + 1) % wavePattern.length;
  
      if (waveIndex === 0) {
        wavePattern = shufflePattern();
        if (currentInterval > 700) {
          currentInterval -= 50;
        }
      }
  
      clearTimeout(waveInterval);
      waveInterval = setTimeout(runWaveLoop, currentInterval);
    }
  
    function startGame() {
      score = 0;
      missed = 0;
      waveIndex = 0;
      currentInterval = 1500;
      gameActive = true;
      shownMilestones.clear();
      scoreBoard.textContent = "Score: 0";
      levelBoard.textContent = "Wave Mode";
      message.style.display = "none";
      startScreen.style.display = "none";
      sky.innerHTML = "";
      wavePattern = shufflePattern();
      runWaveLoop();
    }
  
    function endGame(text) {
      gameActive = false;
      clearTimeout(waveInterval);
      message.textContent = text;
      message.style.display = "block";
      startScreen.style.display = "flex";
      sky.innerHTML = "";
    }
  
    startBtn.addEventListener("click", startGame);
  });
  
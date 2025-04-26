//  no more in use .. only for canvas learning 

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const balloonImage = new Image();
balloonImage.src = "balloon.png";

let balloonX = canvas.width / 2 - 25;
let balloonY = canvas.height - 80;
let balloonScale = 1;
let explosionFrame = 0;
let isExploding = false;

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isExploding) {
    if (explosionFrame < 20) {
      balloonScale += 0.1;
      explosionFrame++;
      ctx.drawImage(
        balloonImage,
        balloonX,
        balloonY,
        50 * balloonScale,
        80 * balloonScale
      );
      requestAnimationFrame(animate);
    } else {
      // After explosion complete, clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    // Normal static balloon
    ctx.drawImage(balloonImage, balloonX, balloonY, 50, 80);
    requestAnimationFrame(animate);
  }
}

// Start the normal animation after balloon loads
balloonImage.onload = () => {
  animate();
};

// Add click listener to pop the balloon
canvas.addEventListener("click", () => {
  if (!isExploding) {
    isExploding = true;
    explosionFrame = 0;
    balloonScale = 1;
  }
});

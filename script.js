const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const balloonImage = new Image();
balloonImage.src = "balloon.png"; // Replace with your balloon image URL

let balloonX = canvas.width / 2 - 25;
let balloonY = canvas.height - 80;
let balloonScale = 1;
let explosionFrame = 0;

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (explosionFrame < 20) {
    // Expand balloon as part of explosion
    balloonScale += 0.1;
    explosionFrame++;
  }

  ctx.drawImage(
    balloonImage,
    balloonX,
    balloonY,
    50 * balloonScale,
    80 * balloonScale
  );

  requestAnimationFrame(animate);
}

balloonImage.onload = () => {
  animate();
};

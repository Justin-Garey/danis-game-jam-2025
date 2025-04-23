import './style.css'

// Create canvas and context
let canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;
canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;
const canvasColor = "black";
let context = canvas?.getContext("2d");
if (context) {
  context.fillStyle = canvasColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
}


// Update canvas size if screen size changes
// This prevents the dvd logo from being distorted
window.onresize = function () {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  if (context) {
    context.fillStyle = canvasColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function update() {
  if (context) {
    // Fill in canvas
    context.fillStyle = canvasColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
}

setInterval(update, 1000 / 120);
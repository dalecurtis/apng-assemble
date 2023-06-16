// From
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
function generateParticles(amount, width, height) {
  let particlesArray = [];
  for (let i = 0; i < amount; i++) {
    particlesArray[i] =
        new Particle(width / 2, height / 2, 4, generateColor(), 1);
  }
  return particlesArray;
}

function generateColor() {
  let hexSet = "0123456789ABCDEF";
  let finalHexString = "#";
  for (let i = 0; i < 6; i++) {
    finalHexString += hexSet[Math.ceil(Math.random() * 15)];
  }
  return finalHexString;
}

function Particle(x, y, particleTrailWidth, strokeColor, rotateSpeed) {
  this.width = x * 2;
  this.height = y * 2;
  this.x = x;
  this.y = y;
  this.particleTrailWidth = particleTrailWidth;
  this.strokeColor = strokeColor;
  this.theta = Math.random() * Math.PI * 2;
  this.rotateSpeed = rotateSpeed;
  this.t = Math.random() * 150;

  this.rotate = context => {
    const ls = {
      x : this.x,
      y : this.y,
    };
    this.theta += this.rotateSpeed;
    this.x = (this.width / 2) + Math.cos(this.theta) * this.t;
    this.y = (this.height / 2) + Math.sin(this.theta) * this.t;
    context.beginPath();
    context.lineWidth = this.particleTrailWidth;
    context.strokeStyle = this.strokeColor;
    context.moveTo(ls.x, ls.y);
    context.lineTo(this.x, this.y);
    context.stroke();
  };
}

function anim(canvas, context, particles) {
  context.fillStyle = "rgba(0,0,0)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => particle.rotate(context));
}

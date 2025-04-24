import './style.css'
import * as Matter from 'matter-js'

// const Engine = Matter.Engine;
// const World = Matter.World;
// const Bodies = Matter.Bodies;
// const Render = Matter.Render;
// const Runner = Matter.Runner;


// let canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;

// let engine, world, render, runner;
// let ground, ball;

// function init(){
//   engine = Engine.create();
//   world = engine.world;

//   render = Matter.Render.create({
//     canvas: canvas,
//     engine: engine,
//     options: {
//         width: 800,
//         height: 600,
//         showAngleIndicator: true
//     }
//   })
//   Render.run(render);

//   runner = Runner.create();
//   Runner.run(runner, engine);

//   ground = Bodies.rectangle(200, 390, 200, 20, {isStatic: true});
//   World.add(world, ground);

//   ball = Bodies.circle(200, 100, 20, {restitution: 1.0});
//   World.add(world, ground);
// }

// function draw(){
//   //background(0);
//   Engine.update(engine);
// }



// // // run the renderer
// // Matter.Render.run(render);

// // // create runner
// // let runner = Matter.Runner.create();

// // // run the engine
// // Matter.Runner.run(runner, engine);

// init();
// draw();


// // canvas.width = document.body.clientWidth;
// // canvas.height = document.body.clientHeight;

// // // Update canvas size if screen size changes
// // // Leaving this here for later use
// // window.onresize = function () {
// //   canvas.width = document.body.clientWidth;
// //   canvas.height = document.body.clientHeight;
// // }

let canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Composites = Matter.Composites,
  Events = Matter.Events,
  Constraint = Matter.Constraint,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse,
  Body = Matter.Body,
  Composite = Matter.Composite,
  Bodies = Matter.Bodies;

// create engine
var engine = Engine.create(),
  world = engine.world;

// create renderer
var render = Render.create({
  element: document.body,
  canvas: canvas,
  engine: engine,
  options: {
    width: canvas.width,
    height: canvas.height,
    showAngleIndicator: true,
    hasBounds: false
  }
});

Render.run(render);

// create runner
var runner = Runner.create();
Runner.run(runner, engine);

// add bodies
var ground = Bodies.rectangle(395, 600, 815, 50, { isStatic: true, render: { fillStyle: '#060a19' } }),
  rockOptions = { density: 0.004 },
  rock = Bodies.polygon(170, 450, 8, 20, rockOptions),
  anchor = { x: 170, y: 450 },
  elastic = Constraint.create({
    pointA: anchor,
    bodyB: rock,
    length: 0.01,
    damping: 0.01,
    stiffness: 0.05
  });

var pyramid = Composites.pyramid(500, 300, 9, 10, 0, 0, function (x, y) {
  return Bodies.rectangle(x, y, 25, 40);
});

var ground2 = Bodies.rectangle(610, 250, 200, 20, { isStatic: true, render: { fillStyle: '#060a19' } });

var pyramid2 = Composites.pyramid(550, 0, 5, 10, 0, 0, function (x, y) {
  return Bodies.rectangle(x, y, 25, 40);
});


var group = Body.nextGroup(true),
  length = 200,
  width = 25;

var pendulum = Composites.stack(350, 160, 1, 1, -20, 0, function (x, y) {
  return Bodies.rectangle(x, y, length, width, {
    collisionFilter: { group: group },
    frictionAir: 0,
    chamfer: 5,
    render: {
      fillStyle: 'transparent',
      lineWidth: 1
    }
  });
});

Composite.add(pendulum, Constraint.create({
  bodyB: pendulum.bodies[0],
  pointB: { x: -length * 0.42, y: 0 },
  pointA: { x: pendulum.bodies[0].position.x - length * 0.42, y: pendulum.bodies[0].position.y },
  stiffness: 0.9,
  length: 0,
  render: {
    strokeStyle: '#4a485b'
  }
}));

let paddle_right_group = Body.nextGroup(true);
let paddle_length = 100;
let paddle_width = 10;
let paddle_right = Composites.stack(400, 400, 1, 1, -20, 0, function (x, y) {
  return Bodies.rectangle(x, y, paddle_length, paddle_width, {
    collisionFilter: { group: paddle_right_group },
    frictionAir: 0,
    chamfer: 5,
    render: {
      fillStyle: 'transparent',
      lineWidth: 1
    }
  });
});
Composite.add(paddle_right, Constraint.create({
  bodyB: paddle_right.bodies[0],
  pointB: { x: -paddle_length * 0.42, y: 0 },
  pointA: { x: paddle_right.bodies[0].position.x - paddle_length * 0.42, y: paddle_right.bodies[0].position.y },
  stiffness: 0.9,
  length: 0,
  render: {
    strokeStyle: '#4a485b'
  }
}));

let board_center = canvas.width / 2;


const BOARD_WIDTH = 600;

let left_wall = Bodies.rectangle(board_center - (BOARD_WIDTH / 2), (canvas.height / 2), 1, canvas.height, {
  isStatic: true, 
  render: { 
      fillStyle: '#060a19' 
  }
})

let right_wall = Bodies.rectangle(board_center + (BOARD_WIDTH / 2), (canvas.height / 2), 1, canvas.height, {
  isStatic: true, 
  render: { 
      fillStyle: '#060a19' 
  }
})


Composite.add(engine.world, [ground, pyramid, ground2, pyramid2, rock, elastic, paddle_right, pendulum, left_wall, right_wall]);

// Create a keyHandlers
const keyHandlers = {
  Space: () => {
    Matter.Body.applyForce(paddle_right.bodies[0], {
      x: paddle_right.bodies[0].position.x,
      y: paddle_right.bodies[0].position.y
    }, { x: 0, y: -0.01 })
  },
  KeyA: () => {
    Matter.Body.applyForce(rock, {
      x: rock.position.x,
      y: rock.position.y
    }, { x: 0.3, y: -0.2 })
  },
};

const keysDown = new Set();
document.addEventListener("keydown", event => {
  keysDown.add(event.code);
});
document.addEventListener("keyup", event => {
  keysDown.delete(event.code);
});

Matter.Events.on(engine, "beforeUpdate", event => {
  [...keysDown].forEach(k => {
    keyHandlers[k]?.();
  });
});
Events.on(engine, 'afterUpdate', function () {
  if (mouseConstraint.mouse.button === -1 && (rock.position.x > 190 || rock.position.y < 430)) {
    // Limit maximum speed of current rock.
    if (Body.getSpeed(rock) > 45) {
      Body.setSpeed(rock, 45);
    }

    // Release current rock and add a new one.
    rock = Bodies.polygon(170, 450, 7, 20, rockOptions);
    Composite.add(engine.world, rock);
    elastic.bodyB = rock;
  }
});

// add mouse control
var mouse = Mouse.create(render.canvas),
  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false
      }
    }
  });

Composite.add(world, mouseConstraint);

// keep the mouse in sync with rendering
render.mouse = mouse;
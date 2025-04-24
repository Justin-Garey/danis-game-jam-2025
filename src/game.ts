import './style.css'
import * as Matter from 'matter-js'
import decomp from 'poly-decomp'

Matter.Common.setDecomp(decomp);

let canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let board_center = [canvas.width / 2, canvas.height / 2];

const BOARD_WIDTH = 600;

// Common Matter Uses
let Engine = Matter.Engine;
let Render = Matter.Render;
let Runner = Matter.Runner;
let Composites = Matter.Composites;
let Events = Matter.Events;
let Constraint = Matter.Constraint;
let MouseConstraint = Matter.MouseConstraint;
let Mouse = Matter.Mouse;
let Body = Matter.Body;
let Composite = Matter.Composite;
let Bodies = Matter.Bodies;

// Initialize Matter
let engine = Engine.create();
let world = engine.world;
let render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: canvas.width,
        height: canvas.height,
        showAngleIndicator: true
    }
});

Render.run(render);

let runner = Runner.create();
Runner.run(runner, engine);

// Create the Walls
let left_wall = Bodies.rectangle(board_center[0] - (BOARD_WIDTH / 2), (canvas.height / 2), 1, canvas.height, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})

let right_wall = Bodies.rectangle(board_center[0] + (BOARD_WIDTH / 2), (canvas.height / 2), 1, canvas.height, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})

let top_wall = Bodies.rectangle(board_center[0], 0, BOARD_WIDTH, 1, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})

let bottom_wall = Bodies.rectangle(board_center[0], canvas.height, BOARD_WIDTH, 1, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})

let lower_wall_vertices_set = [
    { x: (board_center[0] - (BOARD_WIDTH / 2)), y: (canvas.height - (canvas.height / 12)) },
    { x: (board_center[0] - (BOARD_WIDTH / 10)), y: Math.floor(canvas.height - (canvas.height / 24)) },
    { x: board_center[0], y: canvas.height - 1 },
    { x: (board_center[0] + (BOARD_WIDTH / 10)), y: (canvas.height - (canvas.height / 24)) },
    { x: (board_center[0] + (BOARD_WIDTH / 2)), y: (canvas.height - (canvas.height / 12)) },
    { x: (board_center[0] + (BOARD_WIDTH / 2)), y: canvas.height },
    { x: (board_center[0] - (BOARD_WIDTH / 2)), y: canvas.height }
];

let lower_wall_center = Matter.Vertices.centre(lower_wall_vertices_set);

let lower_wall_set = Bodies.fromVertices(lower_wall_center.x, lower_wall_center.y, lower_wall_vertices_set, {
    isStatic: true,
    render: {
        fillStyle: '#000000'
    }
})

// Add a ball
let ball = Bodies.circle(canvas.width / 2, canvas.height / 2, 20, { isStatic: false, render: { fillStyle: '#060a19' } });


Composite.add(world, [left_wall, right_wall, bottom_wall, top_wall, lower_wall_set, ball])

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
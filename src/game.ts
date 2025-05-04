import './style.css'
import * as Matter from 'matter-js'
import decomp from 'poly-decomp'

// General Settings
const DEBUG = true;
const BOARD_WIDTH = 600;
const FPS = 60;
const GravityY = 1.5;
const GravityX = 0;

// Global Variables
let score = 0;
let highscore = parseInt(localStorage.getItem('highscore') || '0', 10);

function updateHighscore(points: number) {
    localStorage.setItem('highscore', points.toString());
    highscore = points;
}

function updateScore(points: number) {
    score += points;
    if (score > highscore) { updateHighscore(score); }
}

// Matter.js Settings
Matter.Common.setDecomp(decomp);
Matter.Resolver._restingThresh = 0.001; // default is 4

// Canvas and Board Settings
let canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let board_center = [canvas.width / 2, canvas.height / 2];

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
let engine = Engine.create({
    gravity: {
        x: GravityX,
        y: GravityY
    }
});
let world = engine.world;
let render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: canvas.width,
        height: canvas.height,
        showAngleIndicator: true,
        wireframes: DEBUG,
        showStats: DEBUG,
        showPerformance: DEBUG,
        showAxes: DEBUG,
        showBounds: DEBUG,
        showCollisions: DEBUG
    }
});

// Create the Walls (P.S. Do not make this into a vertices set)
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

// TODO: Figure out the best shape for this. Is it a hole in the middle? Split this into two?
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

// Create the score and highscore displays
let scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.textAlign = 'center';
scoreElement.style.pointerEvents = 'none';
document.body.appendChild(scoreElement);

let highscoreElement = document.createElement('div');
highscoreElement.style.position = 'absolute';
highscoreElement.style.color = 'white';
highscoreElement.style.fontSize = '24px';
highscoreElement.style.fontFamily = 'Arial, sans-serif';
highscoreElement.style.textAlign = 'center';
highscoreElement.style.pointerEvents = 'none';
document.body.appendChild(highscoreElement);

Matter.Events.on(render, 'afterRender', () => {
    // Update the score display
    const score_position = render.bounds.min;
    const score_scale = render.options.width / (render.bounds.max.x - render.bounds.min.x);
    const score_x = (lower_wall_center.x - score_position.x) * score_scale - BOARD_WIDTH / 3;
    const score_y = (lower_wall_center.y - score_position.y) * score_scale;

    scoreElement.style.left = `${score_x - scoreElement.offsetWidth / 2}px`;
    scoreElement.style.top = `${score_y - scoreElement.offsetHeight / 2}px`;
    scoreElement.innerText = `Score: ${score}`;

    // Update the highscore display
    const highscore_position = render.bounds.min;
    const highscore_scale = render.options.width / (render.bounds.max.x - render.bounds.min.x);
    const highscore_x = (lower_wall_center.x - highscore_position.x) * highscore_scale + BOARD_WIDTH / 3;
    const highscore_y = (lower_wall_center.y - highscore_position.y) * highscore_scale;

    highscoreElement.style.left = `${highscore_x - highscoreElement.offsetWidth / 2}px`;
    highscoreElement.style.top = `${highscore_y - highscoreElement.offsetHeight / 2}px`;
    highscoreElement.innerText = `Highscore: ${highscore}`;
});

Composite.add(world, [left_wall, right_wall, bottom_wall, top_wall, lower_wall_set])

// Add a ball
let ball = Bodies.circle(canvas.width / 2, canvas.height / 2, 20, {
    isStatic: false,
    restitution: 1,
    slop: 0.01,
    friction: 0.01, // Friction against other objects
    frictionAir: 0.01, // Reduces air resistance for faster movement
    render: { fillStyle: '#060a19' }
});

Composite.add(world, [ball])

// Declare flipper size
const flipper_length = 150;
const flipper_width = 20;
const distance_from_center = BOARD_WIDTH / 3;
const distance_from_bottom = canvas.height / 6;

// Add right flipper
let left_flipper_group = Body.nextGroup(true);
let left_flipper = Bodies.rectangle(board_center[0] - distance_from_center + flipper_length, canvas.height - distance_from_bottom, flipper_length, flipper_width, {
    collisionFilter: { group: left_flipper_group },
    isStatic: false,
    chamfer: 5,
    render: {
        fillStyle: '#ff0000',
        lineWidth: 1
    }
});

let left_flipper_hinge = Bodies.circle(board_center[0] - distance_from_center, canvas.height - distance_from_bottom, 5, {
    isStatic: true,
    render: {
        visible: false
    }
});

let left_flipper_hinge_constraint = Constraint.create({
    bodyA: left_flipper,
    pointA: { x: 0 - (flipper_length / 2), y: 0 },
    bodyB: left_flipper_hinge,
    pointB: { x: 0, y: 0 },
    stiffness: 1,
    length: 0,
    render: {
        strokeStyle: '#4a485b'
    }
});

// Add angle constraint logic
Matter.Events.on(engine, "beforeUpdate", () => {
    const maxAngle = Math.PI / 8; // -22.5 degrees
    const minAngle = -Math.PI / 8; // -22.5 degrees

    if (left_flipper.angle > maxAngle) {
        Body.setAngle(left_flipper, maxAngle);
        Body.setAngularVelocity(left_flipper, 0);
    } else if (left_flipper.angle < minAngle) {
        Body.setAngle(left_flipper, minAngle);
        Body.setAngularVelocity(left_flipper, 0);
    }
});

Composite.add(world, [left_flipper, left_flipper_hinge, left_flipper_hinge_constraint]);

// Right flipper
let right_flipper_group = Body.nextGroup(true);
let right_flipper = Bodies.rectangle(board_center[0] + distance_from_center, canvas.height - distance_from_bottom, 150, 20, {
    collisionFilter: { group: right_flipper_group },
    isStatic: false,
    chamfer: 5,
    render: {
        fillStyle: '#0000ff',
        lineWidth: 1
    }
});

let right_flipper_hinge = Bodies.circle(board_center[0] + distance_from_center, canvas.height - distance_from_bottom, 5, {
    isStatic: true,
    render: {
        visible: false
    }
});

let right_flipper_hinge_constraint = Constraint.create({
    bodyA: right_flipper,
    pointA: { x: 75, y: 0 },
    bodyB: right_flipper_hinge,
    pointB: { x: 0, y: 0 },
    stiffness: 1,
    length: 0,
    render: {
        strokeStyle: '#4a485b'
    }
});

// Add angle constraint logic
Matter.Events.on(engine, "beforeUpdate", () => {
    const maxAngle = Math.PI / 8; // -22.5 degrees
    const minAngle = -Math.PI / 8; // -22.5 degrees

    if (right_flipper.angle > maxAngle) {
        Body.setAngle(right_flipper, maxAngle);
        Body.setAngularVelocity(right_flipper, 0);
    } else if (right_flipper.angle < minAngle) {
        Body.setAngle(right_flipper, minAngle);
        Body.setAngularVelocity(right_flipper, 0);
    }
});

Composite.add(world, [right_flipper, right_flipper_hinge, right_flipper_hinge_constraint]);

// Detect collisions between flippers and the ball
Matter.Events.on(engine, "collisionStart", (event: Matter.IEventCollision<Matter.Engine>) => {
    event.pairs.forEach((pair: Matter.IPair) => {
        const { bodyA, bodyB } = pair;

        if ((bodyA === left_flipper || bodyA === right_flipper) && bodyB === ball) {
            updateScore(1);
        } else if ((bodyB === left_flipper || bodyB === right_flipper) && bodyA === ball) {
            updateScore(1);
        }
    }); 
});

// Create Key Handlers
const keyHandlers = {
    Space: () => {
        Matter.Body.applyForce(right_flipper, {
            x: right_flipper.position.x,
            y: right_flipper.position.y
        }, { x: 0, y: -0.075 })
        Matter.Body.applyForce(left_flipper, {
            x: left_flipper.position.x,
            y: left_flipper.position.y
        }, { x: 0, y: -0.075 })
    },
    Tab: () => {
        updateHighscore(0);
    }
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

// Mouse Control
if (DEBUG) {
    let mouse = Mouse.create(render.canvas),
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

    // Keep Mouse in Sync w/ Rendering
    render.mouse = mouse;
}

function gameLoop() {
    Engine.update(engine, 1000 / FPS);
    Render.world(render);
    requestAnimationFrame(gameLoop);
}

gameLoop();
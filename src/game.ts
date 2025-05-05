import './style.css'
import * as Matter from 'matter-js'
import decomp from 'poly-decomp'
import ufo from './assets/ufo.svg'
//import outline from './assets/outline.svg'
//import satellite from './assets/satellite.svg'

// General Settings
const DEBUG = false;
const VERBOSE = true;
const MOUSE_CONTROL_ENABLED = true;
const BOARD_WIDTH = 800;
const FPS = 60;
const GravityY = 1.5;
const GravityX = 0;
const INDICATOR_ON = 'rgb(199, 0, 0)';
const INDICATOR_OFF = 'rgb(254, 216, 23)';
const delay_indicator_time = 500;
const LIVES = 8;

// Global Variables
let score = 0;
let highscore = parseInt(localStorage.getItem('highscore') || '0', 10);
let indicator_color = INDICATOR_OFF;
let delay_indicator = false;
let state = 'menu'; // menu, playing, paused, gameover
let ball_count = LIVES;
let triggerMultiball = false;
let ballsActive = 0;
let multiballTriggered = false;


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

// Canvas and Board Settings
let canvas = document.querySelector("#game-canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let board_center = [canvas.width / 2, canvas.height / 2];
let dispenser_location = board_center[0] + (4.75 * BOARD_WIDTH / 12)
let context = canvas.getContext('2d');

// Common Matter Uses
let Engine = Matter.Engine;
let Render = Matter.Render;
// let Runner = Matter.Runner;
// let Composites = Matter.Composites;
// let Events = Matter.Events;
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
        background: 'transparent',
        showAngleIndicator: DEBUG,
        wireframes: DEBUG,
        showStats: DEBUG,
        showPerformance: DEBUG,
        showAxes: DEBUG,
        showBounds: DEBUG,
        showCollisions: DEBUG
    }
});

// Create the Walls (P.S. Do not make this into a vertices set)
let left_wall = Bodies.rectangle(board_center[0] - (BOARD_WIDTH / 2), (canvas.height / 2), 2, canvas.height, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})
let right_wall = Bodies.rectangle(board_center[0] + (BOARD_WIDTH / 2), (canvas.height / 2), 2, canvas.height, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})
let top_wall = Bodies.rectangle(board_center[0], 0, BOARD_WIDTH, 2, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})
let bottom_wall = Bodies.rectangle(board_center[0], canvas.height, BOARD_WIDTH, 5, {
    isStatic: true,
    render: {
        fillStyle: '#060a19'
    }
})

// Bottom wall
let lower_left_wall_vertices_set = [
    { x: (board_center[0] - (BOARD_WIDTH / 2)), y: (canvas.height - (canvas.height / 6)) },
    { x: (board_center[0] - (BOARD_WIDTH / 12)), y: (canvas.height - (canvas.height / 24)) },
    { x: (board_center[0] - (BOARD_WIDTH / 12)), y: canvas.height },
    { x: (board_center[0] - (BOARD_WIDTH / 2)), y: canvas.height }
];
let lower_left_wall_center = Matter.Vertices.centre(lower_left_wall_vertices_set);
//@ts-ignore
let lower_left_wall_set = Bodies.fromVertices(lower_left_wall_center.x, lower_left_wall_center.y, lower_left_wall_vertices_set, {
    isStatic: true,
    render: {
        fillStyle: '#000000'
    }
});

let lower_right_wall_vertices_set = [
    { x: (board_center[0] + (BOARD_WIDTH / 2)), y: (canvas.height - (canvas.height / 6)) },
    { x: (board_center[0] + (BOARD_WIDTH / 12)), y: (canvas.height - (canvas.height / 24)) },
    { x: (board_center[0] + (BOARD_WIDTH / 12)), y: canvas.height },
    { x: (board_center[0] + (BOARD_WIDTH / 2)), y: canvas.height }
];
let lower_right_wall_center = Matter.Vertices.centre(lower_right_wall_vertices_set);
//@ts-ignore
let lower_right_wall_set = Bodies.fromVertices(lower_right_wall_center.x, lower_right_wall_center.y, lower_right_wall_vertices_set, {
    isStatic: true,
    render: {
        fillStyle: '#000000'
    }
});

Composite.add(world, [lower_left_wall_set, lower_right_wall_set]);

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
    const score_scale = render.options.width! / (render.bounds.max.x - render.bounds.min.x);
    const score_x = (lower_left_wall_center.x - score_position.x) * score_scale;
    const score_height = scoreElement.clientHeight / 2;
    const score_y = (lower_left_wall_center.y - score_position.y) * score_scale - score_height;

    scoreElement.style.left = `${score_x - scoreElement.offsetWidth / 2}px`;
    scoreElement.style.top = `${score_y - scoreElement.offsetHeight / 2}px`;
    scoreElement.innerText = `Score: ${score}`;

    // Update the highscore display
    const highscore_position = render.bounds.min;
    const highscore_scale = render.options.width! / (render.bounds.max.x - render.bounds.min.x);
    const highscore_x = (lower_left_wall_center.x - highscore_position.x) * highscore_scale;
    const highscore_height = scoreElement.clientHeight / 2;
    const highscore_y = (lower_left_wall_center.y - highscore_position.y) * highscore_scale + highscore_height;

    highscoreElement.style.left = `${highscore_x - highscoreElement.offsetWidth / 2}px`;
    highscoreElement.style.top = `${highscore_y - highscoreElement.offsetHeight / 2}px`;
    highscoreElement.innerText = `Highscore: ${highscore}`;
});

Composite.add(world, [left_wall, right_wall, bottom_wall, top_wall])

// Add a ball
let ball_radius = 20;
let ball = Bodies.circle(dispenser_location - 22.5, 25, ball_radius, {
    isStatic: false,
    restitution: 0.7,
    slop: 0.01,
    mass: 1.5,
    friction: 0.01,
    frictionAir: 0.01,
    render: { fillStyle: '#060a19' }
});

function removeBall() {
    if (VERBOSE) {
        console.log('Removing ball');
    }
    Composite.remove(world, ball);
}

function resetBall() {
    if (VERBOSE) {
        console.log('Resetting Ball');
    }
    Composite.add(world, [ball])
    Body.setPosition(ball, { x: dispenser_location - 22.5, y: 25 });
    Body.setVelocity(ball, { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);
    Body.setAngle(ball, 0);
    Body.setStatic(ball, false);
}


// Add a second ball
let secondBall = Bodies.circle(dispenser_location - 22.5, 25, ball_radius, {
    restitution: 1,
    slop: 0.01,
    mass: 1.5,
    friction: 0.01,
    frictionAir: 0.01,
    render: { fillStyle: '#ff00ff' }
});

function spawnSecondBall() {
    if (VERBOSE) {
        console.log('Spawning Second Ball');
    }
    ballsActive++;
    Composite.add(world, secondBall);
}

function removeSecondBall() {
    if (VERBOSE) {
        console.log('Removing Second Ball');
    }
    ballsActive--;
    Composite.remove(world, secondBall);
}

// Declare flipper size
const flipper_length = 150;
const flipper_width = 20;
const distance_from_center = BOARD_WIDTH / 4;
const distance_from_bottom = canvas.height / 6;

// Add right flipper
let left_flipper_group = Body.nextGroup(true);
let left_flipper = Bodies.rectangle(board_center[0] - distance_from_center + flipper_length, canvas.height - distance_from_bottom, flipper_length, flipper_width, {
    collisionFilter: { group: left_flipper_group },
    isStatic: false,
    render: {
        fillStyle: '#ff0000',
        lineWidth: 1
    }
});

let left_flipper_hinge = Bodies.circle(board_center[0] - distance_from_center, canvas.height - distance_from_bottom, 5, {
    isStatic: true,
    render: {
        visible: false,
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
        visible: false
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
    render: {
        fillStyle: '#0000ff',
        lineWidth: 1
    }
});

let right_flipper_hinge = Bodies.circle(board_center[0] + distance_from_center, canvas.height - distance_from_bottom, 5, {
    isStatic: true,
    render: {
        visible: DEBUG
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
        visible: DEBUG
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

// Walls creating the outer lanes
let left_lane_wall_vertices_set = [
    { x: board_center[0] - distance_from_center - flipper_length + 15, y: canvas.height - distance_from_bottom - flipper_width - 25 }, // bottom left
    { x: board_center[0] - distance_from_center - flipper_length + 15, y: canvas.height - distance_from_bottom - flipper_width - 230 }, // top left
    { x: board_center[0] - distance_from_center - flipper_length + 15 + flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 190 }, // top right
    { x: board_center[0] - distance_from_center - flipper_length + 15 + flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 35 }, // elbow groin
    { x: board_center[0] - distance_from_center, y: canvas.height - distance_from_bottom }, // elbow right
    { x: board_center[0] - distance_from_center - 10, y: canvas.height - distance_from_bottom + flipper_width - 5 } // bottom right
];

let left_lane_wall_center = Matter.Vertices.centre(left_lane_wall_vertices_set);
//@ts-ignore
let left_lane_wall = Bodies.fromVertices(left_lane_wall_center.x, left_lane_wall_center.y, left_lane_wall_vertices_set, {
    isStatic: true,
    render: {
        fillStyle: 'rgb(0, 255, 0)',
    }
});

let right_lane_wall_vertices_set = [
    { x: board_center[0] + distance_from_center + flipper_length - 15, y: canvas.height - distance_from_bottom - flipper_width - 25 }, // bottom right
    { x: board_center[0] + distance_from_center + flipper_length - 15, y: canvas.height - distance_from_bottom - flipper_width - 230 }, // top right
    { x: board_center[0] + distance_from_center + flipper_length - 15 - flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 190 }, // top left
    { x: board_center[0] + distance_from_center + flipper_length - 15 - flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 35 }, // elbow groin
    { x: board_center[0] + distance_from_center, y: canvas.height - distance_from_bottom }, // elbow left
    { x: board_center[0] + distance_from_center + 10, y: canvas.height - distance_from_bottom + flipper_width - 5 } // bottom left
];

let right_lane_wall_center = Matter.Vertices.centre(right_lane_wall_vertices_set);
//@ts-ignore
let right_lane_wall = Bodies.fromVertices(right_lane_wall_center.x, right_lane_wall_center.y, right_lane_wall_vertices_set, {
    isStatic: true,
    render: {
        fillStyle: 'rgb(0, 255, 0)',
    }
});

// Add the left_lane_wall to the world
Composite.add(world, [left_lane_wall, right_lane_wall]);

// Create lane bumpers
let left_lane_bumper_vertices_set = [
    { x: board_center[0] - distance_from_center - flipper_length + 60 + flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 160 }, // top
    { x: board_center[0] - distance_from_center - flipper_length + 60 + flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 75 }, // left
    { x: board_center[0] - distance_from_center - 10, y: canvas.height - distance_from_bottom - flipper_width - 40 } // bottom
];
let left_lane_bumper_center = Matter.Vertices.centre(left_lane_bumper_vertices_set);
//@ts-ignore
let left_lane_bumper = Bodies.fromVertices(left_lane_bumper_center.x, left_lane_bumper_center.y, left_lane_bumper_vertices_set, {
    isStatic: true,
    restitution: 1.2,
    render: {
        fillStyle: 'rgb(49, 83, 141)',
    }
});

let right_lane_bumper_vertices_set = [
    { x: board_center[0] + distance_from_center + flipper_length - 60 - flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 160 }, // top
    { x: board_center[0] + distance_from_center + flipper_length - 60 - flipper_width, y: canvas.height - distance_from_bottom - flipper_width - 75 }, // right
    { x: board_center[0] + distance_from_center + 10, y: canvas.height - distance_from_bottom - flipper_width - 40 } // bottom
];
let right_lane_bumper_center = Matter.Vertices.centre(right_lane_bumper_vertices_set);
//@ts-ignore
let right_lane_bumper = Bodies.fromVertices(right_lane_bumper_center.x, right_lane_bumper_center.y, right_lane_bumper_vertices_set, {
    isStatic: true,
    restitution: 1.2,
    render: {
        fillStyle: 'rgb(49, 83, 141)',
    }
});
Composite.add(world, [left_lane_bumper, right_lane_bumper]);

// Tractor beam
let outerTractorBeamVertices = [
    { x: board_center[0] - BOARD_WIDTH / 12, y: canvas.height / 4.5 },
    { x: board_center[0] + BOARD_WIDTH / 12 + 12, y: canvas.height / 4.5 },
    { x: board_center[0] + BOARD_WIDTH / 6 + 40, y: (36 * canvas.height) / 64 },
    { x: board_center[0] + BOARD_WIDTH / 6, y: (39 * canvas.height) / 64 },
    { x: board_center[0] - BOARD_WIDTH / 6 + 38, y: (79 * canvas.height) / 128 },
    { x: board_center[0] - BOARD_WIDTH / 6, y: (38 * canvas.height) / 64 },
];

let innerTractorBeamVertices = [
    { x: board_center[0] - BOARD_WIDTH / 32 + 4, y: canvas.height / 4.5 },
    { x: board_center[0] + BOARD_WIDTH / 32 + 12, y: canvas.height / 4.5 },
    { x: board_center[0] + BOARD_WIDTH / 8 + 34, y: (39 * canvas.height) / 64 },
    { x: board_center[0], y: (81 * canvas.height) / 128 },
    { x: board_center[0] - BOARD_WIDTH / 8 + 12, y: (39 * canvas.height) / 64 },
];

// Tractor beam effect
Matter.Events.on(engine, "beforeUpdate", () => {
    const ballPosition = ball.position;

    // Check if the ball is inside the inner tractor beam vertices
    if (Matter.Vertices.contains(innerTractorBeamVertices, ballPosition)) {
        const ufoCenter = { x: board_center[0], y: ufoY };
        const forceMagnitude = 0.005;

        // Calculate the direction vector towards the UFO center
        const direction = {
            x: ufoCenter.x - ballPosition.x,
            y: ufoCenter.y - ballPosition.y
        };

        // Normalize the direction vector
        const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2);
        const normalizedDirection = {
            x: direction.x / distance,
            y: direction.y / distance
        };

        // Apply force to the ball
        Matter.Body.applyForce(ball, ballPosition, {
            x: normalizedDirection.x * forceMagnitude,
            y: normalizedDirection.y * forceMagnitude
        });
    }
    else if (Matter.Vertices.contains(outerTractorBeamVertices, ballPosition)) {
        // Check if the ball is inside the outer tractor beam vertices
        const ufoCenter = { x: board_center[0], y: ufoY };
        const forceMagnitude = 0.002;

        // Calculate the direction vector towards the UFO center
        const direction = {
            x: ufoCenter.x - ballPosition.x,
            y: ufoCenter.y - ballPosition.y
        };

        // Normalize the direction vector
        const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2);
        const normalizedDirection = {
            x: direction.x / distance,
            y: direction.y / distance
        };

        // Apply force to the ball
        Matter.Body.applyForce(ball, ballPosition, {
            x: normalizedDirection.x * forceMagnitude,
            y: normalizedDirection.y * forceMagnitude
        });
    }
});

// Draw the UFO above the tractor beam
let ufoImage = new Image();
ufoImage.src = ufo;
const ufoWidth = BOARD_WIDTH / 1.75;
const ufoHeight = canvas.height / 1.5;
const ufoX = board_center[0] - ufoWidth / 2;
const ufoY = canvas.height / 3 - ufoHeight / 2; // Position above the tractor beam
ufoImage.onload = () => {
    context?.drawImage(ufoImage, ufoX, ufoY, ufoWidth, ufoHeight);
};

// Physical UFO implementation
let ufo_body_vertices = [
    { x: ufoX + 20, y: ufoY + ufoHeight / 5 }, // middle left
    { x: ufoX + ufoWidth / 4 + 55, y: ufoY + ufoHeight / 20 }, // top left
    { x: ufoX + ufoWidth / 2, y: ufoY + 15 }, // top middle
    { x: ufoX + (3 * ufoWidth) / 4 - 40, y: ufoY + ufoHeight / 20 }, // top right
    { x: ufoX + ufoWidth, y: ufoY + ufoHeight / 5 }, // middle right
    { x: ufoX + (3 * ufoWidth) / 4, y: ufoY + ufoHeight / 3 }, // bottom right
    { x: ufoX + ufoWidth / 4, y: ufoY + ufoHeight / 3 } // bottom left
];
let ufo_body_center = Matter.Vertices.centre(ufo_body_vertices);
//@ts-ignore
let ufo_body = Bodies.fromVertices(ufo_body_center.x, ufo_body_center.y, ufo_body_vertices, {
    isStatic: true,
    render: {
        fillStyle: 'rgba(255, 0, 0, 0)',
    }
});
Composite.add(world, [ufo_body]);

// Add two walls in the top right of the game board
const wallWidth = 3;
const wallHeight = canvas.height / 24;
const wallSpacing = ball_radius * 2 + 5;

let right_dispenser_wall = Bodies.rectangle(dispenser_location, wallHeight / 2, wallWidth, wallHeight, {
    isStatic: true,
    render: {
        fillStyle: '#000000'
    }
})

let left_dispenser_wall = Bodies.rectangle(dispenser_location - wallSpacing, wallHeight / 2, wallWidth, wallHeight, {
    isStatic: true,
    render: {
        fillStyle: '#000000'
    }
})

Composite.add(world, [right_dispenser_wall, left_dispenser_wall]);

// Detect collisions between flippers and the ball
Matter.Events.on(engine, "collisionStart", (event: Matter.IEventCollision<Matter.Engine>) => {
    event.pairs.forEach((pair: Matter.Pair) => {
        const { bodyA, bodyB } = pair;

        if ((bodyA === left_flipper || bodyA === right_flipper) && (bodyB === ball || bodyB === secondBall)) {
            updateScore(1);
        } else if ((bodyB === left_flipper || bodyB === right_flipper) && (bodyB === ball || bodyB === secondBall)) {
            updateScore(1);
        }
    });
});

document.addEventListener("keyup", event => {
    keysDown.delete(event.code);
    if (event.code === "Space") {
        if (state === 'menu') {
            console.log('Game Started');
            state = 'paused';
            title_text.style.visibility = 'hidden';
            start_text.style.visibility = 'hidden';
            credits_text.style.visibility = 'hidden';
            paused_text.style.visibility = 'visible';
        }
        else if (state === 'paused') {
            console.log('Ball Launched');
            state = 'playing';
            paused_text.style.visibility = 'hidden';
            resetBall();
            ballsActive++;
        }
        else if (state === 'playing') {
            // nothing to do here
        }
        else if (state === 'gameover') {
            console.log('Game Restarted');
            state = 'paused';
            gameover_text.style.visibility = 'hidden';
            restart_text.style.visibility = 'hidden';
            paused_text.style.visibility = 'visible';
            updateScore(-score);
            ball_count = LIVES;
        }
    }
});

document.addEventListener("keydown", event => {
    if (event.code === "KeyR" && !keysDown.has(event.code)) {
        resetBall();
    }
});

function isBallInBeam(ball_to_check: Matter.Body = ball): boolean {
    return (
        ufoX + ufoWidth / 4 < ball_to_check.position.x &&
        ufoX + (3 * ufoWidth) / 4 > ball_to_check.position.x &&
        ball_to_check.position.y >= ufoY + ufoHeight / 3 - ball_radius &&
        ball_to_check.position.y <= ufoY + ufoHeight / 3 + ball_radius
    );
}

Matter.Events.on(engine, "beforeUpdate", () => {
    // --- Main ball fell ---
    if (ball.position.y + ball_radius >= canvas.height - ball_radius / 2) {
        removeBall();
        ball_count--;
        ballsActive--;
        if (ballsActive = 0) {
            if (ball_count <= 0) {
                console.log('Game Over');
                state = 'gameover';
            } else if (state === 'playing') {
                state = 'paused';
                paused_text.style.visibility = 'visible';
                resetBall();
                Body.setStatic(ball, true);
            }
        }
    }

    // --- Second ball fell ---
    if (secondBall && secondBall.position.y + ball_radius >= canvas.height - ball_radius / 2) {
        removeSecondBall();
        multiballTriggered = false;
        if (ballsActive = 0) {
            if (ball_count <= 0) {
                console.log('Game Over');
                state = 'gameover';
            } else if (state === 'playing') {
                state = 'paused';
                paused_text.style.visibility = 'visible';
                resetBall();
                Body.setStatic(ball, true);
            }
        }
    }

    // Ball is in UFO beam
    if (isBallInBeam(ball)) {
        setTimeout(() => {
            if (!triggerMultiball && isBallInBeam(ball)) {
                triggerMultiball = true;
                removeBall();
                ball_count--;
                if (ball_count <= 0) {
                    console.log('Game Over');
                    state = 'gameover';
                } else if (state === 'playing') {
                    state = 'paused';
                    paused_text.style.visibility = 'visible';
                    resetBall();
                    Body.setStatic(ball, true);
                }
            }
        }, 500);
    }
    if (multiballTriggered && isBallInBeam(secondBall)) {
        setTimeout(() => {
            if (isBallInBeam(secondBall)) {
                removeSecondBall();
            }
        }, 500);
    }
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
        if (!delay_indicator) {
            delay_indicator = true;
            indicator_color = INDICATOR_ON;
            setTimeout(() => {
                delay_indicator = false;
            }, delay_indicator_time)
        }
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

Matter.Events.on(engine, "beforeUpdate", () => {
    [...keysDown].forEach(k => {
        keyHandlers[k as keyof typeof keyHandlers]?.();
    });
});


if (DEBUG || MOUSE_CONTROL_ENABLED) {
    // Mouse Control
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

// Define the triangle vertices
const triangleVertices = [
    { x: (board_center[0] + (BOARD_WIDTH / 2) - (BOARD_WIDTH / 24)), y: lower_right_wall_center.y - 50 },
    { x: (board_center[0] + (BOARD_WIDTH / 6)), y: canvas.height - canvas.height / 36 },
    { x: (board_center[0] + (BOARD_WIDTH / 2) - (BOARD_WIDTH / 24)), y: canvas.height - canvas.height / 36 }
];

// Draw the triangle on the canvas
function drawTriangle() {
    if (context) {
        context.beginPath();
        context.moveTo(triangleVertices[0].x, triangleVertices[0].y);
        context.lineTo(triangleVertices[1].x, triangleVertices[1].y);
        context.lineTo(triangleVertices[2].x, triangleVertices[2].y);
        context.closePath();
        context.fillStyle = 'rgba(75, 75, 75, 0.8)'; // Yellow color
        context.fill();
    }
}

// Indicator inside the triangle
const center_of_indicator = {
    x: (triangleVertices[1].x + triangleVertices[2].x) / 2 - (triangleVertices[1].x - triangleVertices[2].x) / 3 + 5,
    y: (triangleVertices[0].y + triangleVertices[1].y) / 2 + 5
};

function drawIndicator() {
    if (context) {
        const radius = 25;
        context.beginPath();
        context.arc(center_of_indicator.x, center_of_indicator.y, radius, 0, Math.PI * 2);
        context.fillStyle = indicator_color;
        context.fill();
    }
}

// Outline image declaration and settings
// TODO: uncomment this when needed
// let outline_image = new Image();
// outline_image.src = outline;
// const outline_width = BOARD_WIDTH;
// const outline_height = canvas.height;
// const outline_x = board_center[0] - outline_width / 2;
// const outline_y = canvas.height / 2 - outline_height / 2;

// Add the triangle drawing to the game loop
function draw() {
    if (context) {
        // Existing drawing logic
        context.beginPath();
        context.moveTo(outerTractorBeamVertices[0].x, outerTractorBeamVertices[0].y);
        context.lineTo(outerTractorBeamVertices[1].x, outerTractorBeamVertices[1].y);
        context.lineTo(outerTractorBeamVertices[2].x, outerTractorBeamVertices[2].y);
        context.lineTo(outerTractorBeamVertices[3].x, outerTractorBeamVertices[3].y);
        context.lineTo(outerTractorBeamVertices[4].x, outerTractorBeamVertices[4].y);
        context.lineTo(outerTractorBeamVertices[5].x, outerTractorBeamVertices[5].y);
        context.closePath();
        context.fillStyle = 'rgba(0, 255, 0, 0.5)';
        context.fill();

        context.beginPath();
        context.moveTo(innerTractorBeamVertices[0].x, innerTractorBeamVertices[0].y);
        context.lineTo(innerTractorBeamVertices[1].x, innerTractorBeamVertices[1].y);
        context.lineTo(innerTractorBeamVertices[2].x, innerTractorBeamVertices[2].y);
        context.lineTo(innerTractorBeamVertices[3].x, innerTractorBeamVertices[3].y);
        context.lineTo(innerTractorBeamVertices[4].x, innerTractorBeamVertices[4].y);
        context.closePath();
        context.fillStyle = 'rgba(255, 0, 0, 0.5)';
        context.fill();

        context.drawImage(ufoImage, ufoX, ufoY, ufoWidth, ufoHeight);

        // Draw the outline image
        // TODO: uncomment this to see it and modify it with the outline image declaration and settings
        // context.drawImage(outline_image, outline_x, outline_y, outline_width, outline_height);

        drawTriangle();
        drawIndicator();
    }
}

// ALIEEYUN
let title_text = document.createElement('div');
title_text.style.position = 'absolute';
title_text.style.color = 'black';
title_text.style.fontSize = '40px';
title_text.style.fontFamily = 'Arial, sans-serif';
title_text.style.left = '50%';
title_text.style.top = '70%';
title_text.style.transform = 'translate(-50%, -50%)';
title_text.innerText = 'ALIEEYUN';
document.body.appendChild(title_text);
title_text.style.visibility = 'hidden';

let start_text = document.createElement('div');
start_text.style.position = 'absolute';
start_text.style.color = 'black';
start_text.style.fontSize = '30px';
start_text.style.fontFamily = 'Arial, sans-serif';
start_text.style.left = '50%';
start_text.style.top = '75%';
start_text.style.transform = 'translate(-50%, -50%)';
start_text.innerText = 'Press Space to Start';
document.body.appendChild(start_text);
start_text.style.visibility = 'hidden';

let credits_text = document.createElement('div');
credits_text.style.position = 'absolute';
credits_text.style.color = 'black';
credits_text.style.fontSize = '20px';
credits_text.style.fontFamily = 'Arial, sans-serif';
credits_text.style.left = '50%';
credits_text.style.top = '80%';
credits_text.style.transform = 'translate(-50%, -50%)';
credits_text.innerText = 'Created by: Justin Garey and Bronson Farley';
document.body.appendChild(credits_text);
credits_text.style.visibility = 'hidden';

let paused_text = document.createElement('div');
paused_text.style.position = 'absolute';
paused_text.style.color = 'black';
paused_text.style.fontSize = '30px';
paused_text.style.fontFamily = 'Arial, sans-serif';
paused_text.style.left = '50%';
paused_text.style.top = '75%';
paused_text.style.transform = 'translate(-50%, -50%)';
paused_text.innerText = 'Press Space to Launch';
document.body.appendChild(paused_text);
paused_text.style.visibility = 'hidden';

let gameover_text = document.createElement('div');
gameover_text.style.position = 'absolute';
gameover_text.style.color = 'black';
gameover_text.style.fontSize = '30px';
gameover_text.style.fontFamily = 'Arial, sans-serif';
gameover_text.style.left = '50%';
gameover_text.style.top = '50%';
gameover_text.style.transform = 'translate(-50%, -50%)';
gameover_text.innerText = 'Game Over';
document.body.appendChild(gameover_text);
gameover_text.style.visibility = 'hidden';

let restart_text = document.createElement('div');
restart_text.style.position = 'absolute';
restart_text.style.color = 'black';
restart_text.style.fontSize = '30px';
restart_text.style.fontFamily = 'Arial, sans-serif';
restart_text.style.left = '50%';
restart_text.style.top = '60%';
restart_text.style.transform = 'translate(-50%, -50%)';
restart_text.innerText = 'Press Space to Restart';
document.body.appendChild(restart_text);
restart_text.style.visibility = 'hidden';

function gameLoop() {
    if (state === 'menu') {
        if (context) {
            title_text.style.visibility = 'visible';
            start_text.style.visibility = 'visible';
            credits_text.style.visibility = 'visible';
        }
    }
    else if (state === 'paused') {
        if (context) {
            Engine.update(engine, 1000 / FPS, 0.7); // Third argument is the time correction scale
            Body.setStatic(ball, true);
            Render.world(render);
            draw();
            paused_text.style.visibility = 'visible';
        }
    }
    else if (state === 'playing') {
        Engine.update(engine, 1000 / FPS);
        Render.world(render);
        draw();
    }
    else if (state === 'gameover') {
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            gameover_text.style.visibility = 'visible';
            restart_text.style.visibility = 'visible';
        }
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();
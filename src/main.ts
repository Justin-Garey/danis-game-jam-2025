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
        canvas: canvas,
        engine: engine,
        options: {
            width: 800,
            height: 600,
            showAngleIndicator: true
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

    var pyramid = Composites.pyramid(500, 300, 9, 10, 0, 0, function(x, y) {
        return Bodies.rectangle(x, y, 25, 40);
    });

    var ground2 = Bodies.rectangle(610, 250, 200, 20, { isStatic: true, render: { fillStyle: '#060a19' } });

    var pyramid2 = Composites.pyramid(550, 0, 5, 10, 0, 0, function(x, y) {
        return Bodies.rectangle(x, y, 25, 40);
    });

    Composite.add(engine.world, [ground, pyramid, ground2, pyramid2, rock, elastic]);

    // Create a keyHandlers
    const keyHandlers = {
      Space: () => {
        Matter.Body.applyForce(rock, {
          x: rock.position.x,
          y: rock.position.y
        }, {x: 0.02, y: 0})
      },
      KeyA: () => {
        Matter.Body.applyForce(rock, {
          x: rock.position.x,
          y: rock.position.y
        }, {x: -0.02, y: 0})
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
    Events.on(engine, 'afterUpdate', function() {
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

    // fit the render viewport to the scene
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: 800, y: 600 }
    });
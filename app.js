const startGame = () => {
    const { 
        Engine, 
        Render, 
        Runner, 
        World, 
        Bodies,
        Body,
        Events
    } = Matter;
    
    const maxVelocity = 5;
    const cellsHorizontal = 10;
    const cellsVertical = 10;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const unitLengthX = width / cellsHorizontal;
    const unitLengthY = height / cellsVertical;
    
    const engine = Engine.create();
    engine.world.gravity.y = 0;
    const { world } = engine;
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            wireframes: false,
            width: width,
            height: height
        }
    });
    Render.run(render);
    Runner.run(Runner.create(), engine);
    
    //Walls
    const walls = [
        Bodies.rectangle(width/2, 0, width, 2, {
            isStatic: true
        }),
        Bodies.rectangle(width/2, height, width, 2, {
            isStatic: true
        }),
        Bodies.rectangle(0, height/2, 2, height, {
            isStatic: true
        }),
        Bodies.rectangle(width, height/2, 2, height, {
            isStatic: true
        })
    ];
    World.add(world, walls);
    
    //Maze generation.
    
    const shuffle = (arr) => {
        let counter = arr.length;
    
        while(counter > 0) {
            const index = Math.floor(Math.random() * counter);
            counter--;
            const temp = arr[counter];
            arr[counter] = arr[index];
            arr[index] = temp;
        }
    
        return arr;
    };
    
    const grid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));
    
    const verticals = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal - 1).fill(false));
    
    const horizontals = Array(cellsVertical - 1)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));
    
    const startRow = Math.floor(Math.random() * cellsVertical);
    const startColumn = Math.floor(Math.random() * cellsHorizontal);
    
    const stepThroughCell = (row, column) => {
        if(grid[row][column]){
            return;
        };
    
        grid[row][column] = true;
    
        const neighbors = shuffle([
            [row - 1, column, 'up'],
            [row, column + 1, 'right'],
            [row + 1, column, 'down'],
            [row, column - 1, 'left']
        ]);
    
        for(let neighbor of neighbors){
            const[nextRow, nextColumn, direction] = neighbor;
    
            if(nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal){
                continue;
            };
    
            if(grid[nextRow][nextColumn]) {
                continue;
            };
    
            if(direction === 'left') {
                verticals[row][column - 1] = true;
            } else if(direction === 'right') {
                verticals[row][column] = true;
            } else if (direction === 'up'){
                horizontals[row - 1][column] = true;
            } else if (direction === 'down'){
                horizontals[row][column] = true;
            }
    
            stepThroughCell(nextRow, nextColumn);
    
        }
        
    
    };
    stepThroughCell(startRow, startColumn);
    
    horizontals.forEach((row, rowIndex) => {
       row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
    
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'blue'
                }
            }
        );
        World.add(world, wall);
       });
    });
    
    verticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'blue'
                }
            }
        );
        World.add(world, wall);
        });
    });
    
    //goal
    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        unitLengthX * 0.7,
        unitLengthY * 0.7,
        {
            label: 'goal',
            isStatic: true,
            render: {
                fillStyle: 'green'
            }
        }
    );
    World.add(world, goal);
    
    //ball
    const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius,
        {
            label: 'ball',
            render: {
                fillStyle: 'red'
            }
        }
    );
    World.add(world, ball);
    
    document.addEventListener('keydown', event => {
        const {x, y} = ball.velocity;
        console.log(x, y);
        
        if(event.keyCode === 87 && y > 0 - maxVelocity){
            Body.setVelocity(ball, {x, y: y - 2});
        } 
        if (event.keyCode === 68 && x < maxVelocity){
            Body.setVelocity(ball, {x: x + 2, y});
        }
        if (event.keyCode === 83 && y < maxVelocity){
            Body.setVelocity(ball, {x ,y: y + 2});
        }
        if (event.keyCode === 65 && x > 0 - maxVelocity){
            Body.setVelocity(ball, {x: x - 2 ,y});
        }
    });
    
    //Win Condition
    Events.on(engine, 'collisionStart', event => {
        event.pairs.forEach((collision => {
            const labels = ['ball', 'goal'];
            const replay = document.querySelector('#replay');
            replay.addEventListener('click', () => {
                document.querySelector('.winner').classList.add('hidden');
                World.clear(world);
                Engine.clear(engine);
                Render.stop(render);
                render.canvas.remove();
                render.canvas = null;
                render.context = null;
                render.textures = {};
                startGame();
});
            if(labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)){
                document.querySelector('.winner').classList.remove('hidden');
                world.gravity.y = 1;
                world.bodies.forEach(body => {
                    if(body.label === 'wall') {
                        Body.setStatic(body, false);
                    }
                })
            }
        }))
    });
};

startGame();


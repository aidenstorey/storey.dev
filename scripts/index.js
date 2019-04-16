// ---------
// Elements
// ---------

const github = document.getElementById('g');
const linkedin = document.getElementById('l');
const snake = document.getElementById('s');


// ------------------
// Handle User Input
// ------------------

const INVERSE_DIRECTION = {
    'Up': 'Down',
    'Down': 'Up',
    'Left': 'Right',
    'Right': 'Left',
};

let currentDirection = 'Right';

const changeDirection = (direction) => {
    if (currentDirection !== direction && currentDirection !== INVERSE_DIRECTION[direction]) {
        currentDirection = direction;
    }
};

addEventListener('keydown', (event) => {
    if (event.key.startsWith('Arrow')) {
        changeDirection(event.key.substr(5));
        event.preventDefault();
    }
});

// ---------------
// Handle element
// ---------------

const elementReset = (element) => {
    element.style.position = 'static';
}

const elementSetPosition = (element, x, y) => {
    element.style.position = 'fixed';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    element.data = {
        x: (x - screenOriginX) / screenEM,
        y: (y - screenOriginY) / screenEM,
    };
};


// -----------------------
// Handle screen resizing
// -----------------------

const MOVEMENT_DISTANCE = 1.5;

let elementOriginX, elementOriginY;
let screenHeight, screenWidth;

let screenEM;

let screenOriginX, screenOriginY;
let screenHeightEM, screenWidthEM;

let snakeOriginX, snakeOriginY;

const adjustSize = () => {
    if (document.documentElement.clientHeight !== screenHeight ||
        document.documentElement.clientWidth !== screenWidth) {
            screenHeight = document.documentElement.clientHeight;
            screenWidth = document.documentElement.clientWidth;

            elementReset(github);
            elementOriginX = github.offsetLeft;
            elementOriginY = github.offsetTop;

            snake.style.position = 'fixed';
            snake.style.left = '1rem';

            screenEM = snake.offsetLeft * MOVEMENT_DISTANCE;

            snake.style.position = null;
            snake.style.left = null;

            screenOriginX = elementOriginX - Math.floor(elementOriginX / screenEM) * screenEM;
            screenOriginY = elementOriginY - Math.floor(elementOriginY / screenEM) * screenEM;
            screenHeightEM = Math.floor((screenHeight - screenOriginY) / screenEM) * screenEM - screenEM;
            screenWidthEM = Math.floor((screenWidth - screenOriginX) / screenEM) * screenEM - screenEM;

            elementSetPosition(github, elementOriginX, elementOriginY);
            elementSetPosition(linkedin, elementOriginX + screenEM, elementOriginY);
            elementSetPosition(snake, elementOriginX + screenEM * 2, elementOriginY);

            snakeStartX = snake.offsetLeft;
            snakeStartY = snake.offsetTop;
        return true;
    }
    return false;
};


// ----------------
// Utility helpers
// ----------------

const FRAME_WAIT = 0.2;

let deltaTime = 0.0;
let previousTime = Date.now();
let currentFrameTime = 0.0;

const isPosition = (ax, ay, bx, by) => {
    return ax === bx && ay === by;
}

const tick = () => {
    const currentTime = Date.now();
    deltaTime = (currentTime - previousTime) / 1000.0;
    previousTime = currentTime;
};


// ------
// Snake
// ------

const DIRECTIONAL_OFFSET = {
    'Up': { x: 0, y: -1 },
    'Down': { x: 0, y: 1 },
    'Left': { x: -1, y: 0 },
    'Right': { x: 1, y: 0 },
}

const snakeCollidables = [github, linkedin];
const snakeParts = [];
let snakeStart = 0;
let snakeLast = 0;

const snakeAddPart = (...elements) => {
    for (const element of elements) {
        if (snakeParts.length === 0) {
            element.data = Object.assign({}, snake.data);
            snakeParts.push(element);
        } else {
            element.data = Object.assign({}, snakeParts[snakeLast].data);
            snakeParts.splice(snakeLast + 1, 0, element);

            snakeRenderPart(element);
            snakeLast +=1;
        }
    }
}

const snakeCloneElement = (ready = true) => {
    const element = snake.cloneNode();
    element.data = Object.assign({}, snake.data);

    element.id = 'part-copy';

    element.style.background = '#333';
    element.style.position = 'fixed';
    document.body.appendChild(element);

    return element
}

const snakeCheckCollect = () => {
    const head = snakeParts[snakeStart];

    for (const collidable of snakeCollidables) {
        if (head.data.x === collidable.data.x && head.data.y === collidable.data.y) {
            snakeAddPart(snakeCloneElement());
            elementSetPosition(collidable,
                screenOriginX + (Math.floor(Math.random() * screenWidthEM / screenEM)) * screenEM,
                screenOriginY + (Math.floor(Math.random() * screenHeightEM / screenEM)) * screenEM,
            );
        }
    }
}

const snakeCheckCollision = () => {
    const head = snakeParts[snakeStart];

    if (head.offsetLeft < screenOriginX || head.offsetLeft > screenOriginX + screenWidthEM ||
        head.offsetTop < screenOriginX || head.offsetTop > screenOriginY + screenHeightEM) {
        return true;
    }

    // for (let partIndex = 0; partIndex < snakeParts.length; ++partIndex) {
    //     if (partIndex !== snakeStart) {
    //         const part = snakeParts[partIndex];
    //         if (head.data.x === part.data.x && head.data.y === part.data.y) {
    //             console.log("now");
    //             return true;
    //         }
    //     }
    // }

    return false;
}

const snakeLastIndex = () => {
    return (snakeStart + snakeParts.length - 1) % snakeParts.length;
}

const snakeMove = () => {
    snakeLast = snakeLastIndex();

    const part = snakeParts[snakeLast];

    part.data.x = snakeParts[snakeStart].data.x + DIRECTIONAL_OFFSET[currentDirection].x;
    part.data.y = snakeParts[snakeStart].data.y + DIRECTIONAL_OFFSET[currentDirection].y;
    part.ready = true;

    snakeRenderPart(part);

    snakeStart = snakeLast;
}

const snakeRenderPart = (part) => {
    part.style.left = `${screenOriginX + part.data.x * screenEM}px`;
    part.style.top = `${screenOriginY + part.data.y * screenEM}px`;
}

const snakeReset = () => {
    for (const part of snakeParts) {
        document.body.removeChild(part);
    }

    currentDirection = 'Right';
    snakeLast = 0;
    snakeStart = 0;
    snakeParts.length = 0;

    snakeAddPart(snakeCloneElement(), snakeCloneElement(false), snakeCloneElement(false));

    for (let collidableIndex = 0; collidableIndex < snakeCollidables.length; ++collidableIndex) {
        elementSetPosition(
            snakeCollidables[collidableIndex],
            elementOriginX + screenEM * collidableIndex,
            elementOriginY
        );
    }
}

const update = () => {
    const screenAdjusted = adjustSize();

    tick();
    currentFrameTime = Math.max(0.0, currentFrameTime - deltaTime);
    if (currentFrameTime) {
        return requestAnimationFrame(update);
    }

    if (!screenAdjusted && !snakeCheckCollision()) {
        snakeCheckCollect();
        snakeMove();
    } else {
        snakeReset();
    }

    currentFrameTime = FRAME_WAIT;

    requestAnimationFrame(update);
};


// ------
// Start
// ------

adjustSize();
snakeAddPart(snakeCloneElement(), snakeCloneElement(false), snakeCloneElement(false));
requestAnimationFrame(update);

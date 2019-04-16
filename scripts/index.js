// ----------
// Constants
// ----------

const DIRECTIONAL_OFFSET = {
    'Up': { x: 0, y: -1 },
    'Down': { x: 0, y: 1 },
    'Left': { x: -1, y: 0 },
    'Right': { x: 1, y: 0 },
};

const INVERSE_DIRECTION = {
    'Up': 'Down',
    'Down': 'Up',
    'Left': 'Right',
    'Right': 'Left',
};

const MOVEMENT_DISTANCE = 1.5;


// ---------
// Elements
// ---------

const github = document.getElementById('g');
const linkedin = document.getElementById('l');
const snake = document.getElementById('s');


// ----------
// Variables
// ----------

let resizeTaskId, updateTaskId;

let elementOriginX, elementOriginY;

let playingOriginX, playingOriginY;
let playingHeight, playingWidth;

let screenHeight, screenWidth;
let screenEM;

let snakeCollectables = [ github, linkedin ];
let snakeParts = [];
let snakeStart, snakeLast;

let snakeCurrentDirection, snakeNextDirection;


// --------
// Helpers
// --------

const changeDirection = (direction) => {
    if (snakeCurrentDirection !== direction && snakeCurrentDirection !== INVERSE_DIRECTION[direction]) {
        snakeNextDirection = direction;
    }
}

const elementMove = (element, x, y) => {
    element.style.position = 'fixed';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
};

const elementReset = (element) => {
    element.style.position = 'static';
}

const snakeAdd = (count = 1) => {
    for (let c = 0; c < count; ++c) {
        let element
        if (snakeParts.length === 0) {
            element = snake.cloneNode();
            snakeParts.push(element);
        } else {
            element = snakeParts[snakeLast].cloneNode();
            snakeParts.splice(snakeLast + 1, 0, element);
            snakeLast += 1;
        }
        document.body.appendChild(element);
        element.style.background = '#333';
    }
};

const snakeCheckCollision = () => {
    const head = snakeParts[snakeStart];

    if (head.offsetLeft < playingOriginX || head.offsetLeft > playingOriginX + playingWidth ||
        head.offsetTop < playingOriginY || head.offsetTop > playingOriginY + playingHeight) {
            return true;
        }

    // TODO: Self collisions

    return false;
}


// ----------
// Listeners
// ----------

addEventListener('keydown', (event) => {
    if (event.key.startsWith('Arrow')) {
        changeDirection(event.key.substr(5));
        event.preventDefault();
    }
});

// TODO: swipe listener

addEventListener('resize', () => {
    if (resizeTaskId !== null) {
        clearTimeout(resizeTaskId);
    } else {
        destroy();
    }

    resizeTaskId = setTimeout(() => {
        resizeTaskId = null;
        initialize();
    }, 500);
});


// -----
// Game
// -----

const initialize = () => {
    resizeTaskId = updateTaskId = null;

    elementOriginX = github.offsetLeft;
    elementOriginY = github.offsetTop;

    snake.style.position = 'fixed';
    snake.style.left = '1rem';
    screenEM = snake.offsetLeft * MOVEMENT_DISTANCE;

    screenHeight = document.documentElement.clientHeight;
    screenWidth = document.documentElement.clientWidth;

    playingOriginX = elementOriginX - Math.floor(elementOriginX / screenEM) * screenEM;
    playingOriginY = elementOriginY - Math.floor(elementOriginY / screenEM) * screenEM;
    playingHeight = Math.floor((screenHeight - playingOriginY) / screenEM) * screenEM - screenEM;
    playingWidth = Math.floor((screenWidth - playingOriginX) / screenEM) * screenEM - screenEM;

    elementMove(github, elementOriginX, elementOriginY);
    elementMove(linkedin, elementOriginX + screenEM, elementOriginY);
    elementMove(snake, elementOriginX + screenEM * 2, elementOriginY);

    snakeCurrentDirection = snakeNextDirection = 'Right';
    snakeStart = snakeLast = 0;

    snakeAdd(3);

    requestAnimationFrame(updateLoop);
};

const destroy = () => {
    for (const part of snakeParts) {
        document.body.removeChild(part);
    }
    snakeParts.length = 0;

    elementReset(github);
    elementReset(linkedin);
    elementReset(snake);

    clearTimeout(updateTaskId);
    updateTaskId = null;
};

const updateLoop = () => {
    if (snakeCheckCollision()) {
        destroy();
        initialize();
    } else {
        snakeCurrentDirection = snakeNextDirection;
        snakeLast = (snakeStart + snakeParts.length - 1) % snakeParts.length;
        elementMove(
            snakeParts[snakeLast],
            snakeParts[snakeStart].offsetLeft + DIRECTIONAL_OFFSET[snakeCurrentDirection].x * screenEM,
            snakeParts[snakeStart].offsetTop + DIRECTIONAL_OFFSET[snakeCurrentDirection].y * screenEM,
        );
        snakeStart = snakeLast;

        for (const collectable of snakeCollectables) {
            if (snakeParts[snakeStart].offsetLeft === collectable.offsetLeft &&
                snakeParts[snakeStart].offsetTop === collectable.offsetTop) {
                    snakeAdd();
                    elementMove(
                        collectable,
                        playingOriginX + (Math.floor(Math.random() * playingWidth / screenEM)) * screenEM,
                        playingOriginY + (Math.floor(Math.random() * playingHeight / screenEM)) * screenEM,
                    );
                }
        }

        updateTaskId = setTimeout(() => { requestAnimationFrame(updateLoop); }, 200);
    }
};


// ------
// Start
// ------

initialize();

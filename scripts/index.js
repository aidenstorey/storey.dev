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

const ROTATIONAL_DIRECTION = {
    0: 'Up',
    1: 'Right',
    2: 'Down',
    3: 'Left',
};

const MOVEMENT_DISTANCE = 1.5;

const HALF_PI = Math.PI * 0.5;
const QUARTER_PI = Math.PI * 0.25;

const LISTENER_OPTIONS = { passive: false };


// ---------
// Elements
// ---------

const github = document.getElementById('g');
const linkedin = document.getElementById('l');
const email = document.getElementById('e');
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

let snakeCollectables = [ github, linkedin, email ];
let snakeParts = [];
let snakeStart, snakeLast;

let snakeCurrentDirection, snakeNextDirection;

let touchX, touchY;


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
    element.style.paddingRight= '0';
};

const elementReset = (element) => {
    element.style.position = 'static';
    element.style.paddingRight = `${MOVEMENT_DISTANCE}em`
};

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

    for (let i = 3; i < snakeParts.length; ++i) {
        const part = snakeParts[(snakeStart + i) % snakeParts.length];
        if (head.offsetLeft === part.offsetLeft && head.offsetTop === part.offsetTop) {
            return true;
        }
    }

    return false;
};

const snakeKill = () => {
    clearTimeout(updateTaskId);
    updateTaskId = null;

    for (let i = 0; i < 6; ++i) {
        setTimeout(() => {
            snakeShow(i % 2);
        }, i * 200);
    }

    setTimeout(() => {
        destroy();
        initialize();
    }, 1200);
}

const snakeShow = (show = true) => {
    const background = show ? '#333' : null;

    for (const part of snakeParts) {
        part.style.background = background;
    }
};


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

addEventListener('touchstart', (event) => {
    if (touchX || touchY) {
        return;
    }

    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
}, LISTENER_OPTIONS);

addEventListener('touchmove', (event) => {
    event.preventDefault();
}, LISTENER_OPTIONS);

addEventListener('touchend', (event) => {
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    touchX = touchY = null;

    if (dx === 0 && dy === 0) {
        return;
    }

    let sector = Math.floor((Math.acos(-dy / Math.sqrt(dx * dx + dy * dy)) + QUARTER_PI) / HALF_PI);
    if (sector === 1 && dx < 0) {
        sector = 3;
    }

    changeDirection(ROTATIONAL_DIRECTION[sector]);
}, LISTENER_OPTIONS);

addEventListener('mousedown', (event) => {
    const head = snakeParts[snakeStart];
    const dx = event.clientX - head.offsetLeft;
    const dy = event.clientY - head.offsetTop;

    let sector = Math.floor((Math.acos(-dy / Math.sqrt(dx * dx + dy * dy)) + QUARTER_PI) / HALF_PI);
    if (sector === 1 && dx < 0) {
        sector = 3;
    }

    changeDirection(ROTATIONAL_DIRECTION[sector]);
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

    for (let i = 0; i < snakeCollectables.length; ++i) {
        elementMove(snakeCollectables[i], elementOriginX + screenEM * i * 2, elementOriginY);
    }
    elementMove(snake, elementOriginX + screenEM * 6, elementOriginY);

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

    for (const collectable of snakeCollectables) {
        elementReset(collectable);
    }
    elementReset(snake);

    clearTimeout(updateTaskId);
    updateTaskId = null;
};

const updateLoop = () => {
    if (snakeCheckCollision()) {
        snakeKill();
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


"use strict";

/* =========================================================
   MONSTER HUNTER
   ULUG'BEK.R
========================================================= */


/* =========================
   DOM
========================= */

const $ = (id) => document.getElementById(id);

const menuScreen = $("menuScreen");
const gameScreen = $("gameScreen");

const playerNameInput = $("playerName");
const startBtn = $("startBtn");
const instructionsBtn = $("instructionsBtn");
const closeInstructionsBtn = $("closeInstructionsBtn");

const pauseBtn = $("pauseBtn");
const restartBtn = $("restartBtn");
const soundBtn = $("soundBtn");

const attackBtn = $("attackBtn");
const meleeBtn = $("meleeBtn");
const potionBtn = $("potionBtn");

const pauseModal = $("pauseModal");
const resumeBtn = $("resumeBtn");
const pauseMenuBtn = $("pauseMenuBtn");

const victoryModal = $("victoryModal");
const playAgainBtn = $("playAgainBtn");
const victoryMenuBtn = $("victoryMenuBtn");

const gameOverModal = $("gameOverModal");
const tryAgainBtn = $("tryAgainBtn");
const loseMenuBtn = $("loseMenuBtn");

const instructionsModal = $("instructionsModal");

const world = $("world");
const player = $("player");

const monsterContainer =
    $("monsterContainer");

const projectileContainer =
    $("projectileContainer");

const effectContainer =
    $("effectContainer");

const damageContainer =
    $("damageContainer");

const playerHpBar =
    $("playerHpBar");

const playerHpText =
    $("playerHp");

const xpBar =
    $("xpBar");

const xpText =
    $("xpText");

const levelText =
    $("level");

const coinsText =
    $("coins");

const killsText =
    $("kills");

const scoreText =
    $("score");

const gameTimerText =
    $("gameTimer");

const displayName =
    $("displayName");

const potionCountText =
    $("potionCount");

const bossPanel =
    $("bossPanel");

const bossHpBar =
    $("bossHpBar");

const bossHpText =
    $("bossHpText");

const bestScoreText =
    $("bestScore");

const newRecord =
    $("newRecord");


/* =========================
   SETTINGS
========================= */

const difficultyData = {

    easy: {
        monsterHp: 60,
        monsterDamage: 5,
        monsterSpeed: 0.7,
        spawnTime: 2200,
        maxMonsters: 5
    },

    medium: {
        monsterHp: 90,
        monsterDamage: 8,
        monsterSpeed: 1,
        spawnTime: 1800,
        maxMonsters: 7
    },

    hard: {
        monsterHp: 125,
        monsterDamage: 12,
        monsterSpeed: 1.35,
        spawnTime: 1400,
        maxMonsters: 9
    }
};

let difficulty = "easy";


/* =========================
   PLAYER
========================= */

const playerData = {

    x: 0,
    y: 0,

    speed: 4,

    maxHp: 100,
    hp: 100,

    level: 1,

    xp: 0,
    xpNeeded: 100,

    coins: 0,
    kills: 0,
    score: 0,

    potions: 3,

    attackDamage: 25,
    meleeDamage: 35,

    invincible: false
};


/* =========================
   GAME STATE
========================= */

let monsters = [];
let projectiles = [];

let boss = null;
let bossActive = false;

let gameRunning = false;
let gamePaused = false;
let gameOver = false;

let soundEnabled = true;

let timerInterval = null;
let spawnInterval = null;

let animationFrame = null;

let gameStartTime = 0;

let keys = {};

let mouseX = 0;
let mouseY = 0;


/* =========================
   AUDIO
========================= */

let audioContext = null;

function initAudio() {

    if (!soundEnabled) {
        return;
    }

    if (!audioContext) {

        try {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        } catch {
            return;
        }
    }

    if (
        audioContext.state ===
        "suspended"
    ) {
        audioContext.resume();
    }
}

function playSound(type) {

    if (!soundEnabled) {
        return;
    }

    initAudio();

    if (!audioContext) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(
        audioContext.destination
    );

    let frequency = 440;
    let duration = 0.1;

    switch (type) {

        case "shoot":
            frequency = 550;
            duration = 0.06;
            break;

        case "hit":
            frequency = 180;
            duration = 0.08;
            break;

        case "critical":
            frequency = 800;
            duration = 0.14;
            break;

        case "coin":
            frequency = 900;
            duration = 0.12;
            break;

        case "heal":
            frequency = 600;
            duration = 0.2;
            break;

        case "level":
            frequency = 1000;
            duration = 0.3;
            break;

        case "boss":
            frequency = 100;
            duration = 0.4;
            break;

        case "victory":
            frequency = 750;
            duration = 0.5;
            break;

        case "gameover":
            frequency = 100;
            duration = 0.5;
            break;
    }

    oscillator.frequency.value =
        frequency;

    oscillator.type = "sine";

    gain.gain.setValueAtTime(
        0.001,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.12,
        audioContext.currentTime + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );
}


/* =========================
   BEST SCORE
========================= */

function getBestScore() {

    return Number(
        localStorage.getItem(
            "monsterHunterBestScore"
        ) || 0
    );
}

function updateBestScore() {

    bestScoreText.textContent =
        getBestScore();
}

function saveBestScore() {

    const best =
        getBestScore();

    if (
        playerData.score > best
    ) {

        localStorage.setItem(
            "monsterHunterBestScore",
            playerData.score
        );

        newRecord.classList.remove(
            "hidden"
        );
    }
}


/* =========================
   DIFFICULTY
========================= */

document
    .querySelectorAll(".difficulty")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".difficulty"
                    )
                    .forEach((item) => {

                        item.classList.remove(
                            "active"
                        );
                    });

                button.classList.add(
                    "active"
                );

                difficulty =
                    button.dataset
                        .difficulty ||
                    "easy";
            }
        );
    });


/* =========================
   START GAME
========================= */

startBtn.addEventListener(
    "click",
    startGame
);

function startGame() {

    initAudio();

    const name =
        playerNameInput.value.trim() ||
        "Hunter";

    displayName.textContent =
        name;

    menuScreen.classList.add(
        "hidden"
    );

    gameScreen.classList.remove(
        "hidden"
    );

    resetGame();

    gameRunning = true;
    gamePaused = false;
    gameOver = false;

    startTimer();
    startSpawner();

    animationFrame =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================
   RESET
========================= */

function resetGame() {

    stopTimers();

    monsters = [];
    projectiles = [];

    boss = null;
    bossActive = false;

    monsterContainer.innerHTML = "";
    projectileContainer.innerHTML = "";
    effectContainer.innerHTML = "";
    damageContainer.innerHTML = "";

    playerData.maxHp = 100;
    playerData.hp = 100;

    playerData.level = 1;

    playerData.xp = 0;
    playerData.xpNeeded = 100;

    playerData.coins = 0;
    playerData.kills = 0;
    playerData.score = 0;

    playerData.potions = 3;

    playerData.attackDamage = 25;
    playerData.meleeDamage = 35;

    playerData.invincible = false;

    playerData.x =
        world.clientWidth / 2 - 30;

    playerData.y =
        world.clientHeight / 2 - 30;

    gameStartTime =
        Date.now();

    bossPanel.classList.add(
        "hidden"
    );

    victoryModal.classList.add(
        "hidden"
    );

    gameOverModal.classList.add(
        "hidden"
    );

    pauseModal.classList.add(
        "hidden"
    );

    newRecord.classList.add(
        "hidden"
    );

    positionPlayer();

    updateUI();
}


/* =========================
   PLAYER POSITION
========================= */

function positionPlayer() {

    const maxX =
        Math.max(
            0,
            world.clientWidth -
            player.offsetWidth
        );

    const maxY =
        Math.max(
            0,
            world.clientHeight -
            player.offsetHeight
        );

    playerData.x =
        Math.max(
            0,
            Math.min(
                playerData.x,
                maxX
            )
        );

    playerData.y =
        Math.max(
            0,
            Math.min(
                playerData.y,
                maxY
            )
        );

    player.style.left =
        `${playerData.x}px`;

    player.style.top =
        `${playerData.y}px`;
}


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
    "keydown",
    (event) => {

        keys[
            event.key.toLowerCase()
        ] = true;

        if (
            event.code === "Space" &&
            gameRunning &&
            !gamePaused
        ) {

            event.preventDefault();

            shoot();
        }

        if (
            event.key === "Escape" &&
            gameRunning &&
            !gameOver
        ) {

            togglePause();
        }
    }
);

document.addEventListener(
    "keyup",
    (event) => {

        keys[
            event.key.toLowerCase()
        ] = false;
    }
);


/* =========================
   MOUSE
========================= */

world.addEventListener(
    "mousemove",
    (event) => {

        const rect =
            world.getBoundingClientRect();

        mouseX =
            event.clientX -
            rect.left;

        mouseY =
            event.clientY -
            rect.top;
    }
);

world.addEventListener(
    "click",
    (event) => {

        if (
            event.target.closest(
                "button"
            )
        ) {
            return;
        }

        if (
            gameRunning &&
            !gamePaused &&
            !gameOver
        ) {

            shoot();
        }
    }
);


/* =========================
   MOVEMENT
========================= */

function movePlayer() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {
        dy -= playerData.speed;
    }

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {
        dy += playerData.speed;
    }

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {
        dx -= playerData.speed;
    }

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {
        dx += playerData.speed;
    }

    if (
        dx !== 0 &&
        dy !== 0
    ) {

        dx *= 0.707;
        dy *= 0.707;
    }

    playerData.x += dx;
    playerData.y += dy;

    positionPlayer();
}


/* =========================
   SPAWNER
========================= */

function startSpawner() {

    const settings =
        difficultyData[difficulty];

    spawnInterval =
        setInterval(
            () => {

                if (
                    gameRunning &&
                    !gamePaused &&
                    !gameOver
                ) {

                    spawnMonster();
                }

            },
            settings.spawnTime
        );

    spawnMonster();
    spawnMonster();
}


/* =========================
   SPAWN MONSTER
========================= */

function spawnMonster() {

    if (
        monsters.length >=
        difficultyData[difficulty]
            .maxMonsters
    ) {
        return;
    }

    const settings =
        difficultyData[difficulty];

    const types = [

        {
            emoji: "👹",
            name: "Goblin",
            hp: 1,
            speed: 1,
            reward: 15
        },

        {
            emoji: "👺",
            name: "Demon",
            hp: 1.35,
            speed: 0.85,
            reward: 25
        },

        {
            emoji: "👻",
            name: "Ghost",
            hp: 0.75,
            speed: 1.5,
            reward: 20
        },

        {
            emoji: "🧟",
            name: "Zombie",
            hp: 1.5,
            speed: 0.7,
            reward: 30
        }
    ];

    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];

    const monster = {

        id:
            Date.now() +
            Math.random(),

        x: 0,
        y: 0,

        hp:
            settings.monsterHp *
            type.hp,

        maxHp:
            settings.monsterHp *
            type.hp,

        damage:
            settings.monsterDamage,

        speed:
            settings.monsterSpeed *
            type.speed,

        reward:
            type.reward,

        emoji:
            type.emoji,

        name:
            type.name,

        attackCooldown: 0,

        element: null,
        healthFill: null
    };

    const margin = 30;

    const side =
        Math.floor(
            Math.random() * 4
        );

    if (side === 0) {

        monster.x = margin;

        monster.y =
            Math.random() *
            Math.max(
                100,
                world.clientHeight -
                150
            );
    }

    if (side === 1) {

        monster.x =
            world.clientWidth -
            100;

        monster.y =
            Math.random() *
            Math.max(
                100,
                world.clientHeight -
                150
            );
    }

    if (side === 2) {

        monster.x =
            Math.random() *
            Math.max(
                100,
                world.clientWidth -
                120
            );

        monster.y = margin;
    }

    if (side === 3) {

        monster.x =
            Math.random() *
            Math.max(
                100,
                world.clientWidth -
                120
            );

        monster.y =
            world.clientHeight -
            140;
    }

    createMonsterElement(
        monster
    );

    monsters.push(monster);

    updateUI();
}


/* =========================
   MONSTER ELEMENT
========================= */

function createMonsterElement(
    monster
) {

    const element =
        document.createElement("div");

    element.className =
        "monster";

    element.textContent =
        monster.emoji;

    element.title =
        monster.name;

    const health =
        document.createElement("div");

    health.className =
        "monster-health";

    const fill =
        document.createElement("div");

    fill.className =
        "monster-health-fill";

    health.appendChild(fill);

    element.appendChild(health);

    monsterContainer.appendChild(
        element
    );

    monster.element =
        element;

    monster.healthFill =
        fill;

    updateMonster(
        monster
    );
}


/* =========================
   MONSTER UPDATE
========================= */

function updateMonster(
    monster
) {

    if (!monster.element) {
        return;
    }

    monster.element.style.left =
        `${monster.x}px`;

    monster.element.style.top =
        `${monster.y}px`;

    const percent =
        Math.max(
            0,
            monster.hp /
            monster.maxHp *
            100
        );

    monster.healthFill.style.width =
        `${percent}%`;
}


/* =========================
   MONSTER AI
========================= */

function updateMonsters() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }

    const pc =
        getPlayerCenter();

    monsters.forEach(
        (monster) => {

            if (
                monster.hp <= 0
            ) {
                return;
            }

            const mc = {

                x:
                    monster.x +
                    35,

                y:
                    monster.y +
                    35
            };

            const dx =
                pc.x - mc.x;

            const dy =
                pc.y - mc.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (
                distance > 55
            ) {

                monster.x +=
                    (
                        dx /
                        distance
                    ) *
                    monster.speed;

                monster.y +=
                    (
                        dy /
                        distance
                    ) *
                    monster.speed;

            } else {

                if (
                    monster.attackCooldown <=
                    0
                ) {

                    damagePlayer(
                        monster.damage
                    );

                    monster.attackCooldown =
                        55;
                }
            }

            if (
                monster.attackCooldown > 0
            ) {

                monster.attackCooldown--;
            }

            keepMonsterInside(
                monster
            );

            updateMonster(
                monster
            );
        }
    );
}


/* =========================
   MONSTER BOUNDS
========================= */

function keepMonsterInside(
    monster
) {

    monster.x =
        Math.max(
            5,
            Math.min(
                monster.x,
                world.clientWidth -
                75
            )
        );

    monster.y =
        Math.max(
            5,
            Math.min(
                monster.y,
                world.clientHeight -
                80
            )
        );
}


/* =========================
   PLAYER CENTER
========================= */

function getPlayerCenter() {

    return {

        x:
            playerData.x +
            player.offsetWidth / 2,

        y:
            playerData.y +
            player.offsetHeight / 2
    };
}


/* =========================
   SHOOT
========================= */

attackBtn.addEventListener(
    "click",
    shoot
);

function shoot() {

    if (
        !gameRunning ||
        gamePaused ||
        gameOver
    ) {
        return;
    }

    playSound("shoot");

    const start =
        getPlayerCenter();

    const target =
        findNearestTarget();

    let targetX;
    let targetY;

    if (target) {

        targetX =
            target.x +
            35;

        targetY =
            target.y +
            35;

    } else {

        targetX =
            mouseX ||
            start.x + 200;

        targetY =
            mouseY ||
            start.y;
    }

    createProjectile(
        start.x,
        start.y,
        targetX,
        targetY,
        target
    );
}


/* =========================
   FIND TARGET
========================= */

function findNearestTarget() {

    let nearest = null;

    let distanceBest =
        Infinity;

    const pc =
        getPlayerCenter();

    monsters.forEach(
        (monster) => {

            if (
                monster.hp <= 0
            ) {
                return;
            }

            const dx =
                monster.x - pc.x;

            const dy =
                monster.y - pc.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (
                distance <
                distanceBest
            ) {

                distanceBest =
                    distance;

                nearest =
                    monster;
            }
        }
    );

    if (
        boss &&
        bossActive
    ) {

        const dx =
            boss.x + 45 -
            pc.x;

        const dy =
            boss.y + 45 -
            pc.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (
            distance <
            distanceBest
        ) {

            nearest =
                boss;
        }
    }

    return nearest;
}


/* =========================
   PROJECTILE
========================= */

function createProjectile(
    startX,
    startY,
    targetX,
    targetY,
    target
) {

    const arrow =
        document.createElement("div");

    arrow.className =
        "projectile";

    projectileContainer.appendChild(
        arrow
    );

    const dx =
        targetX - startX;

    const dy =
        targetY - startY;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    const angle =
        Math.atan2(
            dy,
            dx
        );

    arrow.style.left =
        `${startX}px`;

    arrow.style.top =
        `${startY}px`;

    arrow.style.transform =
        `rotate(${angle}rad)`;

    projectiles.push({

        element:
            arrow,

        x:
            startX,

        y:
            startY,

        vx:
            (dx / distance) * 10,

        vy:
            (dy / distance) * 10,

        target:
            target,

        life: 100
    });
}


/* =========================
   PROJECTILES
========================= */

function updateProjectiles() {

    if (
        !gameRunning ||
        gamePaused
    ) {
        return;
    }

    projectiles =
        projectiles.filter(
            (projectile) => {

                projectile.x +=
                    projectile.vx;

                projectile.y +=
                    projectile.vy;

                projectile.life--;

                projectile.element.style.left =
                    `${projectile.x}px`;

                projectile.element.style.top =
                    `${projectile.y}px`;


                /* ===== BOSS HIT ===== */

                if (
                    boss &&
                    bossActive &&
                    boss.hp > 0
                ) {

                    const dx =
                        projectile.x -
                        (boss.x + 45);

                    const dy =
                        projectile.y -
                        (boss.y + 45);

                    const distance =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );

                    if (
                        distance < 55
                    ) {

                        damageBoss(
                            playerData.attackDamage
                        );

                        projectile.element.remove();

                        return false;
                    }
                }


                /* ===== MONSTER HIT ===== */

                const target =
                    projectile.target;

                if (
                    target &&
                    target.hp > 0 &&
                    target !== boss
                ) {

                    const dx =
                        projectile.x -
                        (target.x + 35);

                    const dy =
                        projectile.y -
                        (target.y + 35);

                    const distance =
                        Math.sqrt(
                            dx * dx +
                            dy * dy
                        );

                    if (
                        distance < 40
                    ) {

                        damageMonster(
                            target,
                            playerData.attackDamage
                        );

                        projectile.element.remove();

                        return false;
                    }
                }


                /* ===== OUT OF WORLD ===== */

                if (
                    projectile.life <= 0 ||
                    projectile.x < -50 ||
                    projectile.y < -50 ||
                    projectile.x >
                        world.clientWidth + 50 ||
                    projectile.y >
                        world.clientHeight + 50
                ) {

                    projectile.element.remove();

                    return false;
                }

                return true;
            }
        );
}


/* =========================
   MELEE
========================= */

meleeBtn.addEventListener(
    "click",
    meleeAttack
);

function meleeAttack() {

    if (
        !gameRunning ||
        gamePaused ||
        gameOver
    ) {
        return;
    }

    playSound("hit");

    const pc =
        getPlayerCenter();

    let hit = false;


    /* ===== BOSS ===== */

    if (
        boss &&
        bossActive &&
        boss.hp > 0
    ) {

        const dx =
            boss.x + 45 - pc.x;

        const dy =
            boss.y + 45 - pc.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (
            distance < 130
        ) {

            damageBoss(
                playerData.meleeDamage
            );

            hit = true;
        }
    }


    /* ===== MONSTERS ===== */

    monsters.forEach(
        (monster) => {

            if (
                monster.hp <= 0
            ) {
                return;
            }

            const dx =
                monster.x + 35 - pc.x;

            const dy =
                monster.y + 35 - pc.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (
                distance < 110
            ) {

                damageMonster(
                    monster,
                    playerData.meleeDamage
                );

                hit = true;
            }
        }
    );


    createHitEffect(
        pc.x,
        pc.y
    );

    if (!hit) {

        showDamageText(
            pc.x,
            pc.y - 30,
            "MISS"
        );
    }
}


/* =========================
   MONSTER DAMAGE
========================= */

function damageMonster(
    monster,
    damage
) {

    if (
        !monster ||
        monster.hp <= 0
    ) {
        return;
    }

    let finalDamage =
        damage;

    const critical =
        Math.random() < 0.18;

    if (critical) {
        finalDamage *= 2;
    }

    finalDamage =
        Math.round(
            finalDamage
        );

    monster.hp -=
        finalDamage;

    showDamageText(
        monster.x + 25,
        monster.y,
        critical
            ? `CRITICAL! -${finalDamage}`
            : `-${finalDamage}`,
        critical
    );

    createHitEffect(
        monster.x + 35,
        monster.y + 35
    );

    if (critical) {
        playSound("critical");
    }

    monster.element.classList.add(
        "monster-hit"
    );

    setTimeout(
        () => {

            if (
                monster.element
            ) {

                monster.element.classList.remove(
                    "monster-hit"
                );
            }

        },
        200
    );

    updateMonster(
        monster
    );

    if (
        monster.hp <= 0
    ) {

        killMonster(
            monster
        );
    }
}


/* =========================
   KILL MONSTER
========================= */

function killMonster(
    monster
) {

    playerData.kills++;

    playerData.coins +=
        monster.reward;

    playerData.score +=
        monster.reward * 10;

    gainXP(
        30 +
        monster.reward
    );

    playSound("coin");

    createHitEffect(
        monster.x + 35,
        monster.y + 35
    );

    if (monster.element) {
        monster.element.remove();
    }

    monsters =
        monsters.filter(
            (item) =>
                item.id !== monster.id
        );

    checkBossSpawn();

    updateUI();
}


/* =========================
   XP
========================= */

function gainXP(
    amount
) {

    playerData.xp +=
        amount;

    while (
        playerData.xp >=
        playerData.xpNeeded
    ) {

        playerData.xp -=
            playerData.xpNeeded;

        playerData.level++;

        playerData.xpNeeded =
            Math.round(
                playerData.xpNeeded *
                1.35
            );

        playerData.maxHp +=
            10;

        playerData.hp =
            playerData.maxHp;

        playerData.attackDamage +=
            5;

        playerData.meleeDamage +=
            7;

        playSound("level");

        showDamageText(
            playerData.x,
            playerData.y - 30,
            `LEVEL ${playerData.level}!`
        );
    }

    updateUI();
}


/* =========================
   PLAYER DAMAGE
========================= */

function damagePlayer(
    amount
) {

    if (
        playerData.invincible ||
        gameOver
    ) {
        return;
    }

    playerData.hp -=
        amount;

    playerData.hp =
        Math.max(
            0,
            playerData.hp
        );

    playerData.invincible =
        true;

    player.style.filter =
        "brightness(2)";

    setTimeout(
        () => {

            playerData.invincible =
                false;

            player.style.filter = "";

        },
        400
    );

    showDamageText(
        playerData.x,
        playerData.y,
        `-${amount}`
    );

    updateUI();

    if (
        playerData.hp <= 0
    ) {

        endGame(false);
    }
}


/* =========================
   POTION
========================= */

potionBtn.addEventListener(
    "click",
    usePotion
);

function usePotion() {

    if (
        !gameRunning ||
        gamePaused ||
        gameOver
    ) {
        return;
    }

    if (
        playerData.potions <= 0
    ) {

        showDamageText(
            playerData.x,
            playerData.y - 25,
            "NO POTION"
        );

        return;
    }

    if (
        playerData.hp >=
        playerData.maxHp
    ) {

        showDamageText(
            playerData.x,
            playerData.y - 25,
            "HP FULL"
        );

        return;
    }

    playerData.potions--;

    const heal =
        Math.round(
            playerData.maxHp *
            0.4
        );

    playerData.hp =
        Math.min(
            playerData.maxHp,
            playerData.hp + heal
        );

    playSound("heal");

    showDamageText(
        playerData.x,
        playerData.y - 25,
        `+${heal} HP`
    );

    updateUI();
}


/* =========================
   BOSS SPAWN
========================= */

function checkBossSpawn() {

    if (bossActive) {
        return;
    }

    if (
        playerData.kills > 0 &&
        playerData.kills % 10 === 0
    ) {

        spawnBoss();
    }
}

function spawnBoss() {

    bossActive = true;

    playSound("boss");

    const bossHp =
        800 +
        playerData.level * 120;

    boss = {

        x:
            world.clientWidth / 2 -
            50,

        y: 80,

        hp:
            bossHp,

        maxHp:
            bossHp,

        damage:
            18 +
            playerData.level * 3,

        speed:
            0.55,

        attackCooldown:
            60,

        element: null
    };

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "monster boss-monster";

    element.textContent =
        "🐉";

    monsterContainer.appendChild(
        element
    );

    boss.element =
        element;

    bossPanel.classList.remove(
        "hidden"
    );

    updateBoss();

    showDamageText(
        world.clientWidth / 2,
        110,
        "👹 BOSS PAYDO BO'LDI!"
    );
}


/* =========================
   BOSS UPDATE
========================= */

function updateBoss() {

    if (!boss) {
        return;
    }

    if (boss.element) {

        boss.element.style.left =
            `${boss.x}px`;

        boss.element.style.top =
            `${boss.y}px`;
    }

    const percent =
        Math.max(
            0,
            boss.hp /
            boss.maxHp *
            100
        );

    bossHpBar.style.width =
        `${percent}%`;

    bossHpText.textContent =
        `${Math.max(
            0,
            Math.round(
                boss.hp
            )
        )} / ${boss.maxHp}`;
}


/* =========================
   BOSS AI
========================= */

function updateBossAI() {

    if (
        !boss ||
        !bossActive ||
        gamePaused
    ) {
        return;
    }

    const pc =
        getPlayerCenter();

    const dx =
        pc.x -
        (boss.x + 45);

    const dy =
        pc.y -
        (boss.y + 45);

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        ) || 1;

    if (
        distance > 100
    ) {

        boss.x +=
            (dx / distance) *
            boss.speed;

        boss.y +=
            (dy / distance) *
            boss.speed;

    } else {

        if (
            boss.attackCooldown <=
            0
        ) {

            damagePlayer(
                boss.damage
            );

            boss.attackCooldown =
                60;
        }
    }

    if (
        boss.attackCooldown > 0
    ) {

        boss.attackCooldown--;
    }

    boss.x =
        Math.max(
            5,
            Math.min(
                boss.x,
                world.clientWidth -
                105
            )
        );

    boss.y =
        Math.max(
            50,
            Math.min(
                boss.y,
                world.clientHeight -
                120
            )
        );

    updateBoss();
}


/* =========================
   BOSS DAMAGE
========================= */

function damageBoss(
    amount
) {

    if (
        !boss ||
        !bossActive ||
        boss.hp <= 0
    ) {
        return;
    }

    let damage =
        amount;

    const critical =
        Math.random() < 0.2;

    if (critical) {
        damage *= 2;
    }

    damage =
        Math.round(
            damage
        );

    boss.hp -=
        damage;

    showDamageText(
        boss.x + 35,
        boss.y,
        critical
            ? `CRITICAL! -${damage}`
            : `-${damage}`,
        critical
    );

    createHitEffect(
        boss.x + 45,
        boss.y + 45
    );

    updateBoss();

    if (
        boss.hp <= 0
    ) {

        defeatBoss();
    }
}


/* =========================
   BOSS DEFEATED
========================= */

function defeatBoss() {

    if (!boss) {
        return;
    }

    playerData.score +=
        1000;

    playerData.coins +=
        500;

    gainXP(500);

    createHitEffect(
        boss.x + 45,
        boss.y + 45
    );

    showDamageText(
        boss.x,
        boss.y,
        "BOSS MAG'LUB!"
    );

    if (boss.element) {
        boss.element.remove();
    }

    boss = null;

    bossActive = false;

    bossPanel.classList.add(
        "hidden"
    );

    updateUI();

    setTimeout(
        () => {

            endGame(true);

        },
        1000
    );
}


/* =========================
   EFFECT
========================= */

function createHitEffect(
    x,
    y
) {

    const effect =
        document.createElement(
            "div"
        );

    effect.className =
        "hit-effect";

    effect.style.left =
        `${x - 32}px`;

    effect.style.top =
        `${y - 32}px`;

    effectContainer.appendChild(
        effect
    );

    setTimeout(
        () => {

            effect.remove();

        },
        450
    );
}


/* =========================
   DAMAGE TEXT
========================= */

function showDamageText(
    x,
    y,
    text,
    critical = false
) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "damage-number";

    if (critical) {

        element.classList.add(
            "critical"
        );
    }

    element.textContent =
        text;

    element.style.left =
        `${x}px`;

    element.style.top =
        `${y}px`;

    damageContainer.appendChild(
        element
    );

    setTimeout(
        () => {

            element.remove();

        },
        850
    );
}


/* =========================
   UI
========================= */

function updateUI() {

    const hpPercent =
        Math.max(
            0,
            playerData.hp /
            playerData.maxHp *
            100
        );

    playerHpBar.style.width =
        `${hpPercent}%`;

    playerHpText.textContent =
        `${Math.round(
            playerData.hp
        )} / ${playerData.maxHp}`;

    const xpPercent =
        Math.max(
            0,
            playerData.xp /
            playerData.xpNeeded *
            100
        );

    xpBar.style.width =
        `${xpPercent}%`;

    xpText.textContent =
        `${playerData.xp} / ${playerData.xpNeeded}`;

    levelText.textContent =
        playerData.level;

    coinsText.textContent =
        playerData.coins;

    killsText.textContent =
        playerData.kills;

    scoreText.textContent =
        playerData.score;

    potionCountText.textContent =
        playerData.potions;

    updateBestScore();
}


/* =========================
   TIMER
========================= */

function startTimer() {

    clearInterval(
        timerInterval
    );

    gameStartTime =
        Date.now();

    timerInterval =
        setInterval(
            () => {

                if (
                    !gameRunning ||
                    gamePaused
                ) {
                    return;
                }

                const elapsed =
                    Math.floor(
                        (
                            Date.now() -
                            gameStartTime
                        ) / 1000
                    );

                const minutes =
                    Math.floor(
                        elapsed / 60
                    );

                const seconds =
                    elapsed % 60;

                gameTimerText.textContent =
                    `${String(
                        minutes
                    ).padStart(
                        2,
                        "0"
                    )}:${String(
                        seconds
                    ).padStart(
                        2,
                        "0"
                    )}`;

            },
            1000
        );
}


/* =========================
   PAUSE
========================= */

pauseBtn.addEventListener(
    "click",
    togglePause
);

resumeBtn.addEventListener(
    "click",
    () => {

        gamePaused = false;

        pauseModal.classList.add(
            "hidden"
        );
    }
);

function togglePause() {

    if (
        !gameRunning ||
        gameOver
    ) {
        return;
    }

    gamePaused =
        !gamePaused;

    if (gamePaused) {

        pauseModal.classList.remove(
            "hidden"
        );

    } else {

        pauseModal.classList.add(
            "hidden"
        );
    }
}


/* =========================
   RESTART
========================= */

restartBtn.addEventListener(
    "click",
    () => {

        startGame();
    }
);

playAgainBtn.addEventListener(
    "click",
    () => {

        victoryModal.classList.add(
            "hidden"
        );

        startGame();
    }
);

tryAgainBtn.addEventListener(
    "click",
    () => {

        gameOverModal.classList.add(
            "hidden"
        );

        startGame();
    }
);


/* =========================
   MENU
========================= */

function returnToMenu() {

    gameRunning = false;
    gamePaused = false;

    stopTimers();

    if (animationFrame) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;
    }

    pauseModal.classList.add(
        "hidden"
    );

    victoryModal.classList.add(
        "hidden"
    );

    gameOverModal.classList.add(
        "hidden"
    );

    gameScreen.classList.add(
        "hidden"
    );

    menuScreen.classList.remove(
        "hidden"
    );

    updateBestScore();
}

pauseMenuBtn.addEventListener(
    "click",
    returnToMenu
);

victoryMenuBtn.addEventListener(
    "click",
    returnToMenu
);

loseMenuBtn.addEventListener(
    "click",
    returnToMenu
);


/* =========================
   INSTRUCTIONS
========================= */

instructionsBtn.addEventListener(
    "click",
    () => {

        instructionsModal.classList.remove(
            "hidden"
        );
    }
);

closeInstructionsBtn.addEventListener(
    "click",
    () => {

        instructionsModal.classList.add(
            "hidden"
        );
    }
);


/* =========================
   SOUND
========================= */

soundBtn.addEventListener(
    "click",
    () => {

        soundEnabled =
            !soundEnabled;

        soundBtn.textContent =
            soundEnabled
                ? "🔊"
                : "🔇";

        if (soundEnabled) {
            initAudio();
        }
    }
);


/* =========================
   END GAME
========================= */

function endGame(
    victory
) {

    if (gameOver) {
        return;
    }

    gameOver = true;
    gameRunning = false;

    stopTimers();

    saveBestScore();

    if (victory) {

        playSound("victory");

        $("victoryKills").textContent =
            playerData.kills;

        $("victoryCoins").textContent =
            playerData.coins;

        $("victoryXp").textContent =
            playerData.xp;

        $("victoryScore").textContent =
            playerData.score;

        victoryModal.classList.remove(
            "hidden"
        );

    } else {

        playSound("gameover");

        $("loseKills").textContent =
            playerData.kills;

        $("loseCoins").textContent =
            playerData.coins;

        $("loseLevel").textContent =
            playerData.level;

        $("loseScore").textContent =
            playerData.score;

        gameOverModal.classList.remove(
            "hidden"
        );
    }
}


/* =========================
   STOP TIMERS
========================= */

function stopTimers() {

    clearInterval(
        timerInterval
    );

    clearInterval(
        spawnInterval
    );

    timerInterval = null;
    spawnInterval = null;
}


/* =========================
   GAME LOOP
========================= */

function gameLoop() {

    if (
        gameRunning &&
        !gamePaused &&
        !gameOver
    ) {

        movePlayer();

        updateMonsters();

        updateProjectiles();

        updateBossAI();

        updateUI();
    }

    animationFrame =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================
   RESIZE
========================= */

window.addEventListener(
    "resize",
    () => {

        if (!gameRunning) {
            return;
        }

        positionPlayer();

        monsters.forEach(
            (monster) => {

                keepMonsterInside(
                    monster
                );

                updateMonster(
                    monster
                );
            }
        );

        updateBoss();
    }
);


/* =========================
   MOBILE SWIPE
========================= */

let touchStartX = 0;
let touchStartY = 0;

world.addEventListener(
    "touchstart",
    (event) => {

        const touch =
            event.touches[0];

        touchStartX =
            touch.clientX;

        touchStartY =
            touch.clientY;
    },
    {
        passive: true
    }
);

world.addEventListener(
    "touchend",
    (event) => {

        if (
            !gameRunning ||
            gamePaused
        ) {
            return;
        }

        const touch =
            event.changedTouches[0];

        const dx =
            touch.clientX -
            touchStartX;

        const dy =
            touch.clientY -
            touchStartY;

        const minSwipe = 30;

        if (
            Math.abs(dx) <
                minSwipe &&
            Math.abs(dy) <
                minSwipe
        ) {

            shoot();

            return;
        }

        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            playerData.x +=
                dx > 0
                    ? 70
                    : -70;

        } else {

            playerData.y +=
                dy > 0
                    ? 70
                    : -70;
        }

        positionPlayer();
    },
    {
        passive: true
    }
);


/* =========================
   INITIAL
========================= */

updateBestScore();

console.log(
    "🏹 Monster Hunter loaded — ULUG'BEK.R"
);


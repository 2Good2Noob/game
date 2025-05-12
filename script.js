// Główny skrypt gry Panda Jump
$(document).ready(function() {
    // Elementy DOM
    const startScreen = $("#start-screen");
    const gameScreen = $("#game-screen");
    const endScreen = $("#end-screen");
    const startButton = $("#start-button");
    const restartButton = $("#restart-button");
    const scoreElement = $("#score");
    const finalScoreElement = $("#final-score");
    const bestScoreElement = $("#best-score");
    const endBestScoreElement = $("#end-best-score");
    const currentKeyElement = $("#current-key");
    
    // Canvas i kontekst
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");
    
    // Wczytywanie obrazów
    const pandaImg1 = new Image();
    const pandaImg2 = new Image();
    const bambooImg = new Image();
    const backgroundImg = new Image();
    
    pandaImg1.src = 'images/dino1.png';
    pandaImg2.src = 'images/dino2.png';
    bambooImg.src = 'images/bamboo.png';
    backgroundImg.src = 'images/background.png';
    
    // Wczytywanie dźwięków
    const jumpSound = new Audio('sounds/jump.mp3');
    const backgroundMusic = new Audio('sounds/background.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    
    // Zmienne gry
    let gameLoopId;
    let score = 0;
    let bestScore = localStorage.getItem('pandaJumpBestScore') || 0;
    let isGameOver = false;
    let jumpKey = "a"; // Domyślny klawisz to 'a'
    let jumpKeyDisplay = "A";
    let bamboos = [];
    let frameCount = 0;
    let animationFrame = 0;
    
    // Stałe konfiguracyjne
    const GAME_SPEED = 5;
    const BAMBOO_GAP = 200;
    const GRAVITY = 0.6;
    const JUMP_FORCE = -12;
    const PANDA_WIDTH = 60;
    const PANDA_HEIGHT = 60;
    const BAMBOO_WIDTH = 50;
    const BAMBOO_GAP_MIN = 150;
    const BAMBOO_GAP_MAX = 250;
    const KEY_CHANGE_TIME = 600; // Zmiana klawisza co około 10 sekund (60 klatek/s * 10s)
    
    // Obiekt pandy
    const panda = {
        x: 100,
        y: canvas.height - 150,
        width: PANDA_WIDTH,
        height: PANDA_HEIGHT,
        velocity: 0,
        jumping: false,
        update: function() {
            // Grawitacja
            this.velocity += GRAVITY;
            this.y += this.velocity;
            
            // Zatrzymaj na podłożu
            if (this.y > canvas.height - this.height - 50) {
                this.y = canvas.height - this.height - 50;
                this.velocity = 0;
                this.jumping = false;
            }
        },
        jump: function() {
            if (!this.jumping) {
                this.velocity = JUMP_FORCE;
                this.jumping = true;
                jumpSound.currentTime = 0;
                jumpSound.play();
            }
        },
        draw: function() {
            // Animacja pandy - przełączanie między dwoma klatkami
            const currentImg = frameCount % 20 < 10 ? pandaImg1 : pandaImg2;
            ctx.drawImage(currentImg, this.x, this.y, this.width, this.height);
        },
        reset: function() {
            this.y = canvas.height - this.height - 50;
            this.velocity = 0;
            this.jumping = false;
        }
    };
    
    // Funkcja do tworzenia bambusów
function createBamboo() {
    // Bambus o stałej wysokości, stojący na ziemi (jak na obrazku)
    bamboos.push({
        x: canvas.width,
        y: canvas.height - 110, // Ta sama wysokość bambusa co na referencyjnym obrazku
        width: BAMBOO_WIDTH,
        height: 60, // Stała wysokość bambusa
        passed: false,
        draw: function() {
            // Rysuj bambus
            ctx.drawImage(
                bambooImg, 
                this.x, 
                this.y, 
                this.width, 
                this.height
            );
        }
    });
}
    
    // Funkcja do losowania nowego klawisza
    function getRandomKey() {
        const keys = [
            { code: " ", display: "SPACJA" },
            { code: "ArrowUp", display: "↑" },
            { code: "w", display: "W" },
            { code: "z", display: "Z" }
        ];
        return keys[Math.floor(Math.random() * keys.length)];
    }
    
    // Funkcja sprawdzania kolizji
function checkCollision(panda, bamboo) {
    // Sprawdź kolizję z bambusem (prostokąt z prostokątem)
    if (
        panda.x + panda.width > bamboo.x &&
        panda.x < bamboo.x + bamboo.width &&
        panda.y + panda.height > bamboo.y &&
        panda.y < bamboo.y + bamboo.height
    ) {
        return true;
    }
    
    return false;
}
    
    // Funkcja do rysowania tła
    function drawBackground() {
        // Najpierw wypełnij niebo
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Potem narysuj obrazek tła
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    }
    
    // Funkcja do rysowania podłoża
    function drawGround() {
        ctx.fillStyle = "#8B4513"; // Kolor brązowy dla ziemi
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        // Trawa na wierzchu
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(0, canvas.height - 50, canvas.width, 10);
    }
    
    // Główna pętla gry
    function gameLoop() {
        // Czyszczenie canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Rysowanie tła i podłoża
        drawBackground();
        drawGround();
        
        // Aktualizacja i rysowanie pandy
        panda.update();
        panda.draw();
        
        // Aktualizacja i rysowanie bambusów
        for (let i = 0; i < bamboos.length; i++) {
            bamboos[i].x -= GAME_SPEED;
            bamboos[i].draw();
            
            // Sprawdzanie kolizji
            if (checkCollision(panda, bamboos[i])) {
                gameOver();
                return;
            }
            
            // Dodawanie punktów za przejście przez bambus
            if (!bamboos[i].passed && bamboos[i].x + BAMBOO_WIDTH < panda.x) {
                bamboos[i].passed = true;
                score++;
                scoreElement.text(score);
            }
            
            // Usuwanie bambusów, które wyszły poza ekran
            if (bamboos[i].x + BAMBOO_WIDTH < 0) {
                bamboos.splice(i, 1);
                i--;
            }
        }
        
        // Dodawanie nowych bambusów
        if (frameCount % 120 === 0) {
            createBamboo();
        }
        
        // Zmiana klawisza co określony czas
        if (frameCount % KEY_CHANGE_TIME === 0 && frameCount > 0) {
            changeJumpKey();
        }
        
        // Aktualizacja licznika klatek
        frameCount++;
        
        // Wywołanie następnej klatki animacji
        if (!isGameOver) {
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Funkcja kończąca grę
    function gameOver() {
        isGameOver = true;
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        
        // Aktualizacja najlepszego wyniku
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('pandaJumpBestScore', bestScore);
        }
        
        // Wyświetlenie ekranu końcowego
        finalScoreElement.text(score);
        endBestScoreElement.text(bestScore);
        gameScreen.addClass("hidden");
        endScreen.removeClass("hidden");
    }
    
    // Funkcja zmieniająca klawisz skoku
    function changeJumpKey() {
        const newKey = getRandomKey();
        jumpKey = newKey.code;
        jumpKeyDisplay = newKey.display;
        currentKeyElement.text(jumpKeyDisplay);
        
        // Animacja zmiany klawisza
        currentKeyElement.css('font-size', '24px');
        setTimeout(() => {
            currentKeyElement.css('font-size', '16px');
        }, 300);
    }
    
    // Obsługa klawiszy
    $(document).keydown(function(e) {
        if (e.key.toLowerCase() === jumpKey) {
            if (!isGameOver && !gameScreen.hasClass("hidden")) {
                panda.jump();
            }
        }
    });
    
    // Inicjalizacja gry
    function initGame() {
        // Resetowanie zmiennych
        score = 0;
        isGameOver = false;
        frameCount = 0;
        bamboos = [];
        panda.reset();
        
        // Wyświetlanie aktualnego wyniku i najlepszego wyniku
        scoreElement.text(score);
        bestScoreElement.text(bestScore);
        
        // Losowanie początkowego klawisza
        changeJumpKey();
        
        // Uruchomienie muzyki
        backgroundMusic.play();
        
        // Uruchomienie pętli gry
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // Obsługa przycisków
    startButton.click(function() {
        startScreen.addClass("hidden");
        gameScreen.removeClass("hidden");
        initGame();
    });
    
    restartButton.click(function() {
        endScreen.addClass("hidden");
        gameScreen.removeClass("hidden");
        initGame();
    });
    
    // Wyświetlenie najlepszego wyniku na ekranie startowym
    bestScoreElement.text(bestScore);
});
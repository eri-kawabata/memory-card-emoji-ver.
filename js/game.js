const DIFFICULTY_SETTINGS = {
    easy: { pairs: 6, timeLimit: 60 },
    medium: { pairs: 8, timeLimit: 90 },
    hard: { pairs: 12, timeLimit: 120 }
};

const EMOJIS = ['🌸', '🍜', '🗼', '🎎', '🎌', '🍱', '🐠', '🗻', '🎭', '🍵', '⛩️', '🏯'];

class MemoryGame {
    constructor() {
        this.cards = [];
        this.flipped = [];
        this.solved = [];
        this.moves = 0;
        this.timeRemaining = 60;
        this.gameStarted = false;
        this.isGameOver = false;
        this.soundEnabled = true;
        this.timer = null;

        // DOM 要素の取得
        this.gameBoard = document.getElementById('game-board');
        this.timeDisplay = document.getElementById('time-remaining');
        this.movesDisplay = document.getElementById('moves-count');
        this.difficultySelect = document.getElementById('difficulty');
        this.soundToggle = document.getElementById('sound-toggle');
        this.resetButton = document.getElementById('reset-button');
        this.scoreBoard = document.getElementById('score-board');
        this.startMessage = document.getElementById('start-message');

        // 音声要素の取得
        this.flipSound = document.getElementById('flip-sound');
        this.matchSound = document.getElementById('match-sound');
        this.victorySound = document.getElementById('victory-sound');
        this.gameoverSound = document.getElementById('gameover-sound');

        this.initializeEventListeners();
        this.loadHighScores();
    }

    // イベントリスナーの設定
    initializeEventListeners() {
        this.resetButton.addEventListener('click', () => this.initializeGame());
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.difficultySelect.addEventListener('change', () => {
            this.gameStarted = false;
            this.startMessage.classList.remove('hidden');
        });
    }

    // ゲームの初期化
    initializeGame() {
        const difficulty = this.difficultySelect.value;
        const settings = DIFFICULTY_SETTINGS[difficulty];

        this.cards = [];
        this.flipped = [];
        this.solved = [];
        this.moves = 0;
        this.timeRemaining = settings.timeLimit;
        this.isGameOver = false;
        this.gameStarted = true;

        this.updateDisplay();
        this.createCards(settings.pairs);
        this.startTimer();

        this.startMessage.classList.add('hidden');
        this.scoreBoard.classList.add('hidden');
        this.gameBoard.className = `game-board ${difficulty}`;
    }

    // カードの生成
    createCards(pairs) {
        const selectedEmojis = EMOJIS.slice(0, pairs);
        const cardPairs = [...selectedEmojis, ...selectedEmojis].sort(() => Math.random() - 0.5);

        this.gameBoard.innerHTML = '';
        cardPairs.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.index = index;
            card.dataset.emoji = emoji;
            card.addEventListener('click', () => this.handleCardClick(index));
            this.gameBoard.appendChild(card);
            this.cards.push({ index, emoji });
        });
    }

    // カードをクリックしたときの処理
    handleCardClick(index) {
        if (
            !this.gameStarted ||
            this.flipped.length === 2 ||
            this.flipped.includes(index) ||
            this.solved.includes(index) ||
            this.isGameOver
        ) {
            return;
        }

        this.playSound(this.flipSound);
        this.flipped.push(index);
        this.moves++;
        this.updateDisplay();

        const card = this.gameBoard.children[index];
        card.textContent = card.dataset.emoji;
        card.classList.add('flipped');

        if (this.flipped.length === 2) {
            this.checkMatch();
        }
    }

    // カードが一致するか確認
    checkMatch() {
        const [first, second] = this.flipped;
        const firstCard = this.cards[first];
        const secondCard = this.cards[second];

        if (firstCard.emoji === secondCard.emoji) {
            this.playSound(this.matchSound);
            this.solved.push(...this.flipped);

            if (this.solved.length === this.cards.length) {
                this.handleGameWin();
            }
        }

        setTimeout(() => {
            this.flipped.forEach(index => {
                if (!this.solved.includes(index)) {
                    const card = this.gameBoard.children[index];
                    card.textContent = '';
                    card.classList.remove('flipped');
                }
            });
            this.flipped = [];
        }, 1000);
    }

    // タイマーのスタート
    startTimer() {
        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();

            if (this.timeRemaining <= 0) {
                this.handleGameOver();
            }
        }, 1000);
    }

    // 勝利時の処理
    handleGameWin() {
        this.isGameOver = true;
        clearInterval(this.timer);
        this.playSound(this.victorySound);

        const score = this.calculateScore();
        this.updateHighScores(score);
        this.showScoreBoard(true);
    }

    // ゲームオーバー時の処理
    handleGameOver() {
        this.isGameOver = true;
        clearInterval(this.timer);
        this.playSound(this.gameoverSound);
        this.showScoreBoard(false);
    }

    // スコアの計算
    calculateScore() {
        const baseScore = this.solved.length * 100;
        const timeBonus = this.timeRemaining * 10;
        const movesPenalty = this.moves * 5;
        return Math.max(0, baseScore + timeBonus - movesPenalty);
    }

    // ハイスコアの更新
    updateHighScores(score) {
        const difficulty = this.difficultySelect.value;
        const highScores = this.loadHighScores();

        highScores[difficulty].push({
            score,
            moves: this.moves,
            timeRemaining: this.timeRemaining
        });

        highScores[difficulty].sort((a, b) => b.score - a.score);
        highScores[difficulty] = highScores[difficulty].slice(0, 5);

        localStorage.setItem('memoryGameHighScores', JSON.stringify(highScores));
    }

    // ハイスコアの読み込み
    loadHighScores() {
        const saved = localStorage.getItem('memoryGameHighScores');
        return saved ? JSON.parse(saved) : { easy: [], medium: [], hard: [] };
    }

    // スコアボードの表示
    showScoreBoard(won) {
        const difficulty = this.difficultySelect.value;
        const highScores = this.loadHighScores();
        const finalScore = this.calculateScore();

        const scoreBoard = document.getElementById('final-score');
        const highScoresList = document.getElementById('high-scores');

        scoreBoard.textContent = won
            ? `おめでとうございます！スコア: ${finalScore}点 (${this.moves}手 / 残り${this.timeRemaining}秒)`
            : 'タイムアップ！';

        highScoresList.innerHTML = highScores[difficulty]
            .map((score, index) => `
                <div>
                    ${index + 1}位: ${score.score}点
                    (${score.moves}手 / 残り${score.timeRemaining}秒)
                </div>
            `)
            .join('');

        this.scoreBoard.classList.remove('hidden');
    }

    // 表示の更新
    updateDisplay() {
        this.timeDisplay.textContent = this.timeRemaining;
        this.movesDisplay.textContent = this.moves;
    }

    // サウンドのオン・オフ切り替え
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    // 音声の再生
    playSound(sound) {
        if (this.soundEnabled) {
            sound.currentTime = 0;
            sound.play();
        }
    }
}

// ゲームの初期化
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});

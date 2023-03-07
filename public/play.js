
const btnDescriptions = [
    [0, 128, 0],
    [245, 0, 0],
    [245, 245, 0],
    [0, 0, 245],
];

class Button {
    constructor(el, r, g, b) {
        this.el = el;
        this.r = r;
        this.g = g;
        this.b = b;
    }
    highlight() {
        const background = `rgb(${this.r - 50},${this.g - 50},${this.b - 50})`;
        this.el.style.backgroundColor = background;
    }
    lowlight() {
        const background = `rgb(${this.r},${this.g},${this.b})`;
        this.el.style.backgroundColor = background;
    }
    async press(del = 100) {
        this.highlight();
        await delay(del);

        this.lowlight();
        await delay(del);
    }
}

class Game {
    buttons;
    allowPlayer;
    sequence;
    playerPlaybackPos;

    constructor() {
        this.buttons = new Map();
        this.allowPlayer = false;
        this.sequence = [];
        this.playerPlaybackPos = 0;

        document.querySelectorAll('.gameButton').forEach((el, i) => {
            if (i < btnDescriptions.length) {
                this.buttons.set(el.id, new Button(el, ...btnDescriptions[i]));
            }
        });

        const playerNameEl = document.querySelector('.player-name');
        playerNameEl.textContent = this.getPlayerName();
    }

    async pressButton(button) {
        if (this.allowPlayer) {
            this.allowPlayer = false;
            await this.buttons.get(button.id).press(250);

            if (this.sequence[this.playerPlaybackPos].el.id === button.id) {
                this.playerPlaybackPos++;
                if (this.playerPlaybackPos === this.sequence.length) {
                    this.playerPlaybackPos = 0;
                    this.addButton();
                    this.updateScore(this.sequence.length - 1);
                    await this.playSequence(500);
                }
                this.allowPlayer = true;
            } else {
                this.saveScore(this.sequence.length - 1);
                await this.buttonDance();
            }
        }
    }

    async reset() {
        this.allowPlayer = false;
        this.playerPlaybackPos = 0;
        this.sequence = [];
        this.updateScore('--');
        await this.buttonDance(1);
        this.addButton();
        await this.playSequence(500);
        this.allowPlayer = true;
    }

    getPlayerName() {
        return localStorage.getItem('userName') ?? 'Mystery player';
    }

    async playSequence(delayMs = 0) {
        if (delayMs > 0) {
            await delay(delayMs);
        }
        for (const btn of this.sequence) {
            await btn.press(500);
        }
    }

    addButton() {
        const btn = this.getRandomButton();
        this.sequence.push(btn);
    }

    updateScore(score) {
        const scoreEl = document.querySelector('#score');
        scoreEl.textContent = score;
    }

    async buttonDance(laps = 5) {
        for (let step = 0; step < laps; step++) {
            for (const btn of this.buttons.values()) {
                await btn.press();
            }
        }
    }

    getRandomButton() {
        let buttons = Array.from(this.buttons.values());
        return buttons[Math.floor(Math.random() * this.buttons.size)];
    }

    async saveScore(score) {
        const userName = this.getPlayerName();
        const date = new Date().toLocaleDateString();
        const newScore = { name: userName, score: score, date: date };

        try {
            const response = await fetch('/api/score', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(newScore),
            });

            // Store what the service gave us as the high scores
            const scores = await response.json();
            localStorage.setItem('scores', JSON.stringify(scores));
        } catch {
            // If there was an error then just track scores locally
            this.updateScoresLocal(newScore);
        }
    }

    updateScores(userName, score, scores) {
        const date = new Date().toLocaleDateString();
        const newScore = { name: userName, score: score, date: date };

        let found = false;
        for (const [i, prevScore] of scores.entries()) {
            if (score > prevScore.score) {
                scores.splice(i, 0, newScore);
                found = true;
                break;
            }
        }

        if (!found) {
            scores.push(newScore);
        }

        if (scores.length > 10) {
            scores.length = 10;
        }

        return scores;
    }
}

const game = new Game();

function delay(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, milliseconds);
    });
}
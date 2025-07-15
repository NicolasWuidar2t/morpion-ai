/**
 * Morpion AI - Web Version
 * Ported from Unity C# to JavaScript
 */

class MorpionAI {
    constructor() {
        this.BOARD_SIZE = 5;
        this.ALIGN_TO_WIN = 4;
        this.board = new Array(25).fill(0);
        this.currentPlayer = 1; // 1 = O, 2 = X
        this.gameState = 0; // 0 = playing, 1 = O wins, 2 = X wins, 3 = draw
        this.maxDepth = 3;
        this.aiPlayer = 1;
        this.humanPlayer = 2;
        this.isAIThinking = false;
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        this.createBoard();
        this.resetGame();
    }

    createBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.onCellClick(i));
            boardElement.appendChild(cell);
        }
    }

    setupEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('aiMoveBtn').addEventListener('click', () => this.triggerAIMove());
        document.getElementById('aiDepth').addEventListener('change', (e) => {
            this.maxDepth = parseInt(e.target.value);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.resetGame();
            } else if (e.key === 'k' || e.key === 'K') {
                this.triggerAIMove();
            }
        });
    }

    onCellClick(index) {
        if (this.gameState !== 0 || this.board[index] !== 0 || this.isAIThinking) {
            return;
        }
        
        this.playMove(index);
    }

    playMove(index) {
        if (this.gameState !== 0 || index < 0 || index >= 25 || this.board[index] !== 0) {
            return false;
        }

        this.board[index] = this.currentPlayer;
        this.checkGameState();
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.refreshBoard();
        this.refreshStatus();
        
        return true;
    }

    async triggerAIMove() {
        if (this.gameState !== 0 || this.isAIThinking) {
            return;
        }

        this.isAIThinking = true;
        document.getElementById('aiMoveBtn').disabled = true;
        document.getElementById('aiStatus').textContent = 'IA réfléchit...';
        
        const showThinking = document.getElementById('showAIThinking').checked;
        const speed = parseInt(document.getElementById('aiSpeed').value);
        
        try {
            const bestMove = await this.getBestMoveWithVisualization(
                [...this.board], 
                this.currentPlayer, 
                showThinking, 
                speed
            );
            
            if (bestMove !== -1) {
                this.playMove(bestMove);
            }
        } catch (error) {
            console.error('Erreur lors du calcul IA:', error);
        }
        
        this.isAIThinking = false;
        document.getElementById('aiMoveBtn').disabled = false;
        document.getElementById('aiStatus').textContent = 'IA prête';
    }

    async getBestMoveWithVisualization(board, currentPlayer, showVisualization = true, delay = 200) {
        this.aiPlayer = currentPlayer;
        this.humanPlayer = currentPlayer === 1 ? 2 : 1;
        
        let bestScore = -Infinity;
        let bestMove = -1;
        const rootSteps = [];

        for (let i = 0; i < board.length; i++) {
            if (board[i] !== 0) continue;

            board[i] = this.aiPlayer;
            const score = await this.minimax(board, this.maxDepth, false, -Infinity, Infinity);
            board[i] = 0;

            rootSteps.push({ index: i, score: score });

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }

        // Visualisation des meilleurs coups
        if (showVisualization && rootSteps.length > 0) {
            rootSteps.sort((a, b) => b.score - a.score);
            const topMoves = rootSteps.slice(0, Math.min(4, rootSteps.length));
            
            for (const step of topMoves) {
                this.highlightCell(step.index, step.score, true);
                await this.sleep(delay);
                this.resetCellHighlight(step.index);
            }
        }

        return bestMove;
    }

    async minimax(board, depth, isMaximizing, alpha, beta) {
        const winner = this.evaluateWinner(board);
        
        if (winner === this.aiPlayer) return 10000 + depth;
        if (winner === this.humanPlayer) return -10000 - depth;
        if (this.isBoardFull(board) || depth === 0) return this.evaluateBoard(board);

        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (let i = 0; i < board.length; i++) {
            if (board[i] !== 0) continue;

            board[i] = isMaximizing ? this.aiPlayer : this.humanPlayer;
            const score = await this.minimax(board, depth - 1, !isMaximizing, alpha, beta);
            board[i] = 0;

            if (isMaximizing) {
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, bestScore);
            } else {
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, bestScore);
            }

            if (beta <= alpha) break;
        }

        return bestScore;
    }

    evaluateWinner(board) {
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                const player = board[y * this.BOARD_SIZE + x];
                if (player === 0) continue;

                if (this.checkDirection(board, x, y, 1, 0, player) ||
                    this.checkDirection(board, x, y, 0, 1, player) ||
                    this.checkDirection(board, x, y, 1, 1, player) ||
                    this.checkDirection(board, x, y, 1, -1, player)) {
                    return player;
                }
            }
        }
        return 0;
    }

    checkDirection(board, x, y, dx, dy, player) {
        for (let i = 0; i < this.ALIGN_TO_WIN; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx < 0 || nx >= this.BOARD_SIZE || ny < 0 || ny >= this.BOARD_SIZE) return false;
            if (board[ny * this.BOARD_SIZE + nx] !== player) return false;
        }
        return true;
    }

    isBoardFull(board) {
        return board.every(cell => cell !== 0);
    }

    evaluateBoard(board) {
        let score = 0;
        score += this.evaluateLines(board, this.aiPlayer) * 10;
        score -= this.evaluateLines(board, this.humanPlayer) * 10;
        return score;
    }

    evaluateLines(board, player) {
        let count = 0;
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                count += this.countPattern(board, x, y, 1, 0, player);
                count += this.countPattern(board, x, y, 0, 1, player);
                count += this.countPattern(board, x, y, 1, 1, player);
                count += this.countPattern(board, x, y, 1, -1, player);
            }
        }
        return count;
    }

    countPattern(board, x, y, dx, dy, player) {
        let consecutive = 0;
        let blanks = 0;

        for (let i = 0; i < this.ALIGN_TO_WIN; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;

            if (nx < 0 || nx >= this.BOARD_SIZE || ny < 0 || ny >= this.BOARD_SIZE) return 0;

            const val = board[ny * this.BOARD_SIZE + nx];
            if (val === player) {
                consecutive++;
            } else if (val === 0) {
                blanks++;
            } else {
                return 0;
            }
        }

        if (consecutive === 4) return 100;
        if (consecutive === 3 && blanks === 1) return 10;
        if (consecutive === 2 && blanks >= 1) return 5;
        return 0;
    }

    checkGameState() {
        const winner = this.evaluateWinner(this.board);
        if (winner !== 0) {
            this.gameState = winner;
            this.highlightWinningCells();
            return;
        }

        if (this.isBoardFull(this.board)) {
            this.gameState = 3; // Draw
        }
    }

    highlightWinningCells() {
        // Find and highlight winning cells
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                const player = this.board[y * this.BOARD_SIZE + x];
                if (player === 0) continue;

                const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
                for (const [dx, dy] of directions) {
                    if (this.checkDirection(this.board, x, y, dx, dy, player)) {
                        for (let i = 0; i < this.ALIGN_TO_WIN; i++) {
                            const index = (y + i * dy) * this.BOARD_SIZE + (x + i * dx);
                            const cell = document.querySelector(`[data-index="${index}"]`);
                            if (cell) cell.classList.add('winner-cell');
                        }
                        return;
                    }
                }
            }
        }
    }

    highlightCell(index, score, isMaximizing) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (cell) {
            cell.classList.add('ai-thinking');
            if (isMaximizing) {
                cell.classList.add('ai-good');
            } else {
                cell.classList.add('ai-bad');
            }
        }
    }

    resetCellHighlight(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        if (cell) {
            cell.classList.remove('ai-thinking', 'ai-good', 'ai-bad');
        }
    }

    refreshBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const value = this.board[index];
            cell.textContent = value === 1 ? 'O' : value === 2 ? 'X' : '';
            cell.className = 'cell';
            if (value === 1) cell.classList.add('o');
            if (value === 2) cell.classList.add('x');
        });
    }

    refreshStatus() {
        const statusElement = document.getElementById('status');
        
        switch (this.gameState) {
            case 0:
                statusElement.textContent = `À ${this.currentPlayer === 1 ? 'O' : 'X'} de jouer !`;
                break;
            case 1:
                statusElement.textContent = 'O a gagné !';
                break;
            case 2:
                statusElement.textContent = 'X a gagné !';
                break;
            case 3:
                statusElement.textContent = 'Égalité !';
                break;
        }
    }

    resetGame() {
        this.board = new Array(25).fill(0);
        this.currentPlayer = Math.random() < 0.5 ? 1 : 2; // Random start like in Unity version
        this.gameState = 0;
        this.isAIThinking = false;
        
        // Reset visual elements
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
            cell.textContent = '';
        });
        
        document.getElementById('aiMoveBtn').disabled = false;
        document.getElementById('aiStatus').textContent = 'IA prête';
        
        this.refreshBoard();
        this.refreshStatus();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.morpionGame = new MorpionAI();
});
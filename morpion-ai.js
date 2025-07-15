/**
 * Morpion AI - Web Version (Optimized)
 * Enhanced with multiple minimax optimizations
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
        
        // Optimizations
        this.transpositionTable = new Map();
        this.killerMoves = new Array(this.maxDepth + 1).fill(null).map(() => []);
        this.historyTable = new Array(25).fill(0); // History heuristic
        this.principalVariation = []; // PV line
        this.nodeCount = 0;
        this.cutoffs = 0;
        this.ttHits = 0;
        this.pvHits = 0;
        
        // Web Worker support (optional)
        this.useWebWorker = typeof Worker !== 'undefined';
        this.aiWorker = null;
        if (this.useWebWorker) {
            try {
                this.aiWorker = new Worker('ai-worker.js');
            } catch (e) {
                console.log('Web Worker not available, using main thread');
                this.useWebWorker = false;
            }
        }
        
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
            this.clearTranspositionTable();
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
        
        // Reset statistics
        this.nodeCount = 0;
        this.cutoffs = 0;
        this.ttHits = 0;
        this.pvHits = 0;
        
        const showThinking = document.getElementById('showAIThinking').checked;
        const speed = parseInt(document.getElementById('aiSpeed').value);
        
        try {
            const startTime = performance.now();
            
            // Check opening book first
            const openingMove = this.getOpeningMove([...this.board]);
            let bestMove = openingMove;
            
            if (openingMove === -1) {
                // Try using Web Worker for better performance
                if (this.useWebWorker && this.aiWorker && this.maxDepth >= 4) {
                    try {
                        const result = await this.calculateWithWorker([...this.board], this.currentPlayer);
                        bestMove = result.move;
                        if (result.stats) {
                            const stats = `Worker - Temps: ${result.stats.time.toFixed(1)}ms | Nœuds: ${result.stats.nodes} | Coupures: ${result.stats.cutoffs} | TT: ${result.stats.ttHits} | PV: ${result.stats.pvHits}`;
                            console.log(stats);
                        }
                    } catch (workerError) {
                        console.log('Worker failed, falling back to main thread:', workerError);
                        bestMove = await this.getBestMoveWithVisualization(
                            [...this.board], 
                            this.currentPlayer, 
                            showThinking, 
                            speed
                        );
                    }
                } else {
                    // Use main thread search
                    bestMove = await this.getBestMoveWithVisualization(
                        [...this.board], 
                        this.currentPlayer, 
                        showThinking, 
                        speed
                    );
                }
            } else {
                console.log('Coup d\'ouverture utilisé:', openingMove);
            }
            
            const endTime = performance.now();
            
            if (bestMove !== -1) {
                this.playMove(bestMove);
            }
            
            // Display performance stats
            const stats = `Temps: ${(endTime - startTime).toFixed(1)}ms | Nœuds: ${this.nodeCount} | Coupures: ${this.cutoffs} | TT: ${this.ttHits} | PV: ${this.pvHits}`;
            console.log(stats);
            
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
        
        // Reset for new search
        this.killerMoves = new Array(this.maxDepth + 1).fill(null).map(() => []);
        this.principalVariation = [];
        
        let bestMove = -1;
        let bestScore = -Infinity;
        const rootSteps = [];

        // Iterative Deepening - start from depth 1 and increase
        for (let depth = 1; depth <= this.maxDepth; depth++) {
            const iterationStart = performance.now();
            
            let currentBestMove = -1;
            let currentBestScore = -Infinity;
            const currentRootSteps = [];

            // Get ordered moves (use PV from previous iteration if available)
            const moves = this.getOrderedMovesWithPV(board, true, 0, depth);
            
            for (const move of moves) {
                board[move] = this.aiPlayer;
                const score = await this.principalVariationSearch(
                    board, depth - 1, false, -Infinity, Infinity, 1, true
                );
                board[move] = 0;

                currentRootSteps.push({ index: move, score: score });

                if (score > currentBestScore) {
                    currentBestScore = score;
                    currentBestMove = move;
                }
                
                // Early termination for winning moves
                if (score >= 10000) {
                    bestMove = currentBestMove;
                    bestScore = currentBestScore;
                    break;
                }
            }

            // Update best move from this iteration
            if (currentBestMove !== -1) {
                bestMove = currentBestMove;
                bestScore = currentBestScore;
                rootSteps.splice(0, rootSteps.length, ...currentRootSteps);
            }

            const iterationTime = performance.now() - iterationStart;
            console.log(`Profondeur ${depth}: ${iterationTime.toFixed(1)}ms, Score: ${currentBestScore}`);

            // Break if we found a winning move
            if (currentBestScore >= 10000) break;
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

    async principalVariationSearch(board, depth, isMaximizing, alpha, beta, plyFromRoot = 0, isPVNode = false) {
        this.nodeCount++;
        
        // Check transposition table
        const boardKey = this.getBoardKey(board);
        const ttEntry = this.transpositionTable.get(boardKey);
        if (ttEntry && ttEntry.depth >= depth && !isPVNode) {
            this.ttHits++;
            if (ttEntry.type === 'exact') {
                return ttEntry.score;
            } else if (ttEntry.type === 'lower' && ttEntry.score >= beta) {
                return ttEntry.score;
            } else if (ttEntry.type === 'upper' && ttEntry.score <= alpha) {
                return ttEntry.score;
            }
        }

        const winner = this.evaluateWinner(board);
        
        if (winner === this.aiPlayer) return 10000 + depth;
        if (winner === this.humanPlayer) return -10000 - depth;
        if (this.isBoardFull(board) || depth === 0) {
            return this.evaluateBoard(board);
        }

        let bestScore = isMaximizing ? -Infinity : Infinity;
        let bestMove = -1;
        let hashFlag = 'upper';
        let searchPV = isPVNode;

        // Get ordered moves with PV move first
        const moves = this.getOrderedMovesWithPV(board, isMaximizing, plyFromRoot, depth);

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            board[move] = isMaximizing ? this.aiPlayer : this.humanPlayer;
            
            let score;
            
            if (searchPV) {
                // Full window search for PV node
                score = await this.principalVariationSearch(
                    board, depth - 1, !isMaximizing, alpha, beta, plyFromRoot + 1, true
                );
                searchPV = false; // Only first move gets full search
            } else {
                // Null window search for remaining moves
                const nullWindowAlpha = isMaximizing ? alpha : beta - 1;
                const nullWindowBeta = isMaximizing ? alpha + 1 : beta;
                
                score = await this.principalVariationSearch(
                    board, depth - 1, !isMaximizing, nullWindowAlpha, nullWindowBeta, plyFromRoot + 1, false
                );
                
                // If null window search fails, re-search with full window
                if ((isMaximizing && score > alpha && score < beta) || 
                    (!isMaximizing && score > alpha && score < beta)) {
                    this.pvHits++;
                    score = await this.principalVariationSearch(
                        board, depth - 1, !isMaximizing, alpha, beta, plyFromRoot + 1, true
                    );
                }
            }
            
            board[move] = 0;

            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                    
                    // Update principal variation
                    if (plyFromRoot === 0) {
                        this.principalVariation[0] = move;
                    }
                }
                alpha = Math.max(alpha, bestScore);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, bestScore);
            }

            if (beta <= alpha) {
                this.cutoffs++;
                
                // Update history table
                this.historyTable[move] += depth * depth;
                
                // Store killer move
                if (bestMove !== -1 && !this.killerMoves[plyFromRoot].includes(bestMove)) {
                    this.killerMoves[plyFromRoot].unshift(bestMove);
                    if (this.killerMoves[plyFromRoot].length > 2) {
                        this.killerMoves[plyFromRoot].pop();
                    }
                }
                break;
            }
        }

        // Store in transposition table
        if (bestScore <= alpha) {
            hashFlag = 'upper';
        } else if (bestScore >= beta) {
            hashFlag = 'lower';
        } else {
            hashFlag = 'exact';
        }

        this.transpositionTable.set(boardKey, {
            score: bestScore,
            depth: depth,
            type: hashFlag,
            move: bestMove
        });

        // Limit transposition table size and clean periodically
        if (this.transpositionTable.size > 50000) {
            // Keep only the most recent and valuable entries
            const entries = Array.from(this.transpositionTable.entries());
            entries.sort((a, b) => b[1].depth - a[1].depth); // Sort by depth
            this.transpositionTable.clear();
            
            // Keep top 25000 entries
            for (let i = 0; i < Math.min(25000, entries.length); i++) {
                this.transpositionTable.set(entries[i][0], entries[i][1]);
            }
        }

        return bestScore;
    }

    getOpeningMove(board) {
        const moveCount = board.filter(cell => cell !== 0).length;
        
        // Opening book for first few moves
        if (moveCount === 0) {
            // First move: take center
            return 12; // Center position (2,2)
        }
        
        if (moveCount === 1) {
            // Second move: respond to opponent
            if (board[12] === 0) {
                return 12; // Take center if available
            } else {
                // If center is taken, take a corner
                const corners = [0, 4, 20, 24];
                for (const corner of corners) {
                    if (board[corner] === 0) return corner;
                }
            }
        }
        
        if (moveCount === 2) {
            // Third move: continue center strategy or block
            const strategicMoves = [12, 6, 8, 16, 18]; // Center and adjacent
            for (const move of strategicMoves) {
                if (board[move] === 0) {
                    // Quick threat check
                    board[move] = this.currentPlayer;
                    const hasImportantThreat = this.evaluateBoard(board) > 100;
                    board[move] = 0;
                    if (hasImportantThreat) return move;
                }
            }
        }
        
        return -1; // No opening move found, use search
    }

    async calculateWithWorker(board, currentPlayer) {
        return new Promise((resolve, reject) => {
            const requestId = Date.now() + Math.random();
            
            const timeout = setTimeout(() => {
                reject(new Error('Worker timeout'));
            }, 30000); // 30 second timeout
            
            const handleMessage = (e) => {
                if (e.data.requestId === requestId) {
                    clearTimeout(timeout);
                    this.aiWorker.removeEventListener('message', handleMessage);
                    
                    if (e.data.success) {
                        resolve(e.data.result);
                    } else {
                        reject(new Error(e.data.error));
                    }
                }
            };
            
            this.aiWorker.addEventListener('message', handleMessage);
            this.aiWorker.postMessage({
                board,
                currentPlayer,
                maxDepth: this.maxDepth,
                requestId
            });
        });
    }

    getOrderedMovesWithPV(board, isMaximizing, plyFromRoot = 0, depth = 0) {
        const moves = [];
        const centerBonus = 5;
        
        // Get PV move from transposition table or previous iteration
        let pvMove = null;
        const boardKey = this.getBoardKey(board);
        const ttEntry = this.transpositionTable.get(boardKey);
        if (ttEntry && ttEntry.move !== -1) {
            pvMove = ttEntry.move;
        } else if (plyFromRoot === 0 && this.principalVariation.length > 0) {
            pvMove = this.principalVariation[0];
        }
        
        // Collect all available moves with scoring
        for (let i = 0; i < board.length; i++) {
            if (board[i] !== 0) continue;
            
            let score = 0;
            
            // PV move gets highest priority
            if (i === pvMove) {
                score += 1000000;
            }
            
            // History heuristic
            score += this.historyTable[i];
            
            // Center control bonus
            const x = i % this.BOARD_SIZE;
            const y = Math.floor(i / this.BOARD_SIZE);
            const distanceFromCenter = Math.abs(x - 2) + Math.abs(y - 2);
            score += (4 - distanceFromCenter) * centerBonus;
            
            // Check for immediate threats/opportunities
            board[i] = isMaximizing ? this.aiPlayer : this.humanPlayer;
            const immediateEval = this.evaluateBoard(board);
            board[i] = 0;
            
            score += immediateEval * 10; // Increased weight for tactical moves
            
            moves.push({ index: i, score });
        }

        // Sort moves by score
        moves.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);
        
        // Add killer moves to the front (after PV move)
        const killers = this.killerMoves[plyFromRoot] || [];
        const orderedMoves = [];
        
        // First, add PV move if valid
        if (pvMove !== null && board[pvMove] === 0) {
            orderedMoves.push(pvMove);
        }
        
        // Then add killer moves that are valid and not PV
        for (const killer of killers) {
            if (board[killer] === 0 && killer !== pvMove) {
                orderedMoves.push(killer);
            }
        }
        
        // Finally add other moves, skipping PV and killer moves
        for (const move of moves) {
            if (move.index !== pvMove && !killers.includes(move.index)) {
                orderedMoves.push(move.index);
            }
        }
        
        return orderedMoves;
    }

    getBoardKey(board) {
        return board.join('');
    }

    clearTranspositionTable() {
        this.transpositionTable.clear();
        // Reset history table with aging
        for (let i = 0; i < this.historyTable.length; i++) {
            this.historyTable[i] = Math.floor(this.historyTable[i] * 0.8); // Age factor
        }
        this.principalVariation = [];
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
        
        // Pattern evaluation
        score += this.evaluateLines(board, this.aiPlayer) * 10;
        score -= this.evaluateLines(board, this.humanPlayer) * 10;
        
        // Center control bonus
        const center = 12; // Center position (2,2)
        if (board[center] === this.aiPlayer) score += 20;
        if (board[center] === this.humanPlayer) score -= 20;
        
        // Corner and edge control
        const corners = [0, 4, 20, 24];
        const edges = [1, 2, 3, 5, 9, 10, 14, 15, 19, 21, 22, 23];
        
        for (const corner of corners) {
            if (board[corner] === this.aiPlayer) score += 10;
            if (board[corner] === this.humanPlayer) score -= 10;
        }
        
        for (const edge of edges) {
            if (board[edge] === this.aiPlayer) score += 5;
            if (board[edge] === this.humanPlayer) score -= 5;
        }
        
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

        if (consecutive === 4) return 500; // Increased value for near-wins
        if (consecutive === 3 && blanks === 1) return 50;
        if (consecutive === 2 && blanks >= 1) return 10;
        if (consecutive === 1 && blanks >= 2) return 1;
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
        this.currentPlayer = Math.random() < 0.5 ? 1 : 2; // Random start
        this.gameState = 0;
        this.isAIThinking = false;
        this.clearTranspositionTable();
        
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
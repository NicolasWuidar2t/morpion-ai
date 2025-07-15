/**
 * Web Worker for AI calculations
 * Offloads heavy computations from the main thread
 */

// Import the AI logic (simplified version for worker)
class MorpionAIWorker {
    constructor() {
        this.BOARD_SIZE = 5;
        this.ALIGN_TO_WIN = 4;
        this.transpositionTable = new Map();
        this.killerMoves = [];
        this.historyTable = new Array(25).fill(0);
        this.nodeCount = 0;
        this.cutoffs = 0;
        this.ttHits = 0;
        this.pvHits = 0;
    }

    // Copy the optimized AI methods here
    async calculateBestMove(board, currentPlayer, maxDepth) {
        this.aiPlayer = currentPlayer;
        this.humanPlayer = currentPlayer === 1 ? 2 : 1;
        this.maxDepth = maxDepth;
        
        // Reset statistics
        this.nodeCount = 0;
        this.cutoffs = 0;
        this.ttHits = 0;
        this.pvHits = 0;
        
        // Check opening book
        const openingMove = this.getOpeningMove(board);
        if (openingMove !== -1) {
            return {
                move: openingMove,
                score: 0,
                stats: { time: 0, nodes: 0, cutoffs: 0, ttHits: 0, pvHits: 0 },
                fromOpeningBook: true
            };
        }

        const startTime = performance.now();
        
        // Use iterative deepening with PVS
        let bestMove = -1;
        for (let depth = 1; depth <= maxDepth; depth++) {
            const result = await this.searchAtDepth(board, depth);
            if (result.move !== -1) {
                bestMove = result.move;
            }
            if (result.score >= 10000) break; // Found winning move
        }

        const endTime = performance.now();
        
        return {
            move: bestMove,
            score: 0,
            stats: {
                time: endTime - startTime,
                nodes: this.nodeCount,
                cutoffs: this.cutoffs,
                ttHits: this.ttHits,
                pvHits: this.pvHits
            },
            fromOpeningBook: false
        };
    }

    async searchAtDepth(board, depth) {
        const moves = this.getOrderedMoves(board, true);
        let bestMove = -1;
        let bestScore = -Infinity;

        for (const move of moves) {
            board[move] = this.aiPlayer;
            const score = await this.principalVariationSearch(
                board, depth - 1, false, -Infinity, Infinity, 1, true
            );
            board[move] = 0;

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            
            if (score >= 10000) break;
        }

        return { move: bestMove, score: bestScore };
    }

    async principalVariationSearch(board, depth, isMaximizing, alpha, beta, plyFromRoot = 0, isPVNode = false) {
        this.nodeCount++;
        
        // Simplified version of PVS for worker
        const winner = this.evaluateWinner(board);
        if (winner === this.aiPlayer) return 10000 + depth;
        if (winner === this.humanPlayer) return -10000 - depth;
        if (this.isBoardFull(board) || depth === 0) {
            return this.evaluateBoard(board);
        }

        let bestScore = isMaximizing ? -Infinity : Infinity;
        const moves = this.getOrderedMoves(board, isMaximizing);

        for (const move of moves) {
            board[move] = isMaximizing ? this.aiPlayer : this.humanPlayer;
            const score = await this.principalVariationSearch(
                board, depth - 1, !isMaximizing, alpha, beta, plyFromRoot + 1, false
            );
            board[move] = 0;

            if (isMaximizing) {
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, bestScore);
            } else {
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, bestScore);
            }

            if (beta <= alpha) {
                this.cutoffs++;
                break;
            }
        }

        return bestScore;
    }

    getOpeningMove(board) {
        const moveCount = board.filter(cell => cell !== 0).length;
        
        if (moveCount === 0) return 12; // Center
        if (moveCount === 1 && board[12] === 0) return 12;
        if (moveCount === 1) return 0; // Corner if center taken
        
        return -1;
    }

    getOrderedMoves(board, isMaximizing) {
        const moves = [];
        for (let i = 0; i < board.length; i++) {
            if (board[i] === 0) moves.push(i);
        }
        return moves; // Simplified ordering for worker
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
        // Simplified evaluation for worker
        let score = 0;
        const center = 12;
        if (board[center] === this.aiPlayer) score += 20;
        if (board[center] === this.humanPlayer) score -= 20;
        return score;
    }
}

// Worker message handling
const ai = new MorpionAIWorker();

self.onmessage = async function(e) {
    const { board, currentPlayer, maxDepth, requestId } = e.data;
    
    try {
        const result = await ai.calculateBestMove(board, currentPlayer, maxDepth);
        self.postMessage({
            requestId,
            success: true,
            result
        });
    } catch (error) {
        self.postMessage({
            requestId,
            success: false,
            error: error.message
        });
    }
};
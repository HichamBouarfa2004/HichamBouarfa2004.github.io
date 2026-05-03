/* ============================================
   المعلم الرفيق - Game State Manager
   Immutable state, central store, change listeners
   ============================================ */

class GameState {
    constructor() {
        this._state = {
            // Core
            currentScreen: 'welcome',
            selectedAvatar: null,
            
            // Mission progress
            currentMission: null,
            currentQuestion: 0,
            totalQuestions: 0,
            missionCompletedPendingFinalize: false,
            
            // Energy & Keys
            energy: 0,
            highestUnlockedStage: 1,
            stageMasteryThreshold: 100,
            keys: {
                idhafa: { bronze: false, silver: false, gold: false },
                diptote: { bronze: false, silver: false, gold: false },
                participles: { bronze: false, silver: false, gold: false },
                vocative: { bronze: false, silver: false, gold: false }
            },
            
            // Session tracking
            hintsUsed: 0,           // hints used in current question
            hintsUsedMission: 0,    // total hints used in current mission session
            currentQuestionIncorrect: 0,
            answersCorrect: 0,
            sessionAnswers: [],     // { mission, question, correct, timestamp }
            
            // Lab
            labSentences: [],
            
            // Version for migration
            version: '2.0.0'
        };
        
        this._listeners = []; // for UI update subscriptions
    }
    
    // Subscribe to state changes
    subscribe(listener) {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    }
    
    // Notify all listeners
    _notify() {
        this._listeners.forEach(listener => listener(this._state));
    }
    
    // Get full state (read-only)
    getState() {
        return { ...this._state };
    }
    
    // Get specific value
    get(key) {
        return this._state[key];
    }
    
    // Update state (with immutability)
    set(updates) {
        this._state = { ...this._state, ...updates };
        this._notify();
        // Auto-save after every change
        if (window.StorageManager) {
            window.StorageManager.saveGameState(this._state);
        }
    }
    
    // Deep update for nested objects (e.g., keys)
    updateNested(path, value) {
        const newState = JSON.parse(JSON.stringify(this._state));
        const parts = path.split('.');
        let current = newState;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        this._state = newState;
        this._notify();
        if (window.StorageManager) {
            window.StorageManager.saveGameState(this._state);
        }
    }
    
    // Reset entire state (clear all progress)
    reset() {
        this._state = {
            currentScreen: 'welcome',
            selectedAvatar: null,
            currentMission: null,
            currentQuestion: 0,
            totalQuestions: 0,
            missionCompletedPendingFinalize: false,
            energy: 0,
            highestUnlockedStage: 1,
            stageMasteryThreshold: 100,
            keys: {
                idhafa: { bronze: false, silver: false, gold: false },
                diptote: { bronze: false, silver: false, gold: false },
                participles: { bronze: false, silver: false, gold: false },
                vocative: { bronze: false, silver: false, gold: false }
            },
            hintsUsed: 0,
            hintsUsedMission: 0,
            currentQuestionIncorrect: 0,
            answersCorrect: 0,
            sessionAnswers: [],
            labSentences: [],
            version: '2.0.0'
        };
        this._notify();
    }
    
    // Load from saved data (called by StorageManager)
    loadFromSaved(savedState) {
        if (savedState && savedState.version) {
            this._state = { ...this._state, ...savedState };
            this._state.highestUnlockedStage = Math.max(1, Math.min(4, this._state.highestUnlockedStage || 1));
            this._state.stageMasteryThreshold = typeof this._state.stageMasteryThreshold === 'number' ? this._state.stageMasteryThreshold : 100;
            this._notify();
        }
    }

    /**
     * Unlock the next stage sequentially when mastery is achieved.
     * @param {number} completedStage - 1-based stage index that was just mastered.
     * @returns {boolean}
     */
    unlockNextStage(completedStage) {
        const currentHighest = this._state.highestUnlockedStage || 1;
        const nextStage = Math.min(4, completedStage + 1);
        if (nextStage > currentHighest) {
            this.set({ highestUnlockedStage: nextStage });
            return true;
        }
        return false;
    }

    /**
     * Check whether the provided score meets the mastery threshold.
     * @param {number} percentage
     * @returns {boolean}
     */
    isMasteryAchieved(percentage) {
        return percentage >= (this._state.stageMasteryThreshold || 100);
    }
}

// Create global singleton instance
const gameState = new GameState();

// Export for global use
window.gameState = gameState;
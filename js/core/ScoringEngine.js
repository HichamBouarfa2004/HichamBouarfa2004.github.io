/* ============================================
   المعلم الرفيق - Scoring Engine
   Energy management, key calculation (best key preserved)
   ============================================ */

class ScoringEngine {
    constructor() {
        this.gameState = window.gameState;
    }
    
    /**
     * Add energy (capped at 100)
     * @param {number} amount 
     */
    addEnergy(amount) {
        const currentEnergy = this.gameState.get('energy');
        const newEnergy = Math.min(100, currentEnergy + amount);
        this.gameState.set({ energy: newEnergy });
    }
    
    /**
     * Deduct energy (minimum 0)
     * @param {number} amount 
     */
    deductEnergy(amount) {
        const currentEnergy = this.gameState.get('energy');
        const newEnergy = Math.max(0, currentEnergy - amount);
        this.gameState.set({ energy: newEnergy });
    }
    
    /**
     * Get key type based on hints used in mission
     * @param {number} hintsUsed 
     * @returns {string} 'gold', 'silver', or 'bronze'
     */
    getKeyTypeFromHints(hintsUsed) {
        if (hintsUsed === 0) return 'gold';
        if (hintsUsed === 1) return 'silver';
        return 'bronze';
    }
    
    /**
     * Award key for a mission (only if better than existing)
     * @param {string} missionId 
     * @param {number} hintsUsedInMission 
     * @returns {boolean} - whether a new key was awarded
     */
    awardKey(missionId, hintsUsedInMission) {
        const currentKeys = this.gameState.get('keys')[missionId] || {
            bronze: false,
            silver: false,
            gold: false
        };
        const newKeyType = this.getKeyTypeFromHints(hintsUsedInMission);
        
        // Key priority: gold > silver > bronze
        const keyPriority = { gold: 3, silver: 2, bronze: 1 };
        const currentBest = currentKeys.gold ? 'gold' : (currentKeys.silver ? 'silver' : (currentKeys.bronze ? 'bronze' : null));
        
        // If no key yet, or new key is higher priority
        if (!currentBest || keyPriority[newKeyType] > keyPriority[currentBest]) {
            // Set all keys up to the new best
            const updatedKeys = { ...this.gameState.get('keys') };
            updatedKeys[missionId] = { 
                bronze: true, 
                silver: keyPriority[newKeyType] >= 2, 
                gold: keyPriority[newKeyType] >= 3 
            };
            this.gameState.updateNested('keys', updatedKeys);
            return true;
        }
        return false;
    }
    
    /**
     * Calculate mission performance and award keys
     * Called when mission completes
     * @param {string} missionId 
     * @param {Array} sessionAnswers 
     * @param {number} hintsUsedTotal 
     */
    completeMission(missionId, sessionAnswers, hintsUsedTotal) {
        const finalAnswersByQuestion = new Map();
        sessionAnswers.forEach(answer => {
            finalAnswersByQuestion.set(answer.question, answer.correct);
        });

        const totalQuestions = finalAnswersByQuestion.size;
        const correctAnswers = Array.from(finalAnswersByQuestion.values()).filter(Boolean).length;
        const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        
        // Bonus energy for perfect score
        if (percentage === 100) {
            this.addEnergy(30);
        } else if (percentage >= 80) {
            this.addEnergy(15);
        } else if (percentage >= 60) {
            this.addEnergy(5);
        }
        
        // Award key based on total hints used in mission
        const keyAwarded = this.awardKey(missionId, hintsUsedTotal);
        
        return {
            correctAnswers,
            totalQuestions,
            percentage,
            masteryAchieved: this.gameState.isMasteryAchieved(percentage),
            keyAwarded,
            keyType: this.getKeyTypeFromHints(hintsUsedTotal)
        };
    }
    
    /**
     * Handle correct answer for a question
     * @param {boolean} hintUsed 
     */
    handleCorrectAnswer(hintUsed) {
        const energyReward = hintUsed ? 10 : 20;
        this.addEnergy(energyReward);
        // Reset incorrect counter for this question
        this.gameState.set({ currentQuestionIncorrect: 0 });
    }
    
    /**
     * Handle incorrect answer
     */
    handleIncorrectAnswer() {
        // Small penalty but with floor of 0
        this.deductEnergy(5);
        const incorrectCount = this.gameState.get('currentQuestionIncorrect') + 1;
        this.gameState.set({ currentQuestionIncorrect: incorrectCount });
        
        // Auto-show hint after 2 consecutive wrong attempts
        if (incorrectCount === 2) {
            return { showHint: true };
        }
        return { showHint: false };
    }
    
    /**
     * Get total keys collected
     * @returns {number}
     */
    getTotalKeys() {
        const keys = this.gameState.get('keys');
        let total = 0;
        for (const mission of Object.values(keys)) {
            if (mission.gold) total++;
            if (mission.silver) total++;
            if (mission.bronze) total++;
        }
        return total;
    }
    
    /**
     * Get energy percentage
     * @returns {number}
     */
    getEnergyPercentage() {
        return this.gameState.get('energy');
    }
}

// Create global instance
const scoringEngine = new ScoringEngine();

// Export
window.scoringEngine = scoringEngine;
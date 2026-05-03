/* ============================================
   المعلم الرفيق - Mission Engine
   Load questions, validate answers, track mission state
   ============================================ */

class MissionEngine {
    constructor() {
        this.gameState = window.gameState;
        this.missionsData = window.missionsData;
        this.scoringEngine = window.scoringEngine;
    }
    
    /**
     * Start a mission
     * @param {string} missionId 
     */
    startMission(missionId) {
        const mission = this.missionsData.find(m => m.id === missionId);
        if (!mission) return false;
        
        this.gameState.set({
            currentMission: missionId,
            currentQuestion: 0,
            totalQuestions: mission.questions.length,
            hintsUsed: 0,
            hintsUsedMission: 0,
            currentQuestionIncorrect: 0
        });
        
        return true;
    }
    
    /**
     * Get current mission object
     * @returns {object|null}
     */
    getCurrentMission() {
        const missionId = this.gameState.get('currentMission');
        if (!missionId) return null;
        return this.missionsData.find(m => m.id === missionId);
    }
    
    /**
     * Get current question object
     * @returns {object|null}
     */
    getCurrentQuestion() {
        const mission = this.getCurrentMission();
        if (!mission) return null;
        const questionIndex = this.gameState.get('currentQuestion');
        if (questionIndex >= mission.questions.length) return null;
        return mission.questions[questionIndex];
    }
    
    /**
     * Validate answer for current question
     * @param {any} userAnswer 
     * @returns {boolean}
     */
    validateCurrentAnswer(userAnswer) {
        const question = this.getCurrentQuestion();
        if (!question) return false;
        
        let isCorrect = false;
        
        switch (question.type) {
            case 'multiple-choice':
                // userAnswer should be index (0,1,2...)
                isCorrect = (parseInt(userAnswer) === question.correct);
                break;
                
            case 'fill-blank':
                // Use the utility function for diacritic-insensitive comparison
                if (window.isAnswerMatching) {
                    isCorrect = window.isAnswerMatching(userAnswer, question.correct);
                } else {
                    // Fallback
                    isCorrect = (userAnswer.trim() === question.correct);
                }
                break;
                
            case 'sorting':
                // Sorting validation needs current UI state
                // This will be handled by MissionUI, but we provide a method
                isCorrect = this._validateSortingFromData(userAnswer, question);
                break;
                
            default:
                isCorrect = false;
        }
        
        return isCorrect;
    }
    
    /**
     * Internal sorting validation (used by MissionUI)
     * @param {object} currentState - from getSortingState()
     * @param {object} question 
     * @returns {boolean}
     */
    _validateSortingFromData(currentState, question) {
        if (window.verifySortingAnswer) {
            return window.verifySortingAnswer(question.categories, currentState);
        }
        return false;
    }
    
    /**
     * Record answer and move to next question or complete mission
     * @param {boolean} isCorrect 
     * @param {number} hintsUsedForQuestion 
     */
    recordAnswer(isCorrect, hintsUsedForQuestion) {
        const missionId = this.gameState.get('currentMission');
        const questionIndex = this.gameState.get('currentQuestion');
        const timestamp = new Date().toISOString();
        
        // Add to session answers
        const sessionAnswers = [...this.gameState.get('sessionAnswers')];
        sessionAnswers.push({
            mission: missionId,
            question: questionIndex,
            correct: isCorrect,
            hintsUsed: hintsUsedForQuestion,
            timestamp
        });
        this.gameState.set({ sessionAnswers });
        
        if (isCorrect) {
            // Update global correct count
            const answersCorrect = this.gameState.get('answersCorrect') + 1;
            this.gameState.set({ answersCorrect });
            
            // Handle scoring (energy)
            const hintUsed = (hintsUsedForQuestion > 0);
            this.scoringEngine.handleCorrectAnswer(hintUsed);
            
            // Move to next question
            const currentIndex = this.gameState.get('currentQuestion');
            const totalQuestions = this.gameState.get('totalQuestions');
            
            if (currentIndex + 1 >= totalQuestions) {
                // Mission is now completed (pending finalization)
                this.gameState.set({ missionCompletedPendingFinalize: true });
            } else {
                // Load next question
                this.gameState.set({ currentQuestion: currentIndex + 1 });
            }
        } else {
            const result = this.scoringEngine.handleIncorrectAnswer();
            if (result.showHint && window.showHintPopup) {
                setTimeout(() => {
                    window.showHintPopup();
                }, 500);
            }
        }
    }
    
    /**
     * Finalize mission completion and award keys.
     * Called by MissionUI after success popup.
     */
    finalizeMissionCompletion() {
        const missionId = this.gameState.get('currentMission');
        const sessionAnswers = this.gameState.get('sessionAnswers').filter(a => a.mission === missionId);
        const hintsUsedTotal = this.gameState.get('hintsUsedMission');
        const missionOrder = ['idhafa', 'diptote', 'participles', 'vocative'];
        const completedStage = Math.max(1, missionOrder.indexOf(missionId) + 1);
        
        const result = this.scoringEngine.completeMission(missionId, sessionAnswers, hintsUsedTotal);

        if (result.masteryAchieved) {
            const unlocked = this.gameState.unlockNextStage(completedStage);
            if (unlocked && window.mapUI) {
                window.mapUI.playUnlockSequence(completedStage + 1);
            }
        }
        
        // Clear mission state but keep progress
        this.gameState.set({
            currentMission: null,
            currentQuestion: 0,
            hintsUsed: 0,
            hintsUsedMission: 0,
            currentQuestionIncorrect: 0,
            missionCompletedPendingFinalize: false // Reset the flag
        });
        
        return result;
    }
    
    /**
     * Increment hints used counter for current question and mission
     */
    incrementHintsUsed() {
        let hintsUsed = this.gameState.get('hintsUsed') + 1;
        let hintsUsedMission = this.gameState.get('hintsUsedMission') + 1;
        this.gameState.set({ hintsUsed, hintsUsedMission });
    }
    
    /**
     * Get progress for a specific mission
     * @param {string} missionId 
     * @returns {object}
     */
    getMissionProgress(missionId) {
        const mission = this.missionsData.find(m => m.id === missionId);
        if (!mission) return null;
        
        const sessionAnswers = this.gameState.get('sessionAnswers');
        const missionAnswers = sessionAnswers.filter(a => a.mission === missionId);
        const correctAnswers = missionAnswers.filter(a => a.correct).length;
        const totalQuestions = mission.questions.length;
        
        return {
            missionId,
            title: mission.title,
            questionsAnswered: missionAnswers.length,
            totalQuestions,
            correctAnswers,
            percentage: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
            keys: this.gameState.get('keys')[missionId],
            isCompleted: correctAnswers === totalQuestions
        };
    }
}

// Create global instance
const missionEngine = new MissionEngine();

// Export
window.missionEngine = missionEngine;
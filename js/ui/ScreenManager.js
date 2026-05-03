/* ============================================
   المعلم الرفيق - Screen Manager
   Handles screen transitions, routing, and navigation
   ============================================ */

class ScreenManager {
    constructor() {
        this.screens = {
            welcome: document.getElementById('welcomeScreen'),
            avatar: document.getElementById('avatarScreen'),
            hub: document.getElementById('hubScreen'),
            mission: document.getElementById('missionScreen'),
            lab: document.getElementById('labScreen'),
            profile: document.getElementById('profileScreen')
        };
        this.currentScreen = 'welcome';
        this.gameState = window.gameState;
    }
    
    /**
     * Navigate to a specific screen
     * @param {string} screenName - one of: welcome, avatar, hub, mission, lab, profile
     */
    goToScreen(screenName) {
        // Validate screen exists
        if (!this.screens[screenName]) {
            console.warn(`Screen "${screenName}" not found`);
            return;
        }
        
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('screen-active');
        });
        
        // Show target screen
        this.screens[screenName].classList.add('screen-active');
        this.currentScreen = screenName;
        
        // Update game state
        this.gameState.set({ currentScreen: screenName });
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Trigger screen-specific updates
        this._onScreenEnter(screenName);
    }
    
    /**
     * Handle side effects when entering a screen
     * @param {string} screenName 
     */
    _onScreenEnter(screenName) {
        switch (screenName) {
            case 'hub':
                this._updateHubUI();
                break;
            case 'profile':
                this._updateProfileUI();
                break;
            case 'mission':
                this._updateMissionUI();
                if (window.missionUI) {
                    window.missionUI.loadCurrentQuestion();
                }
                break;
            case 'lab':
                this._updateLabUI();
                break;
        }
    }
    
    /**
     * Update hub screen stats and keys
     */
    _updateHubUI() {
        // Update energy
        const energy = this.gameState.get('energy');
        const energyFill = document.getElementById('energyFill');
        const energyText = document.getElementById('energyText');
        if (energyFill) energyFill.style.width = energy + '%';
        if (energyText) energyText.textContent = energy + '%';
        
        // Update keys display
        this._renderKeys();
        
        // Update mission progress badges
        this._updateMissionProgress();
        
        // Check innovation lab unlock (4+ keys)
        const totalKeys = this._getTotalKeys();
        const labBtn = document.getElementById('lab-btn');
        const labLock = document.getElementById('lab-lock');
        const innovationLab = document.getElementById('innovation-lab');
        
        if (totalKeys >= 4) {
            if (labBtn) labBtn.disabled = false;
            if (labLock) labLock.classList.add('hidden');
            if (innovationLab) innovationLab.classList.add('unlocked');
        } else {
            if (labBtn) labBtn.disabled = true;
            if (labLock) labLock.classList.remove('hidden');
        }
    }
    
    /**
     * Render keys in hub header
     */
    _renderKeys() {
        const keysContainer = document.getElementById('keysContainer');
        const keysCountSpan = document.getElementById('keysCount');
        if (!keysContainer) return;
        
        keysContainer.innerHTML = '';
        const keys = this.gameState.get('keys');
        let totalKeys = 0;
        
        const missionOrder = ['idhafa', 'diptote', 'participles', 'vocative'];
        missionOrder.forEach(mission => {
            ['gold', 'silver', 'bronze'].forEach(type => {
                if (keys[mission] && keys[mission][type]) {
                    totalKeys++;
                    const keyEmoji = type === 'gold' ? '🔐' : (type === 'silver' ? '🗝️' : '🔑');
                    const keySpan = document.createElement('span');
                    keySpan.className = 'key-icon';
                    keySpan.textContent = keyEmoji;
                    keySpan.title = `${mission} - ${type}`;
                    keysContainer.appendChild(keySpan);
                }
            });
        });
        
        if (keysCountSpan) keysCountSpan.textContent = `${totalKeys}/12`;
    }
    
    /**
     * Get total keys collected
     */
    _getTotalKeys() {
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
     * Update mission progress indicators on hub
     */
    _updateMissionProgress() {
        const missions = ['idhafa', 'diptote', 'participles', 'vocative'];
        const sessionAnswers = this.gameState.get('sessionAnswers');
        
        missions.forEach(missionId => {
            const counterSpan = document.getElementById(`${missionId}-questions`);
            if (!counterSpan) return;
            
            const missionData = window.missionsData?.find(m => m.id === missionId);
            if (!missionData) return;
            
            const missionAnswers = sessionAnswers.filter(a => a.mission === missionId);
            const correctCount = missionAnswers.filter(a => a.correct).length;
            const total = missionData.questions.length;
            counterSpan.textContent = `${correctCount}/${total}`;
            
            // Mark mission card as completed if all questions correct
            const missionCard = document.querySelector(`.mission-card[data-mission="${missionId}"]`);
            if (missionCard && correctCount === total) {
                missionCard.classList.add('completed');
            }
        });
    }
    
    /**
     * Update profile screen data
     */
    _updateProfileUI() {
        const avatarName = document.getElementById('profileAvatar');
        const levelSpan = document.getElementById('profileLevel');
        const energySpan = document.getElementById('profileEnergy');
        const keysSpan = document.getElementById('profileKeys');
        const correctSpan = document.getElementById('profileCorrect');
        
        const avatar = this.gameState.get('selectedAvatar');
        const energy = this.gameState.get('energy');
        const totalKeys = this._getTotalKeys();
        const correctAnswers = this.gameState.get('answersCorrect');
        
        if (avatarName) avatarName.textContent = avatar === 'sibawayh' ? 'سيبويه' : (avatar === 'al-farahidi' ? 'الفراهيدي' : 'لم يختار');
        
        // Calculate level based on energy
        let level = 'مبتدئ';
        if (energy >= 30) level = 'متوسط';
        if (energy >= 60) level = 'متقدم';
        if (energy >= 90) level = 'خبير';
        if (levelSpan) levelSpan.textContent = level;
        
        if (energySpan) energySpan.textContent = energy + '%';
        if (keysSpan) keysSpan.textContent = `${totalKeys}/12`;
        if (correctSpan) correctSpan.textContent = correctAnswers;
    }
    
    /**
     * Update mission screen UI (called before showing mission)
     */
    _updateMissionUI() {
        const missionId = this.gameState.get('currentMission');
        if (!missionId) return;
        
        const mission = window.missionsData?.find(m => m.id === missionId);
        if (!mission) return;
        
        const missionTitle = document.getElementById('missionTitle');
        const scenarioText = document.getElementById('scenarioText');
        const questionCounter = document.getElementById('questionCounter');
        const currentQ = this.gameState.get('currentQuestion');
        const total = this.gameState.get('totalQuestions');
        
        if (missionTitle) missionTitle.textContent = mission.title;
        if (scenarioText) scenarioText.textContent = mission.scenario;
        if (questionCounter) questionCounter.textContent = `${currentQ + 1}/${total}`;
    }
    
    /**
     * Update lab UI (load gallery)
     */
    _updateLabUI() {
        const labSentences = this.gameState.get('labSentences') || [];
        const gallery = document.getElementById('creativeGallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        if (labSentences.length === 0) {
            gallery.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--secondary-text);">لا توجد جمل مشاركة بعد. كن الأول! 🚀</p>';
            return;
        }
        
        // Show last 6 sentences, newest first
        labSentences.slice(-6).reverse().forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'creative-card';
            cardEl.innerHTML = `
                <p dir="rtl">${card.sentence}</p>
                <span class="creative-author">${card.avatar === 'sibawayh' ? '👨‍🎓 سيبويه' : '👨‍🎓 الفراهيدي'}</span>
            `;
            gallery.appendChild(cardEl);
        });
    }
    
    /**
     * Get current screen name
     */
    getCurrentScreen() {
        return this.currentScreen;
    }
}

// Create global instance
const screenManager = new ScreenManager();

// Export
window.screenManager = screenManager;
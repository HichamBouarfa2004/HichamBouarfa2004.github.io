/* ============================================
   المعلم الرفيق - Main Application Entry
   Initialises all modules, sets up event listeners
   ============================================ */

// Initialize application core (handle both early and late loading)
function initializeApp() {
    // 1. Load saved game state from localStorage
    if (window.StorageManager) {
        window.StorageManager.loadGameState();
    }
    // Initialise world map if we are on hub screen or at startup
    if (window.gameState && window.screenManager) {
        window.gameState.subscribe(() => {
            if (window.screenManager.getCurrentScreen() === 'hub' && window.mapUI) {
                window.mapUI.updateIslandStates();
            }
        });
    }

    
    // 2. Initialize UI based on current state
    initUI();
    
    // 3. Set up all event listeners
    setupEventListeners();
    
    // 4. Subscribe to state changes for real-time UI updates
    if (window.gameState) {
        window.gameState.subscribe(onGameStateChange);
    }
    
    // 5. Initial energy and keys display
    updateEnergyAndKeys();
}

// Handle both cases: DOM still loading vs already loaded (GitHub Pages compatibility)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

/**
 * Initial UI setup based on loaded state
 */
function initUI() {
    const state = window.gameState.getState();
    
    // If avatar already selected, go to hub directly? No, always start from welcome
    // But if we have a saved screen, navigate there
    if (state.currentScreen && state.currentScreen !== 'welcome') {
        if (window.screenManager) {
            window.screenManager.goToScreen(state.currentScreen);
        }
    }
    
    // Update hub if needed
    if (window.screenManager && state.currentScreen === 'hub') {
        window.screenManager.goToScreen('hub');
    }
    
    // Render avatar helper if in mission screen
    if (state.currentScreen === 'mission' && window.avatarRenderer) {
        const helperContainer = document.getElementById('helperAvatar');
        if (helperContainer) {
            window.avatarRenderer.renderHelperAvatar(helperContainer);
        }
    }
}

/**
 * Global event listeners for all screens
 */
function setupEventListeners() {
    // ===== Welcome Screen =====
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.screenManager.goToScreen('avatar');
        });
    }
    
    // ===== Avatar Selection =====
    document.querySelectorAll('.avatar-card').forEach(card => {
        card.addEventListener('click', () => {
            const avatar = card.getAttribute('data-avatar');
            if (avatar && window.gameState) {
                window.gameState.set({ selectedAvatar: avatar });
                updateHeaderAvatar(avatar);
                window.screenManager.goToScreen('hub');
            }
        });
    });
    
    /**
     * Update header avatar display
     */
    function updateHeaderAvatar(avatarId) {
        const headerImg = document.getElementById('headerAvatarImg');
        const headerName = document.getElementById('headerAvatarName');
        
        if (!headerImg) return;
        
        const avatarMap = {
            'sibawayh': { img: 'avatar-sibawayh.jpeg', name: 'سيبويه' },
            'al-farahidi': { img: 'avatar-al-farahidi.jpeg', name: 'الفراهيدي' }
        };
        
        const avatar = avatarMap[avatarId];
        if (avatar) {
            headerImg.src = `assets/images/${avatar.img}`;
            if (headerName) headerName.textContent = avatar.name;
        }
    }
    
    // Initialize header avatar on page load
    const savedAvatar = window.gameState?.get('selectedAvatar');
    if (savedAvatar) {
        updateHeaderAvatar(savedAvatar);
    }
    
    // ===== Mission Cards (Hub) =====
    document.querySelectorAll('.mission-card .btn-mission').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.mission-card');
            const missionId = card.getAttribute('data-mission');
            if (missionId === 'lab') {
                window.screenManager.goToScreen('lab');
                return;
            }

            if (missionId && window.missionEngine) {
                const currentMission = window.gameState.get('currentMission');
                const totalQuestions = window.gameState.get('totalQuestions');
                const missionCompletedPendingFinalize = window.gameState.get('missionCompletedPendingFinalize');

                if (currentMission === missionId && totalQuestions > 0 && !missionCompletedPendingFinalize) {
                    window.screenManager.goToScreen('mission');
                    window.missionUI.loadCurrentQuestion();
                    return;
                }

                window.missionEngine.startMission(missionId);
                window.screenManager.goToScreen('mission');
                window.missionUI.loadCurrentQuestion();
            }
        });
    });
    
    // ===== Mission Screen Buttons =====
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.screenManager.goToScreen('hub');
            window.popupSystem.closeAll();
        });
    }
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn && window.missionUI) {
        submitBtn.addEventListener('click', () => {
            window.missionUI.checkAnswer();
        });
    }
    
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn && window.missionUI) {
        nextBtn.addEventListener('click', () => {
            window.missionUI.nextQuestion();
        });
    }
    
    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn && window.missionUI) {
        hintBtn.addEventListener('click', () => {
            window.missionUI.displayHint();
        });
    }
    
    // ===== Hint Popup Buttons =====
    const hintRetryBtn = document.getElementById('hintRetryBtn');
    if (hintRetryBtn) {
        hintRetryBtn.addEventListener('click', () => {
            window.popupSystem.hideHintPopup();
        });
    }
    
    const hintMoreBtn = document.getElementById('hintMoreBtn');
    if (hintMoreBtn && window.missionUI) {
        hintMoreBtn.addEventListener('click', () => {
            window.popupSystem.hideHintPopup();
            window.missionUI.displayHint();
        });
    }
    
    // ===== Success Popup Button =====
    const successBtn = document.getElementById('successBtn');
    if (successBtn && window.popupSystem) {
        successBtn.addEventListener('click', () => {
            window.popupSystem.hideSuccessPopup();
        });
    }
    
    // Close popups on overlay click
    document.querySelectorAll('.popup-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            window.popupSystem.hideHintPopup();
            window.popupSystem.hideSuccessPopup();
        });
    });
    
    // Popup close buttons
    document.querySelectorAll('.popup-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            window.popupSystem.hideHintPopup();
            window.popupSystem.hideSuccessPopup();
        });
    });
    
    // ===== Profile Screen Buttons =====
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.screenManager.goToScreen('profile');
        });
    }
    
    const profileBackBtn = document.getElementById('profileBackBtn');
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', () => {
            window.screenManager.goToScreen('hub');
        });
    }
    
    const exportBtn = document.getElementById('exportProgressBtn');
    if (exportBtn && window.StorageManager) {
        exportBtn.addEventListener('click', () => {
            window.StorageManager.exportGameState();
        });
    }
    
    const importBtn = document.getElementById('importProgressBtn');
    const importFile = document.getElementById('importFileInput');
    if (importBtn && importFile && window.StorageManager) {
        importBtn.addEventListener('click', () => {
            importFile.click();
        });
        importFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                window.StorageManager.importGameState(e.target.files[0])
                    .then(() => {
                        alert('تم استيراد التقدم بنجاح! سيتم تحديث الصفحة.');
                        location.reload();
                    })
                    .catch(err => alert('خطأ في استيراد الملف: ' + err.message));
            }
        });
    }
    
    const certificateBtn = document.getElementById('certificateBtn');
    if (certificateBtn && window.generateCertificate) {
        certificateBtn.addEventListener('click', () => {
            window.generateCertificate();
        });
    } else if (certificateBtn) {
        // Fallback if progress.js not loaded yet
        certificateBtn.addEventListener('click', () => {
            alert('شهادة الإتقان: أكمل جميع المهام أولاً!');
        });
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn && window.StorageManager) {
        resetBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من رغبتك في إعادة تعيين كل التقدم؟ لا يمكن التراجع.')) {
                window.StorageManager.clearAllData();
                location.reload();
            }
        });
    }
    
    // ===== Innovation Lab Buttons =====
    const labBackBtn = document.getElementById('labBackBtn');
    if (labBackBtn) {
        labBackBtn.addEventListener('click', () => {
            window.screenManager.goToScreen('hub');
        });
    }
    
    const checkGrammarBtn = document.getElementById('checkGrammarBtn');
    if (checkGrammarBtn) {
        checkGrammarBtn.addEventListener('click', () => {
            const sentenceInput = document.getElementById('sentenceInput');
            if (sentenceInput && window.analyzeSentenceStructure) {
                const sentence = sentenceInput.value.trim();
                const result = window.analyzeSentenceStructure(sentence);
                const feedbackDiv = document.getElementById('grammarFeedback');
                if (feedbackDiv) {
                    feedbackDiv.classList.remove('hidden');
                    feedbackDiv.innerHTML = result.suggestions.map(s => `• ${s}`).join('<br>');
                }
            }
        });
    }
    
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const sentenceInput = document.getElementById('sentenceInput');
            if (sentenceInput && sentenceInput.value.trim()) {
                const sentence = sentenceInput.value.trim();
                const avatar = window.gameState.get('selectedAvatar');
                const labSentences = window.gameState.get('labSentences') || [];
                labSentences.push({
                    sentence: sentence,
                    avatar: avatar,
                    timestamp: new Date().toISOString()
                });
                window.gameState.set({ labSentences });
                alert('تم حفظ جملتك في معرض إبداعاتك!');
                sentenceInput.value = '';
                // Refresh gallery
                if (window.screenManager) {
                    window.screenManager._updateLabUI();
                }
            } else {
                alert('الرجاء كتابة جملة أولاً');
            }
        });
    }
}

/**
 * Update energy bar and keys when state changes
 */
function onGameStateChange(state) {
    updateEnergyAndKeys();
    
    // Update hub progress if on hub screen
    if (window.screenManager && window.screenManager.getCurrentScreen() === 'hub') {
        if (window.screenManager._updateHubUI) {
            window.screenManager._updateHubUI();
        }
    }
    
    // Update profile if on profile screen
    if (window.screenManager && window.screenManager.getCurrentScreen() === 'profile') {
        if (window.screenManager._updateProfileUI) {
            window.screenManager._updateProfileUI();
        }
    }
    
    // Update mission screen header energy
    const missionEnergy = document.getElementById('missionEnergy');
    if (missionEnergy) {
        missionEnergy.textContent = state.energy + '%';
    }
}

/**
 * Update energy bar and keys display
 */
function updateEnergyAndKeys() {
    const energy = window.gameState.get('energy');
    const energyFill = document.getElementById('energyFill');
    const energyText = document.getElementById('energyText');
    if (energyFill) energyFill.style.width = energy + '%';
    if (energyText) energyText.textContent = energy + '%';
    
    // Update keys display (delegated to screenManager if available)
    if (window.screenManager && window.screenManager._renderKeys) {
        window.screenManager._renderKeys();
    }
}

// Export certificate function if progress.js is loaded
// This is a fallback if progress.js missing
window.generateCertificate = function() {
    const state = window.gameState.getState();
    const totalCorrect = state.answersCorrect;
    const energy = state.energy;
    const totalKeys = (() => {
        let count = 0;
        for (const m of Object.values(state.keys)) {
            if (m.gold) count++;
            if (m.silver) count++;
            if (m.bronze) count++;
        }
        return count;
    })();
    
    let level = 'مبتدئ';
    if (energy >= 30) level = 'متوسط';
    if (energy >= 60) level = 'متقدم';
    if (energy >= 90) level = 'خبير';
    
    const certificate = `
═══════════════════════════════════════════════════════
                شهادة إتقان القواعد العربية
═══════════════════════════════════════════════════════

يشهد هذا بأن الطالب الكريم قد أتقن:

✓ الإضافة
✓ الممنوع من الصرف
✓ الأسماء المشتقة
✓ النداء

المستوى: ${level}
عدد الإجابات الصحيحة: ${totalCorrect}
طاقة الفصاحة: ${energy}%
المفاتيح المكتسبة: ${totalKeys}/12

مرافقك في الرحلة: ${state.selectedAvatar === 'sibawayh' ? 'سيبويه' : 'الفراهيدي'}

تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}

═══════════════════════════════════════════════════════
                من إعداد: ليلى بعرفة
═══════════════════════════════════════════════════════
    `;
    
    alert(certificate);
    // Option to download as text file
    const blob = new Blob([certificate], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `certificate_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
};
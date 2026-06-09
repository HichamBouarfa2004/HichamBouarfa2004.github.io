/* ============================================
   المعلم الرفيق - Main Application Entry
   Initialises all modules, sets up event listeners
   ============================================ */

import { appAssets } from './assets.js';

// Expose appAssets globally for use in other modules
window.appAssets = appAssets;

function syncStaticAssets() {
    const imageSources = [
        { selector: 'link[rel="apple-touch-icon"]', src: appAssets.icon, attribute: 'href' },
        { selector: '.app-logo', src: appAssets.icon },
        { selector: '.page-logo', src: appAssets.icon },
        { selector: '.hub-logo', src: appAssets.icon },
        { selector: '.avatar-image[alt="سيبويه"]', src: appAssets.avatars.sibawayh },
        { selector: '.avatar-image[alt="الفراهيدي"]', src: appAssets.avatars['al-farahidi'] },
        { selector: '.island-image[alt="الإضافة"]', src: appAssets.islands.idhafa },
        { selector: '.island-image[alt="الممنوع من الصرف"]', src: appAssets.islands.diptote },
        { selector: '.island-image[alt="الأسماء المشتقة"]', src: appAssets.islands.participles },
        { selector: '.island-image[alt="النداء"]', src: appAssets.islands.vocative },
        { selector: '.island-image[alt="معمل الابتكار"]', src: appAssets.islands.lab }
    ];

    imageSources.forEach(({ selector, src, attribute = 'src' }) => {
        document.querySelectorAll(selector).forEach((element) => {
            element[attribute] = src;
        });
    });

    const hubScreen = document.getElementById('hubScreen');
    if (hubScreen) {
        hubScreen.style.background = `linear-gradient(135deg, rgba(17, 54, 84, 0.85) 0%, rgba(10, 31, 51, 0.85) 100%), url('${appAssets.backgroundOcean}')`;
        hubScreen.style.backgroundSize = 'cover';
        hubScreen.style.backgroundPosition = 'center';
        hubScreen.style.backgroundAttachment = 'fixed';
    }

    document.querySelectorAll('.ocean-background').forEach((element) => {
        element.style.backgroundImage = `linear-gradient(180deg, rgba(17, 54, 84, 0.85) 0%, rgba(10, 31, 51, 0.9) 55%, rgba(5, 26, 42, 0.95) 100%), url('${appAssets.backgroundOcean}')`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
    });
}

// Initialize application core (handle both early and late loading)
function initializeApp() {
    // Safety check: ensure all required modules exist
    if (!window.gameState || !window.screenManager || !window.StorageManager) {
        console.warn('Required modules not ready, retrying app initialization...');
        setTimeout(initializeApp, 100);
        return;
    }

    // 1. Load saved game state from localStorage
    if (window.StorageManager) {
        window.StorageManager.loadGameState();
    }

    syncStaticAssets();
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
    let state = window.gameState.getState();

    // Safety net: auto-finalize any orphaned mission completion (refresh before clicking continue)
    if (state.missionCompletedPendingFinalize && state.currentMission && window.missionEngine) {
        window.missionEngine._silentFinalizeMissionCompletion();
        state = window.gameState.getState();
        if (state.currentScreen === 'mission') {
            if (window.screenManager) window.screenManager.goToScreen('hub');
            return;
        }
    }
    
    // If avatar already selected, navigate to saved screen
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
            'sibawayh': { img: appAssets.avatars.sibawayh, name: 'سيبويه' },
            'al-farahidi': { img: appAssets.avatars['al-farahidi'], name: 'الفراهيدي' }
        };
        
        const avatar = avatarMap[avatarId];
        if (avatar) {
            headerImg.src = avatar.img;
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

    // ===== Profile Admin Content Editor =====
    const ADMIN_PASSWORD = 'laila123';
    const adminLockPanel = document.getElementById('adminLockPanel');
    const adminEditorPanel = document.getElementById('adminEditorPanel');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const unlockAdminBtn = document.getElementById('unlockAdminBtn');
    const lockAdminBtn = document.getElementById('lockAdminBtn');
    const newIslandBtn = document.getElementById('newIslandBtn');
    const islandSelector = document.getElementById('islandSelector');
    const islandIdInput = document.getElementById('islandIdInput');
    const islandTitleInput = document.getElementById('islandTitleInput');
    const islandDescriptionInput = document.getElementById('islandDescriptionInput');
    const islandScenarioInput = document.getElementById('islandScenarioInput');
    const islandRuleInput = document.getElementById('islandRuleInput');
    const islandDifficultyInput = document.getElementById('islandDifficultyInput');
    const islandImageInput = document.getElementById('islandImageInput');
    const saveIslandBtn = document.getElementById('saveIslandBtn');
    const deleteIslandBtn = document.getElementById('deleteIslandBtn');
    const questionsEditorList = document.getElementById('questionsEditorList');
    const questionTypeInput = document.getElementById('questionTypeInput');
    const questionTextInput = document.getElementById('questionTextInput');
    const questionOptionsInput = document.getElementById('questionOptionsInput');
    const questionCorrectIndexInput = document.getElementById('questionCorrectIndexInput');
    const questionCorrectTextInput = document.getElementById('questionCorrectTextInput');
    const questionExplanationInput = document.getElementById('questionExplanationInput');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const mcOptionsWrap = document.getElementById('mcOptionsWrap');
    const fillBlankWrap = document.getElementById('fillBlankWrap');

    if (adminLockPanel && adminEditorPanel && islandSelector) {
        const adminState = {
            unlocked: false,
            selectedMissionId: null,
            draftMission: null,
            editingQuestionIndex: null
        };

        const toSlug = (value) => {
            return String(value || '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        };

        const getSnapshot = () => {
            if (window.getMissionEditorSnapshot) {
                return window.getMissionEditorSnapshot();
            }
            return {
                baseMissions: [],
                customMissions: [],
                missions: Array.isArray(window.missionsData) ? window.missionsData : []
            };
        };

        const getSelectedMissionFromData = () => {
            const missionId = islandSelector.value;
            const mission = (window.missionsData || []).find(item => item.id === missionId);
            return mission ? JSON.parse(JSON.stringify(mission)) : null;
        };

        const refreshRuntimeAfterMissionChanges = () => {
            if (window.gameState) {
                window.gameState.set({});
            }
            if (window.mapUI) {
                window.mapUI.updateIslandStates();
            }
            if (window.screenManager && window.screenManager.getCurrentScreen() === 'profile') {
                window.screenManager._updateProfileUI();
            }
        };

        const resetQuestionForm = () => {
            questionTypeInput.value = 'multiple-choice';
            questionTextInput.value = '';
            questionOptionsInput.value = '';
            questionCorrectIndexInput.value = '1';
            questionCorrectTextInput.value = '';
            questionExplanationInput.value = '';
            adminState.editingQuestionIndex = null;
            addQuestionBtn.textContent = '➕ إضافة سؤال';
            toggleQuestionTypeFields();
        };

        const renderQuestionsList = () => {
            if (!questionsEditorList) return;
            questionsEditorList.innerHTML = '';

            const questions = adminState.draftMission?.questions || [];
            if (!questions.length) {
                questionsEditorList.innerHTML = '<p class="question-item-meta">لا توجد أسئلة بعد.</p>';
                return;
            }

            questions.forEach((question, index) => {
                const item = document.createElement('div');
                item.className = 'question-editor-item';
                item.innerHTML = `
                    <div class="question-item-top">
                        <div>
                            <strong>${index + 1}. ${question.text}</strong>
                            <div class="question-item-meta">النوع: ${question.type === 'multiple-choice' ? 'اختيار من متعدد' : 'إكمال الفراغ'}</div>
                        </div>
                        <div class="question-item-actions">
                            <button class="btn btn-secondary btn-sm" data-action="edit-question" data-index="${index}">تعديل</button>
                            <button class="btn btn-danger btn-sm" data-action="delete-question" data-index="${index}">حذف</button>
                        </div>
                    </div>
                `;
                questionsEditorList.appendChild(item);
            });
        };

        const loadMissionToForm = (mission) => {
            adminState.draftMission = mission ? JSON.parse(JSON.stringify(mission)) : null;
            if (!adminState.draftMission) return;

            islandIdInput.value = adminState.draftMission.id || '';
            islandTitleInput.value = adminState.draftMission.title || '';
            islandDescriptionInput.value = adminState.draftMission.description || '';
            islandScenarioInput.value = adminState.draftMission.scenario || '';
            islandRuleInput.value = adminState.draftMission.rule || '';
            islandDifficultyInput.value = adminState.draftMission.difficulty || 'medium';
            islandImageInput.value = adminState.draftMission.image || '';

            const baseIds = new Set(getSnapshot().baseMissions.map(item => item.id));
            const isBaseMission = baseIds.has(adminState.draftMission.id);
            islandIdInput.disabled = isBaseMission;
            deleteIslandBtn.disabled = isBaseMission;

            resetQuestionForm();
            renderQuestionsList();
        };

        const loadSelectedMission = () => {
            const selectedMission = getSelectedMissionFromData();
            adminState.selectedMissionId = selectedMission?.id || null;
            loadMissionToForm(selectedMission);
        };

        const repopulateMissionSelector = () => {
            const current = islandSelector.value;
            const missions = Array.isArray(window.missionsData) ? window.missionsData : [];
            islandSelector.innerHTML = '';
            missions.forEach((mission) => {
                const option = document.createElement('option');
                option.value = mission.id;
                option.textContent = mission.title;
                islandSelector.appendChild(option);
            });

            const exists = missions.some(mission => mission.id === current);
            if (exists) islandSelector.value = current;
            else if (missions.length) islandSelector.value = missions[0].id;

            loadSelectedMission();
        };

        const toggleQuestionTypeFields = () => {
            const type = questionTypeInput.value;
            const isMultipleChoice = type === 'multiple-choice';
            mcOptionsWrap.classList.toggle('hidden', !isMultipleChoice);
            fillBlankWrap.classList.toggle('hidden', isMultipleChoice);
        };

        unlockAdminBtn?.addEventListener('click', () => {
            const password = adminPasswordInput.value.trim();
            if (password !== ADMIN_PASSWORD) {
                alert('كلمة المرور غير صحيحة');
                return;
            }

            adminState.unlocked = true;
            adminLockPanel.classList.add('hidden');
            adminEditorPanel.classList.remove('hidden');
            repopulateMissionSelector();
        });

        lockAdminBtn?.addEventListener('click', () => {
            adminState.unlocked = false;
            adminLockPanel.classList.remove('hidden');
            adminEditorPanel.classList.add('hidden');
            adminPasswordInput.value = '';
        });

        islandSelector?.addEventListener('change', () => {
            loadSelectedMission();
        });

        newIslandBtn?.addEventListener('click', () => {
            const newMission = {
                id: '',
                title: '',
                description: '',
                scenario: '',
                rule: '',
                difficulty: 'medium',
                image: '',
                questions: []
            };

            adminState.selectedMissionId = null;
            loadMissionToForm(newMission);
            islandIdInput.disabled = false;
            deleteIslandBtn.disabled = true;
        });

        saveIslandBtn?.addEventListener('click', () => {
            if (!adminState.draftMission) {
                alert('اختر جزيرة أولاً');
                return;
            }

            const missionId = toSlug(islandIdInput.value);
            if (!missionId) {
                alert('معرّف الجزيرة مطلوب وبالأحرف الإنجليزية');
                return;
            }

            adminState.draftMission.id = missionId;
            adminState.draftMission.title = islandTitleInput.value.trim();
            adminState.draftMission.description = islandDescriptionInput.value.trim();
            adminState.draftMission.scenario = islandScenarioInput.value.trim();
            adminState.draftMission.rule = islandRuleInput.value.trim();
            adminState.draftMission.difficulty = islandDifficultyInput.value;
            adminState.draftMission.image = islandImageInput.value.trim();

            if (!adminState.draftMission.questions.length) {
                alert('أضف سؤالاً واحداً على الأقل قبل الحفظ');
                return;
            }

            try {
                window.upsertMission(adminState.draftMission);
                repopulateMissionSelector();
                islandSelector.value = missionId;
                loadSelectedMission();
                refreshRuntimeAfterMissionChanges();
                alert('تم حفظ الجزيرة بنجاح');
            } catch (error) {
                alert(error.message || 'فشل حفظ الجزيرة');
            }
        });

        deleteIslandBtn?.addEventListener('click', () => {
            const missionId = adminState.draftMission?.id;
            if (!missionId) return;

            const baseIds = new Set(getSnapshot().baseMissions.map(item => item.id));
            if (baseIds.has(missionId)) {
                alert('لا يمكن حذف الجزر الأساسية، يمكنك تعديلها فقط');
                return;
            }

            if (!confirm('هل تريد حذف هذه الجزيرة؟')) return;

            window.removeCustomMission(missionId);
            repopulateMissionSelector();
            refreshRuntimeAfterMissionChanges();
        });

        questionTypeInput?.addEventListener('change', toggleQuestionTypeFields);

        addQuestionBtn?.addEventListener('click', () => {
            if (!adminState.draftMission) {
                alert('اختر جزيرة أولاً');
                return;
            }

            const type = questionTypeInput.value;
            const text = questionTextInput.value.trim();
            const explanation = questionExplanationInput.value.trim();

            if (!text) {
                alert('نص السؤال مطلوب');
                return;
            }

            let question = null;
            if (type === 'multiple-choice') {
                const options = questionOptionsInput.value
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean);
                const correctIndex = parseInt(questionCorrectIndexInput.value, 10) - 1;

                if (options.length < 2) {
                    alert('أدخل خيارين على الأقل');
                    return;
                }
                if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
                    alert('رقم الإجابة الصحيحة غير صالح');
                    return;
                }

                question = {
                    text,
                    type,
                    options,
                    correct: correctIndex,
                    explanation
                };
            } else {
                const correctText = questionCorrectTextInput.value.trim();
                if (!correctText) {
                    alert('الإجابة الصحيحة مطلوبة');
                    return;
                }

                question = {
                    text,
                    type,
                    correct: correctText,
                    explanation
                };
            }

            if (adminState.editingQuestionIndex !== null) {
                adminState.draftMission.questions[adminState.editingQuestionIndex] = question;
            } else {
                adminState.draftMission.questions.push(question);
            }

            resetQuestionForm();
            renderQuestionsList();
        });

        questionsEditorList?.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button || !adminState.draftMission) return;

            const action = button.getAttribute('data-action');
            const index = parseInt(button.getAttribute('data-index'), 10);
            if (Number.isNaN(index)) return;

            if (action === 'delete-question') {
                adminState.draftMission.questions.splice(index, 1);
                resetQuestionForm();
                renderQuestionsList();
                return;
            }

            if (action === 'edit-question') {
                const question = adminState.draftMission.questions[index];
                if (!question) return;

                adminState.editingQuestionIndex = index;
                questionTypeInput.value = question.type;
                toggleQuestionTypeFields();
                questionTextInput.value = question.text || '';
                questionExplanationInput.value = question.explanation || '';

                if (question.type === 'multiple-choice') {
                    questionOptionsInput.value = (question.options || []).join('\n');
                    questionCorrectIndexInput.value = String((question.correct || 0) + 1);
                    questionCorrectTextInput.value = '';
                } else {
                    questionCorrectTextInput.value = question.correct || '';
                    questionOptionsInput.value = '';
                    questionCorrectIndexInput.value = '1';
                }

                addQuestionBtn.textContent = '💾 حفظ تعديل السؤال';
            }
        });

        toggleQuestionTypeFields();
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
    const missionEnergyFill = document.getElementById('missionEnergyFill');
    if (missionEnergyFill) {
        missionEnergyFill.style.width = state.energy + '%';
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
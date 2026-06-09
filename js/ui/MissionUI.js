/* ============================================
   المعلم الرفيق - Mission UI
   Renders questions, handles answer submission, sorting
   ============================================ */

import Sortable from 'sortablejs';

class MissionUI {
    constructor() {
        this.missionEngine = window.missionEngine;
        this.gameState = window.gameState;
        this.scoringEngine = window.scoringEngine;
        this.popupSystem = window.popupSystem;
        this.screenManager = window.screenManager;
        this.currentSortableInstances = null;
        this.isTransitioning = false;
    }

    _setCompanionMessage(message) {
        const bubble = document.getElementById('companionBubble');
        if (bubble) bubble.textContent = message;
    }

    _setCompanionReaction(reaction) {
        const helper = document.getElementById('avatarHelper');
        if (!helper) return;
        const reactions = ['reaction-happy', 'reaction-excited', 'reaction-thoughtful', 'reaction-encouraging'];
        helper.classList.remove(...reactions);
        if (reaction) helper.classList.add(reaction);
    }

    _hideVictoryDrawer() {
        if (this.popupSystem) {
            this.popupSystem.hideVictoryDrawer();
        }
    }

    _popSelectedAnswer() {
        const selected = document.querySelector('.option.selected');
        if (!selected) return;
        selected.classList.add('pop');
        setTimeout(() => selected.classList.remove('pop'), 220);
    }

    loadCurrentQuestion() {
        if (this.isTransitioning) return;

        const mission = this.missionEngine.getCurrentMission();
        const question = this.missionEngine.getCurrentQuestion();
        if (!mission || !question) return;

        const missionTitle = document.getElementById('missionTitle');
        const scenarioText = document.getElementById('scenarioText');
        const questionCounter = document.getElementById('questionCounter');
        const progressFill = document.getElementById('progressFill');
        const currentQ = this.gameState.get('currentQuestion');
        const total = this.gameState.get('totalQuestions');
        const progressPct = total > 0 ? ((currentQ) / total) * 100 : 0;

        if (missionTitle) missionTitle.textContent = mission.title;
        if (scenarioText) scenarioText.textContent = mission.scenario;
        if (questionCounter) questionCounter.textContent = `${currentQ + 1}/${total}`;
        if (progressFill) progressFill.style.width = `${progressPct}%`;
        const introMessages = {
            'multiple-choice': 'اختر الإجابة التي تراها أدق.',
            'fill-blank': 'املأ الفراغ بالكلمة المناسبة.',
            'sorting': 'اسحب كل كلمة إلى مكانها الصحيح.'
        };
        this._setCompanionMessage(introMessages[question.type] || 'أنا معك. أجب على السؤال.');
        this._setCompanionReaction('reaction-encouraging');
        this._hideVictoryDrawer();
        if (this.popupSystem) this.popupSystem.hideSuccessToast();

        const questionBox = document.querySelector('.question-box');
        if (questionBox) {
            questionBox.classList.remove('fade-in');
            void questionBox.offsetWidth;
            questionBox.classList.add('fade-in');
        }

        const questionTextEl = document.getElementById('questionText');
        if (questionTextEl) questionTextEl.textContent = question.text;

        const feedbackBox = document.getElementById('feedbackBox');
        if (feedbackBox) {
            feedbackBox.classList.remove('shake');
            feedbackBox.classList.add('hidden');
        }

        const submitBtn = document.getElementById('submitBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (submitBtn) submitBtn.classList.remove('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');

        this.gameState.set({ hintsUsed: 0, currentQuestionIncorrect: 0 });

        const questionContent = document.getElementById('questionContent');
        if (questionContent) {
            questionContent.innerHTML = '';
            this._renderQuestionByType(question, questionContent);
        }

        if (window.avatarRenderer) {
            const helperContainer = document.getElementById('helperAvatar');
            window.avatarRenderer.renderHelperAvatar(helperContainer);
        }
    }

    _renderQuestionByType(question, container) {
        switch (question.type) {
            case 'multiple-choice':
                this._renderMultipleChoice(question, container);
                break;
            case 'fill-blank':
                this._renderFillBlank(question, container);
                break;
            case 'sorting':
                this._renderSorting(question, container);
                break;
            default:
                container.innerHTML = '<p>نوع السؤال غير معروف</p>';
        }
    }

    _renderMultipleChoice(question, container) {
        const updateSelectedOption = () => {
            container.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            const checked = container.querySelector('input[name="option"]:checked');
            if (checked) {
                const selectedOption = checked.closest('.option');
                if (selectedOption) selectedOption.classList.add('selected');
            }
        };

        question.options.forEach((option, idx) => {
            const label = document.createElement('label');
            label.className = 'option';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'option';
            input.value = idx;
            input.addEventListener('change', updateSelectedOption);
            const span = document.createElement('span');
            span.textContent = option;
            label.appendChild(span);
            label.appendChild(input);
            container.appendChild(label);
        });
    }

    _renderFillBlank(question, container) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'fill-input';
        input.placeholder = 'اكتب إجابتك هنا...';
        input.dir = 'rtl';
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const submitBtn = document.getElementById('submitBtn');
                if (submitBtn && !submitBtn.classList.contains('hidden')) {
                    this.checkAnswer();
                }
            }
        });
        container.appendChild(input);

        if (question.sentence) {
            const context = document.createElement('p');
            context.style.marginTop = 'var(--spacing-md)';
            context.style.color = 'var(--secondary-text)';
            context.textContent = question.sentence;
            container.appendChild(context);
        }
    }

    _renderSorting(question, container) {
        if (this.currentSortableInstances) {
            this.currentSortableInstances.forEach(inst => inst.destroy());
            this.currentSortableInstances = null;
        }

        const categoriesContainer = document.createElement('div');
        categoriesContainer.style.display = 'grid';
        categoriesContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        categoriesContainer.style.gap = 'var(--spacing-lg)';

        const categoryKeys = Object.keys(question.categories);
        categoryKeys.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'sort-category';
            const title = document.createElement('h4');
            title.textContent = category;
            const list = document.createElement('div');
            list.className = 'sort-list';
            list.id = `sort-${category.replace(/\s+/g, '-').toLowerCase()}`;
            categoryDiv.appendChild(title);
            categoryDiv.appendChild(list);
            categoriesContainer.appendChild(categoryDiv);
        });
        container.appendChild(categoriesContainer);

        const itemsPool = document.createElement('div');
        itemsPool.className = 'sort-items-pool';
        itemsPool.style.display = 'flex';
        itemsPool.style.flexWrap = 'wrap';
        itemsPool.style.gap = 'var(--spacing-md)';
        itemsPool.style.marginTop = 'var(--spacing-lg)';
        itemsPool.style.padding = 'var(--spacing-md)';
        itemsPool.style.border = '1px dashed var(--border-color)';
        itemsPool.style.borderRadius = 'var(--radius-md)';
        itemsPool.style.backgroundColor = 'var(--bg-cream)';

        question.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'sort-item';
            itemDiv.textContent = item;
            itemDiv.setAttribute('data-item', item);
            itemsPool.appendChild(itemDiv);
        });
        container.appendChild(itemsPool);

        if (typeof Sortable !== 'undefined') {
            const sortableLists = container.querySelectorAll('.sort-list');
            const groupConfig = { name: 'shared', pull: true, revertClone: false, put: true };
            this.currentSortableInstances = [];
            sortableLists.forEach(list => {
                const sortable = new Sortable(list, {
                    group: groupConfig,
                    animation: 200,
                    touchStartThreshold: 2,
                    ghostClass: 'sortable-ghost',
                    dragClass: 'sortable-drag'
                });
                this.currentSortableInstances.push(sortable);
            });
            const poolSortable = new Sortable(itemsPool, {
                group: groupConfig,
                animation: 200,
                touchStartThreshold: 2
            });
            this.currentSortableInstances.push(poolSortable);
        } else {
            console.warn('SortableJS not loaded');
        }
    }

    getUserAnswer() {
        const question = this.missionEngine.getCurrentQuestion();
        if (!question) return null;

        switch (question.type) {
            case 'multiple-choice': {
                const selected = document.querySelector('input[name="option"]:checked');
                return selected ? parseInt(selected.value) : null;
            }
            case 'fill-blank': {
                const input = document.querySelector('.fill-input');
                return input ? input.value.trim() : '';
            }
            case 'sorting': {
                const container = document.getElementById('questionContent');
                if (container && window.getSortingState) {
                    return window.getSortingState(container);
                }
                return null;
            }
            default:
                return null;
        }
    }

    async checkAnswer() {
        if (this.isTransitioning) {
            this.popupSystem.showFeedback('الرجاء الانتظار...', 'error');
            return;
        }

        const userAnswer = this.getUserAnswer();
        if (userAnswer === null || userAnswer === '') {
            this.popupSystem.showFeedback('الرجاء الإجابة قبل التحقق', 'error');
            return;
        }

        const isCorrect = this.missionEngine.validateCurrentAnswer(userAnswer);
        const hintsUsedForQuestion = this.gameState.get('hintsUsed');

        this.missionEngine.recordAnswer(isCorrect, hintsUsedForQuestion);

        if (isCorrect) {
            this._popSelectedAnswer();
            this._handleCorrect();
        } else {
            this._handleIncorrect();
        }
    }

    _handleCorrect() {
        const missionCompletedPendingFinalize = this.gameState.get('missionCompletedPendingFinalize');

        if (missionCompletedPendingFinalize) {
            this.popupSystem.showVictoryDrawer({
                title: 'مذهل!',
                message: 'أتممت المهمة بالكامل. استعد للعودة إلى الخريطة.',
                continueLabel: 'العودة إلى الخريطة',
                onContinue: () => {
                    this.isTransitioning = true;
                    const result = this.missionEngine.finalizeMissionCompletion();
                    this.popupSystem.showSuccessPopup(result?.keyType || 'bronze', () => {
                        this.screenManager.goToScreen('hub');
                        this.isTransitioning = false;
                    });
                }
            });
            return;
        }

        this.popupSystem.showSuccessToast('أحسنت!', () => {
            this.loadCurrentQuestion();
        });
    }

    _handleIncorrect() {
        const errorMessages = [
            'حاول مرة أخرى، ركز على الفكرة الأساسية في السؤال.',
            'ليس هذه المرة. أعد قراءة السؤال بتركيز.',
            'تقريباً! فكر في القاعدة النحوية المطلوبة.'
        ];
        const attempt = this.gameState.get('currentQuestionIncorrect') || 0;
        this.popupSystem.showFeedback('الخطأ خطوة نحو الصواب! حاول مجدداً', 'error');
        this._setCompanionMessage(errorMessages[Math.min(attempt, errorMessages.length - 1)]);
        this._setCompanionReaction('reaction-encouraging');

        const feedbackBox = document.getElementById('feedbackBox');
        if (feedbackBox) {
            feedbackBox.classList.remove('shake');
            void feedbackBox.offsetWidth;
            feedbackBox.classList.add('shake');
        }

        const incorrectCount = this.gameState.get('currentQuestionIncorrect');
        if (incorrectCount === 2) {
            setTimeout(() => {
                this._setCompanionMessage('سأعطيك تلميحا الآن ليساعدك على الحل.');
                this._setCompanionReaction('reaction-thoughtful');
                this.displayHint();
            }, 500);
        }
    }

    nextQuestion() {
        if (this.isTransitioning) return;
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn && !nextBtn.classList.contains('hidden')) {
            this.loadCurrentQuestion();
        }
    }

    displayHint() {
        const mission = this.missionEngine.getCurrentMission();
        const questionIndex = this.gameState.get('currentQuestion');
        if (!mission) return;

        const hints = window.getHintsForQuestion(mission.id, questionIndex);
        const hintsUsed = this.gameState.get('hintsUsed');

        if (hintsUsed >= hints.length) {
            this._setCompanionMessage('هذا آخر تلميح. حاول تطبيق القاعدة مباشرة.');
            this._setCompanionReaction('reaction-thoughtful');
            this.popupSystem.showHintPopup(`القاعدة الأساسية: ${mission.rule}`, false);
        } else {
            const hasMore = hintsUsed + 1 < hints.length;
            this._setCompanionMessage('تلميح ذكي قادم. اقرأه ثم جرّب مرة أخرى.');
            this._setCompanionReaction('reaction-encouraging');
            this.popupSystem.showHintPopup(hints[hintsUsed], hasMore);
            this.missionEngine.incrementHintsUsed();
        }
    }
}

const missionUI = new MissionUI();
window.missionUI = missionUI;
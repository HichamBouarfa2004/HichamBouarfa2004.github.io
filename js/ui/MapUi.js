/* ============================================
   المعلم الرفيق - World Map UI (Fixed)
   ============================================ */

class MapUI {
    constructor() {
        this.gameState = window.gameState;
        this.missions = [];
        this.missionStageMap = {};
        this.mapDragInitialized = false;
        this.clickEventsBound = false;
        this._refreshMissionConfig();
    }

    _refreshMissionConfig() {
        const missionList = Array.isArray(window.missionsData) ? window.missionsData : [];
        this.missions = missionList.map(mission => mission.id);
        this.missionStageMap = {};
        this.missions.forEach((missionId, index) => {
            this.missionStageMap[missionId] = index + 1;
        });
    }

    _getIslandImage(mission) {
        if (mission?.image) return mission.image;
        if (window.appAssets?.islands?.[mission.id]) return window.appAssets.islands[mission.id];
        return 'assets/images/island-idhafa.jpeg';
    }

    _getIslandPosition(index, total) {
        const defaultFour = [
            { top: '16%', left: '16%' },
            { top: '16%', left: '72%' },
            { top: '58%', left: '16%' },
            { top: '58%', left: '72%' }
        ];

        if (total <= 4 && defaultFour[index]) {
            return defaultFour[index];
        }

        const angle = ((Math.PI * 2) / Math.max(total, 1)) * index - (Math.PI / 2);
        const radiusX = 34;
        const radiusY = 30;
        const x = 50 + (Math.cos(angle) * radiusX);
        const y = 46 + (Math.sin(angle) * radiusY);
        return {
            top: `${Math.max(8, Math.min(78, y))}%`,
            left: `${Math.max(8, Math.min(82, x))}%`
        };
    }

    _renderIslandsFromData() {
        const container = document.querySelector('.islands-container');
        if (!container) return;

        this._refreshMissionConfig();

        container.querySelectorAll('.island-card[data-mission]:not([data-mission="lab"])').forEach(el => el.remove());

        const missions = Array.isArray(window.missionsData) ? window.missionsData : [];
        missions.forEach((mission, index) => {
            const island = document.createElement('div');
            const missionId = mission.id;
            island.className = 'island-card island';
            island.dataset.mission = missionId;
            island.id = `island-${missionId}`;

            const position = this._getIslandPosition(index, missions.length);
            island.style.top = position.top;
            island.style.left = position.left;

            const difficultyStars = mission.difficulty === 'easy' ? '⭐' : mission.difficulty === 'hard' ? '⭐⭐⭐' : '⭐⭐';
            const difficultyLabel = mission.difficulty === 'easy' ? 'سهل' : mission.difficulty === 'hard' ? 'صعب' : 'متوسط';

            island.innerHTML = `
                <div class="island-visual">
                    <img src="${this._getIslandImage(mission)}" alt="${mission.title}" class="island-image" loading="lazy">
                    <div class="island-overlay" aria-hidden="true"></div>
                    <button class="island-rule-btn" data-mission-id="${missionId}" title="عرض القاعدة" aria-label="عرض القاعدة">📖</button>
                </div>
                <div class="island-label-card">
                    <span class="island-order">${index + 1}</span>
                    <div class="island-title">${mission.title}</div>
                    <div class="island-meta-row">
                        <span class="island-difficulty" title="${difficultyLabel}">${difficultyStars}</span>
                        <div class="island-keys"><span class="key-glyph" aria-hidden="true">🔑</span><span><span id="keys-${missionId}">0</span>/3</span></div>
                    </div>
                </div>
            `;

            container.appendChild(island);
        });

        const labIsland = container.querySelector('#island-lab');
        if (labIsland) {
            labIsland.style.top = '50%';
            labIsland.style.left = '50%';
            labIsland.style.transform = 'translate(-50%, -50%)';
        }
    }

    initMap() {
        this._renderIslandsFromData();
        this.updateIslandStates();
        this.attachIslandClickEvents();
        this.enableDragCanvas();
        if (!this._resizeBound) {
            this._resizeBound = () => this.updateIslandStates();
            window.addEventListener('resize', this._resizeBound);
        }
    }

    updateIslandStates() {
        this._renderIslandsFromData();
        const keys = this.gameState.get('keys');
        const sessionAnswers = this.gameState.get('sessionAnswers');
        const highestUnlockedStage = this.gameState.get('highestUnlockedStage') || 1;
        let firstIncompleteMission = null;

        this.missions.forEach(missionId => {
            const missionData = window.missionsData?.find(m => m.id === missionId);
            if (!missionData) return;
            const missionAnswers = sessionAnswers.filter(a => a.mission === missionId);
            const correctCount = missionAnswers.filter(a => a.correct).length;
            if (!firstIncompleteMission && correctCount < missionData.questions.length) {
                firstIncompleteMission = missionId;
            }
        });

        this.missions.forEach(missionId => {
            const island = document.getElementById(`island-${missionId}`);
            if (!island) return;
            const stageNumber = this.missionStageMap[missionId] || 1;
            const isLocked = stageNumber > highestUnlockedStage;

            let earnedCount = 0;
            if (keys[missionId]) {
                if (keys[missionId].gold) earnedCount = 3;
                else if (keys[missionId].silver) earnedCount = 2;
                else if (keys[missionId].bronze) earnedCount = 1;
            }

            const missionData = window.missionsData?.find(m => m.id === missionId);
            let masteryReached = false;
            if (missionData) {
                const missionAnswers = sessionAnswers.filter(a => a.mission === missionId);
                const correctCount = missionAnswers.filter(a => a.correct).length;
                const allCorrect = (correctCount === missionData.questions.length);
                masteryReached = allCorrect && earnedCount === 3;
            }

            const keySpan = island.querySelector(`#keys-${missionId}`);
            if (keySpan) keySpan.textContent = earnedCount;

            island.classList.remove('island-completed', 'island-locked', 'island-active', 'island-unlocking');
            island.dataset.stage = String(stageNumber);
            this._syncLockOverlay(island, isLocked);

            if (isLocked) {
                island.classList.add('island-locked');
                island.setAttribute('aria-disabled', 'true');
                island.style.pointerEvents = 'none';
            } else {
                island.removeAttribute('aria-disabled');
                island.style.pointerEvents = 'auto';
            }

            if (masteryReached) {
                island.classList.add('island-completed');
                let checkmark = island.querySelector('.completion-mark');
                if (!checkmark) {
                    checkmark = document.createElement('div');
                    checkmark.className = 'completion-mark';
                    checkmark.textContent = '✓';
                    island.appendChild(checkmark);
                }
            } else {
                const existing = island.querySelector('.completion-mark');
                if (existing) existing.remove();
            }

            if (missionId === firstIncompleteMission && !isLocked) {
                island.classList.add('island-active');
            }
        });

        const totalKeys = this.getTotalKeys();
        const labIsland = document.getElementById('island-lab');
        if (labIsland) {
            if (this.gameState.get('labUnlocked')) {
                this._applyLabUnlockedVisual(labIsland);
            } else if (totalKeys >= 4) {
                this.unlockLab();
            }
            if (firstIncompleteMission === null) labIsland.classList.add('island-active');
            else labIsland.classList.remove('island-active');
        }

        // Only render SVG paths on desktop/tablet (skip on small phones for performance)
        if (window.innerWidth >= 480) {
            requestAnimationFrame(() => this.renderProgressPaths(highestUnlockedStage));
        }
    }

    renderProgressPaths(highestUnlockedStage) {
        const svg = document.getElementById('progressPathLayer');
        const mapContainer = document.querySelector('.world-map-container');
        if (!svg || !mapContainer) return;
        const containerRect = mapContainer.getBoundingClientRect();

        const width = containerRect.width || mapContainer.clientWidth;
        const height = containerRect.height || mapContainer.clientHeight;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.innerHTML = '';

        // Build all pairs: 1→2, 2→3, 3→4, 4→lab
        const allPairs = [];
        for (let i = 0; i < this.missions.length - 1; i++) {
            allPairs.push([this.missions[i], this.missions[i + 1]]);
        }
        // Final pair: last mission → lab
        const lastMissionId = this.missions[this.missions.length - 1];
        if (lastMissionId) allPairs.push([lastMissionId, 'lab']);

        allPairs.forEach(([fromMissionId, toMissionId]) => {
            const fromCard = document.querySelector(`#island-${fromMissionId} .island-label-card`);
            const toCard = document.querySelector(`#island-${toMissionId} .island-label-card`);
            if (!fromCard || !toCard) return;

            const fromRect = fromCard.getBoundingClientRect();
            const toRect = toCard.getBoundingClientRect();
            const startX = (fromRect.left + fromRect.width / 2) - containerRect.left;
            const startY = fromRect.bottom - containerRect.top;
            const endX = (toRect.left + toRect.width / 2) - containerRect.left;
            const endY = toRect.top - containerRect.top;
            const controlY = startY + Math.max(60, Math.abs(endY - startY) * 0.35);

            const fromStage = this.missionStageMap[fromMissionId] || 1;
            const toStage = this.missionStageMap[toMissionId] || 99;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`);
            path.classList.add('path-segment');

            if (toStage <= highestUnlockedStage) {
                path.classList.add('completed');
            } else if (fromStage <= highestUnlockedStage && toStage > highestUnlockedStage) {
                path.classList.add('active');
            } else {
                path.classList.add('dimmed');
            }

            svg.appendChild(path);
        });
    }

    _syncLockOverlay(island, isLocked) {
        const visual = island.querySelector('.island-visual');
        if (!visual) return;
        let lockOverlay = visual.querySelector('.island-lock-overlay');
        if (isLocked) {
            if (!lockOverlay) {
                lockOverlay = document.createElement('div');
                lockOverlay.className = 'island-lock-overlay';
                lockOverlay.innerHTML = '<div class="island-lock-icon">🔒</div>';
                visual.appendChild(lockOverlay);
            }
            lockOverlay.classList.remove('hidden');
            island.classList.add('island-locked');
        } else if (lockOverlay) {
            lockOverlay.remove();
        }
    }

    enableDragCanvas() {
        if (this.mapDragInitialized) return;
        const mapContainer = document.querySelector('.world-map-container');
        if (!mapContainer) return;
        
        // Only enable drag on medium/large phones (480px+), skip on small phones with grid layout
        const shouldEnableDrag = window.innerWidth >= 480;
        if (!shouldEnableDrag) return;
        
        this.mapDragInitialized = true;
        const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

        mapContainer.addEventListener('pointerdown', (e) => {
            if (!isMobile()) return;
            mapContainer.dataset.dragging = 'true';
            mapContainer.dataset.startX = String(e.clientX);
            mapContainer.dataset.startY = String(e.clientY);
            mapContainer.dataset.startScrollLeft = String(mapContainer.scrollLeft);
            mapContainer.dataset.startScrollTop = String(mapContainer.scrollTop);
            mapContainer.classList.add('is-dragging');
        });

        mapContainer.addEventListener('pointermove', (e) => {
            if (mapContainer.dataset.dragging !== 'true' || !isMobile()) return;
            const deltaX = e.clientX - parseFloat(mapContainer.dataset.startX || '0');
            const deltaY = e.clientY - parseFloat(mapContainer.dataset.startY || '0');
            const startScrollLeft = parseFloat(mapContainer.dataset.startScrollLeft || '0');
            const startScrollTop = parseFloat(mapContainer.dataset.startScrollTop || '0');
            mapContainer.scrollLeft = startScrollLeft - deltaX;
            mapContainer.scrollTop = startScrollTop - deltaY;
        });

        const endDrag = () => {
            mapContainer.dataset.dragging = 'false';
            mapContainer.classList.remove('is-dragging');
        };
        mapContainer.addEventListener('pointerup', endDrag);
        mapContainer.addEventListener('pointercancel', endDrag);
        mapContainer.addEventListener('pointerleave', endDrag);
    }

    playUnlockSequence(stageNumber) {
        const missionId = this.missions[stageNumber - 1];
        const island = missionId ? document.querySelector(`.island[data-mission="${missionId}"]`) : null;
        const mapContainer = document.querySelector('.world-map-container');
        const svg = document.getElementById('progressPathLayer');
        if (!island || !mapContainer) return;

        island.classList.remove('island-locked');
        island.classList.add('island-unlocking');
        mapContainer.classList.add('path-unlock-flash');
        const lockOverlay = island.querySelector('.island-lock-overlay');
        if (lockOverlay) lockOverlay.classList.add('island-lock-breaking');

        if (svg) {
            const containerRect = mapContainer.getBoundingClientRect();
            const card = island.querySelector('.island-label-card');
            if (card) {
                const cardRect = card.getBoundingClientRect();
                const burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                burst.classList.add('unlock-burst');
                burst.setAttribute('cx', ((cardRect.left + cardRect.width / 2) - containerRect.left).toString());
                burst.setAttribute('cy', (cardRect.top - containerRect.top).toString());
                burst.setAttribute('r', '4');
                svg.appendChild(burst);
                setTimeout(() => burst.remove(), 1100);
            }
        }

        setTimeout(() => {
            island.classList.remove('island-unlocking');
            mapContainer.classList.remove('path-unlock-flash');
            if (lockOverlay) {
                lockOverlay.classList.add('hidden');
                lockOverlay.classList.remove('island-lock-breaking');
            }
            this.updateIslandStates();
        }, 1300);
    }

    _applyLabUnlockedVisual(labIsland) {
        const lockOverlay = labIsland.querySelector('.lab-locked-overlay');
        if (lockOverlay) lockOverlay.style.display = 'none';
        const labKeys = labIsland.querySelector('.island-keys');
        if (labKeys) {
            labKeys.classList.remove('locked');
            labKeys.innerHTML = '🔓 <span>مفتوح</span>';
        }
        labIsland.classList.add('lab-unlocked');
    }

    unlockLab() {
        if (this.gameState.get('labUnlocked')) {
            const labIsland = document.getElementById('island-lab');
            if (labIsland) this._applyLabUnlockedVisual(labIsland);
            return;
        }
        const labIsland = document.getElementById('island-lab');
        if (!labIsland) return;
        const lockOverlay = labIsland.querySelector('.lab-locked-overlay');
        if (lockOverlay) lockOverlay.style.display = 'none';
        const labKeys = labIsland.querySelector('.island-keys');
        if (labKeys) {
            labKeys.classList.remove('locked');
            labKeys.innerHTML = '🔓 <span>مفتوح</span>';
        }
        labIsland.classList.add('lab-unlocked');
        this.gameState.set({ labUnlocked: true });
    }

    attachIslandClickEvents() {
        if (this.clickEventsBound) return;
        this.clickEventsBound = true;

        const container = document.querySelector('.islands-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const ruleBtn = e.target.closest('.island-rule-btn');
            if (ruleBtn) {
                const missionId = ruleBtn.getAttribute('data-mission-id');
                if (missionId) this._showRulePopup(missionId);
                return;
            }

            const island = e.target.closest('.island-card');
            if (!island) return;

            const missionId = island.getAttribute('data-mission');
            if (!missionId) return;

            if (missionId === 'lab') {
                if (this.gameState.get('labUnlocked')) window.screenManager.goToScreen('lab');
                else window.popupSystem.showFeedback('تحتاج 4 مفاتيح لفتح معمل الابتكار!', 'error');
                return;
            }

            if (!this.missions.includes(missionId)) return;
            if (island.classList.contains('island-locked')) return;

            const currentMission = this.gameState.get('currentMission');
            const totalQuestions = this.gameState.get('totalQuestions');
            const missionCompleted = this.gameState.get('missionCompletedPendingFinalize');

            if (currentMission === missionId && totalQuestions > 0 && !missionCompleted) {
                window.screenManager.goToScreen('mission');
                if (window.missionUI) window.missionUI.loadCurrentQuestion();
                return;
            }

            window.missionEngine.startMission(missionId);
            window.screenManager.goToScreen('mission');
            if (window.missionUI) window.missionUI.loadCurrentQuestion();
        });
    }

    _showRulePopup(missionId) {
        const mission = window.missionsData?.find(m => m.id === missionId);
        if (!mission) return;

        const popup = document.getElementById('rulePopup');
        const title = document.getElementById('rulePopupTitle');
        const body = document.getElementById('rulePopupBody');
        const closeBtn = document.getElementById('rulePopupCloseBtn');
        if (!popup || !body) return;

        if (title) title.textContent = `📖 القاعدة: ${mission.title}`;
        body.textContent = mission.rule;

        popup.classList.remove('hidden');

        const closeHandler = () => {
            popup.classList.add('hidden');
            closeBtn?.removeEventListener('click', closeHandler);
            backdrop?.removeEventListener('click', closeHandler);
            document.removeEventListener('keydown', escapeHandler);
        };

        const backdrop = popup.querySelector('.rule-popup-backdrop');

        const escapeHandler = (ev) => {
            if (ev.key === 'Escape') closeHandler();
        };

        closeBtn?.addEventListener('click', closeHandler);
        backdrop?.addEventListener('click', closeHandler);
        document.addEventListener('keydown', escapeHandler);
    }

    getTotalKeys() {
        const keys = this.gameState.get('keys');
        let total = 0;
        for (const m of Object.values(keys)) {
            if (m.gold) total++;
            if (m.silver) total++;
            if (m.bronze) total++;
        }
        return total;
    }
}

// Auto‑initialise when DOM is ready (handle both early and late script loading)
function initializeMapUI() {
    if (window.mapUI) return; // Already initialized
    
    if (!window.gameState) {
        // GameState not ready yet, retry after a short delay
        console.warn('GameState not ready, retrying MapUI initialization...');
        setTimeout(initializeMapUI, 100);
        return;
    }
    
    try {
        window.mapUI = new MapUI();
        window.mapUI.initMap();
        console.log('MapUI initialized successfully');
    } catch (e) {
        console.error('Error initializing MapUI:', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMapUI);
} else {
    initializeMapUI();
}

// Also try on window load as fallback
window.addEventListener('load', () => {
    if (!window.mapUI && window.gameState) {
        initializeMapUI();
    }
});
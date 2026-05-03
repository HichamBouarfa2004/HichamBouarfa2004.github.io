/* ============================================
   المعلم الرفيق - World Map UI (Fixed)
   ============================================ */

class MapUI {
    constructor() {
        this.gameState = window.gameState;
        this.missions = ['idhafa', 'diptote', 'participles', 'vocative'];
        this.missionStageMap = { idhafa: 1, diptote: 2, participles: 3, vocative: 4 };
        this.labUnlocked = false;
        this.mapDragInitialized = false;
    }

    initMap() {
        this.updateIslandStates();
        this.attachIslandClickEvents();
        this.enableDragCanvas();
        if (!this._resizeBound) {
            this._resizeBound = () => this.updateIslandStates();
            window.addEventListener('resize', this._resizeBound);
        }
    }

    updateIslandStates() {
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
        if (labIsland && totalKeys >= 4 && !this.labUnlocked) this.unlockLab();
        if (labIsland) {
            if (firstIncompleteMission === null) labIsland.classList.add('island-active');
            else labIsland.classList.remove('island-active');
        }

        requestAnimationFrame(() => this.renderProgressPaths(highestUnlockedStage));
    }

    renderProgressPaths(highestUnlockedStage) {
        const svg = document.getElementById('progressPathLayer');
        const mapContainer = document.querySelector('.world-map-container');
        if (!svg || !mapContainer) return;
        const containerRect = mapContainer.getBoundingClientRect();
        const stagePairs = [];
        for (let stage = 1; stage < highestUnlockedStage; stage++) stagePairs.push([stage, stage + 1]);

        const width = containerRect.width || mapContainer.clientWidth;
        const height = containerRect.height || mapContainer.clientHeight;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.innerHTML = '';

        stagePairs.forEach(([fromStage, toStage], index) => {
            const fromMission = this.missions[fromStage - 1];
            const toMission = this.missions[toStage - 1];
            const fromCard = document.querySelector(`#island-${fromMission} .island-label-card`);
            const toCard = document.querySelector(`#island-${toMission} .island-label-card`);
            if (!fromCard || !toCard) return;

            const fromRect = fromCard.getBoundingClientRect();
            const toRect = toCard.getBoundingClientRect();
            const startX = (fromRect.left + fromRect.width / 2) - containerRect.left;
            const startY = fromRect.bottom - containerRect.top;
            const endX = (toRect.left + toRect.width / 2) - containerRect.left;
            const endY = toRect.top - containerRect.top;
            const controlY = startY + Math.max(70, Math.abs(endY - startY) * 0.35);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`);
            path.classList.add('path-segment');
            if (index === stagePairs.length - 1) path.classList.add('active');
            else path.classList.add('dimmed');
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
        const island = document.querySelector(`.island[data-mission="${this.missions[stageNumber - 1]}"]`);
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

    unlockLab() {
        const labIsland = document.getElementById('island-lab');
        if (!labIsland) return;
        const lockOverlay = labIsland.querySelector('.lab-locked-overlay');
        if (lockOverlay) lockOverlay.style.display = 'none';
        const labKeys = labIsland.querySelector('.island-keys');
        if (labKeys) {
            labKeys.classList.remove('locked');
            labKeys.innerHTML = '🔓 <span>مفتوح</span>';
        }
        this.labUnlocked = true;
    }

    attachIslandClickEvents() {
        const islands = document.querySelectorAll('.island-card');
        console.log('Attaching click events to', islands.length, 'islands');
        
        document.querySelectorAll('.island-card').forEach(island => {
            island.addEventListener('click', (e) => {
                e.stopPropagation();
                const missionId = island.getAttribute('data-mission');
                console.log('Island clicked:', missionId);
                
                if (!missionId) return;

                if (missionId === 'lab') {
                    if (this.labUnlocked) window.screenManager.goToScreen('lab');
                    else window.popupSystem.showFeedback('تحتاج 4 مفاتيح لفتح معمل الابتكار!', 'error');
                } else if (this.missions.includes(missionId)) {
                    const currentMission = this.gameState.get('currentMission');
                    const totalQuestions = this.gameState.get('totalQuestions');
                    const missionCompleted = this.gameState.get('missionCompletedPendingFinalize');
                    console.log('Mission state:', { currentMission, totalQuestions, missionCompleted });

                    if (currentMission === missionId && totalQuestions > 0 && !missionCompleted) {
                        window.screenManager.goToScreen('mission');
                        if (window.missionUI) window.missionUI.loadCurrentQuestion();
                        else console.error('missionUI not loaded');
                        return;
                    }

                    window.missionEngine.startMission(missionId);
                    window.screenManager.goToScreen('mission');
                    if (window.missionUI) window.missionUI.loadCurrentQuestion();
                    else console.error('missionUI not loaded');
                }
            });
        });
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
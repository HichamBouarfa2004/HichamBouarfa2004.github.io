/* ============================================
   المعلم الرفيق - World Map UI
   Handles island interactions, lock/unlock, completion states
   ============================================ */

class MapUI {
  constructor() {
    this.gameState = window.gameState;
    this.missions = ["idhafa", "diptote", "participles", "vocative"];
    this.missionStageMap = {
      idhafa: 1,
      diptote: 2,
      participles: 3,
      vocative: 4,
    };
    this.labUnlocked = false;
    this.mapDragInitialized = false;
  }

  /**
   * Initialise map: set island states based on keys and completions
   */
  initMap() {
    this.updateIslandStates();
    this.attachIslandClickEvents();
    this.enableDragCanvas();
    if (!this._resizeBound) {
      this._resizeBound = () => this.updateIslandStates();
      window.addEventListener("resize", this._resizeBound);
    }
  }

  /**
   * Update each island's appearance (keys count, completed/locked)
   */
  updateIslandStates() {
    const keys = this.gameState.get("keys");
    const sessionAnswers = this.gameState.get("sessionAnswers");
    const highestUnlockedStage =
      this.gameState.get("highestUnlockedStage") || 1;
    let firstIncompleteMission = null;

    this.missions.forEach((missionId) => {
      const missionData = window.missionsData?.find((m) => m.id === missionId);
      if (!missionData) return;
      const missionAnswers = sessionAnswers.filter(
        (a) => a.mission === missionId,
      );
      const correctCount = missionAnswers.filter((a) => a.correct).length;
      if (
        !firstIncompleteMission &&
        correctCount < missionData.questions.length
      ) {
        firstIncompleteMission = missionId;
      }
    });

    this.missions.forEach((missionId) => {
      const island = document.getElementById(`island-${missionId}`);
      if (!island) return;
      const stageNumber = this.missionStageMap[missionId] || 1;
      const isLocked = stageNumber > highestUnlockedStage;

      // Count earned keys for this mission
      let earnedCount = 0;
      if (keys[missionId]) {
        if (keys[missionId].gold) earnedCount = 3;
        else if (keys[missionId].silver) earnedCount = 2;
        else if (keys[missionId].bronze) earnedCount = 1;
      }

      // Check if all questions correct
      const missionData = window.missionsData?.find((m) => m.id === missionId);
      let allCorrect = false;
      let masteryReached = false;
      if (missionData) {
        const missionAnswers = sessionAnswers.filter(
          (a) => a.mission === missionId,
        );
        const correctCount = missionAnswers.filter((a) => a.correct).length;
        allCorrect = correctCount === missionData.questions.length;
        masteryReached = allCorrect && earnedCount === 3;
      }

      // Update key display
      const keySpan = island.querySelector(`#keys-${missionId}`);
      if (keySpan) {
        keySpan.textContent = earnedCount;
      }

      // Update visual states
      island.classList.remove(
        "island-completed",
        "island-locked",
        "island-active",
        "island-unlocking",
      );
      island.dataset.stage = String(stageNumber);

      this._syncLockOverlay(island, isLocked);

      if (isLocked) {
        island.classList.add("island-locked");
        island.setAttribute("aria-disabled", "true");
        island.style.pointerEvents = "none";
      } else {
        island.removeAttribute("aria-disabled");
        island.style.pointerEvents = "auto";
      }

      if (masteryReached) {
        island.classList.add("island-completed");
        // Add checkmark if not present
        let checkmark = island.querySelector(".completion-mark");
        if (!checkmark) {
          checkmark = document.createElement("div");
          checkmark.className = "completion-mark";
          checkmark.textContent = "✓";
          island.appendChild(checkmark);
        }
      } else {
        const existing = island.querySelector(".completion-mark");
        if (existing) existing.remove();
      }

      if (missionId === firstIncompleteMission) {
        if (!isLocked) island.classList.add("island-active");
      }
    });

    // Check Innovation Lab unlock (total keys >=4)
    const totalKeys = this.getTotalKeys();
    const labIsland = document.getElementById("island-lab");
    if (labIsland && totalKeys >= 4 && !this.labUnlocked) {
      this.unlockLab();
    }

    if (labIsland && firstIncompleteMission === null) {
      labIsland.classList.add("island-active");
    } else if (labIsland) {
      labIsland.classList.remove("island-active");
    }

    requestAnimationFrame(() => this.renderProgressPaths(highestUnlockedStage));
  }

  /**
   * Render dotted progression segments between consecutively unlocked stages.
   * @param {number} highestUnlockedStage
   */
  renderProgressPaths(highestUnlockedStage) {
    const svg = document.getElementById("progressPathLayer");
    const mapContainer = document.querySelector(".world-map-container");
    if (!svg || !mapContainer) return;

    const containerRect = mapContainer.getBoundingClientRect();
    const stagePairs = [];
    for (let stage = 1; stage < highestUnlockedStage; stage++) {
      stagePairs.push([stage, stage + 1]);
    }

    const width = containerRect.width || mapContainer.clientWidth;
    const height = containerRect.height || mapContainer.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";

    stagePairs.forEach(([fromStage, toStage], index) => {
      const fromMission = this.missions[fromStage - 1];
      const toMission = this.missions[toStage - 1];
      const fromCard = document.querySelector(
        `#island-${fromMission} .island-label-card`,
      );
      const toCard = document.querySelector(
        `#island-${toMission} .island-label-card`,
      );
      if (!fromCard || !toCard) return;

      const fromRect = fromCard.getBoundingClientRect();
      const toRect = toCard.getBoundingClientRect();

      const startX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const startY = fromRect.bottom - containerRect.top;
      const endX = toRect.left + toRect.width / 2 - containerRect.left;
      const endY = toRect.top - containerRect.top;
      const controlY = startY + Math.max(70, Math.abs(endY - startY) * 0.35);

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute(
        "d",
        `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`,
      );
      path.classList.add("path-segment");

      if (index === stagePairs.length - 1) {
        path.classList.add("active");
      } else {
        path.classList.add("dimmed");
      }

      svg.appendChild(path);
    });
  }

  /**
   * Ensure a visible padlock overlay exists and matches lock state.
   * @param {HTMLElement} island
   * @param {boolean} isLocked
   */
  _syncLockOverlay(island, isLocked) {
    const visual = island.querySelector(".island-visual");
    if (!visual) return;

    let lockOverlay = visual.querySelector(".island-lock-overlay");
    if (isLocked) {
      if (!lockOverlay) {
        lockOverlay = document.createElement("div");
        lockOverlay.className = "island-lock-overlay";
        lockOverlay.innerHTML = '<div class="island-lock-icon">🔒</div>';
        visual.appendChild(lockOverlay);
      }
      lockOverlay.classList.remove("hidden");
      island.classList.add("island-locked");
    } else {
      if (lockOverlay) {
        lockOverlay.remove();
      }
    }
  }

  /**
   * Enable draggable world-map canvas on touch devices.
   */
  enableDragCanvas() {
    if (this.mapDragInitialized) return;

    const mapContainer = document.querySelector(".world-map-container");
    if (!mapContainer) return;

    this.mapDragInitialized = true;

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    mapContainer.addEventListener("pointerdown", (event) => {
      if (!isMobile()) return;
      mapContainer.dataset.dragging = "true";
      mapContainer.dataset.startX = String(event.clientX);
      mapContainer.dataset.startY = String(event.clientY);
      mapContainer.dataset.startScrollLeft = String(mapContainer.scrollLeft);
      mapContainer.dataset.startScrollTop = String(mapContainer.scrollTop);
      mapContainer.classList.add("is-dragging");
    });

    mapContainer.addEventListener("pointermove", (event) => {
      if (mapContainer.dataset.dragging !== "true" || !isMobile()) return;
      const deltaX =
        event.clientX - parseFloat(mapContainer.dataset.startX || "0");
      const deltaY =
        event.clientY - parseFloat(mapContainer.dataset.startY || "0");
      const startScrollLeft = parseFloat(
        mapContainer.dataset.startScrollLeft || "0",
      );
      const startScrollTop = parseFloat(
        mapContainer.dataset.startScrollTop || "0",
      );
      mapContainer.scrollLeft = startScrollLeft - deltaX;
      mapContainer.scrollTop = startScrollTop - deltaY;
    });

    const endDrag = () => {
      mapContainer.dataset.dragging = "false";
      mapContainer.classList.remove("is-dragging");
    };

    mapContainer.addEventListener("pointerup", endDrag);
    mapContainer.addEventListener("pointercancel", endDrag);
    mapContainer.addEventListener("pointerleave", endDrag);
  }

  /**
   * Play unlock animation on the newly opened stage.
   * @param {number} stageNumber
   */
  playUnlockSequence(stageNumber) {
    const island = document.querySelector(
      `.island[data-mission="${this.missions[stageNumber - 1]}"]`,
    );
    const mapContainer = document.querySelector(".world-map-container");
    const svg = document.getElementById("progressPathLayer");
    if (!island || !mapContainer) return;

    island.classList.remove("island-locked");
    island.classList.add("island-unlocking");
    mapContainer.classList.add("path-unlock-flash");

    const lockOverlay = island.querySelector(".island-lock-overlay");
    if (lockOverlay) {
      lockOverlay.classList.add("island-lock-breaking");
    }

    if (svg) {
      const containerRect = mapContainer.getBoundingClientRect();
      const card = island.querySelector(".island-label-card");
      if (card) {
        const cardRect = card.getBoundingClientRect();
        const burst = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        burst.classList.add("unlock-burst");
        burst.setAttribute(
          "cx",
          (cardRect.left + cardRect.width / 2 - containerRect.left).toString(),
        );
        burst.setAttribute("cy", (cardRect.top - containerRect.top).toString());
        burst.setAttribute("r", "4");
        svg.appendChild(burst);

        setTimeout(() => {
          burst.remove();
        }, 1100);
      }
    }

    setTimeout(() => {
      island.classList.remove("island-unlocking");
      mapContainer.classList.remove("path-unlock-flash");
      if (lockOverlay) {
        lockOverlay.classList.add("hidden");
        lockOverlay.classList.remove("island-lock-breaking");
      }
      this.updateIslandStates();
    }, 1300);
  }

  /**
   * Unlock Innovation Lab: remove lock overlay, update styling
   */
  unlockLab() {
    const labIsland = document.getElementById("island-lab");
    if (!labIsland) return;

    const lockOverlay = labIsland.querySelector(".lab-locked-overlay");
    if (lockOverlay) {
      lockOverlay.style.display = "none";
    }

    const labKeys = labIsland.querySelector(".island-keys");
    if (labKeys) {
      labKeys.classList.remove("locked");
      labKeys.innerHTML = "🔓 <span>مفتوح</span>";
    }

    this.labUnlocked = true;
  }

  /**
   * Attach click handlers to all islands
   */
  attachIslandClickEvents() {
    document.querySelectorAll(".island").forEach((island) => {
      island.addEventListener("click", (e) => {
        e.stopPropagation();
        const missionId = island.getAttribute("data-mission");
        if (!missionId) return;

        if (missionId === "lab") {
          if (this.labUnlocked) {
            window.screenManager.goToScreen("lab");
          } else {
            window.popupSystem.showFeedback(
              "تحتاج 4 مفاتيح لفتح معمل الابتكار!",
              "error",
            );
          }
        } else if (this.missions.includes(missionId)) {
          const currentMission = this.gameState.get("currentMission");
          const totalQuestions = this.gameState.get("totalQuestions");
          const missionCompletedPendingFinalize = this.gameState.get(
            "missionCompletedPendingFinalize",
          );

          if (
            currentMission === missionId &&
            totalQuestions > 0 &&
            !missionCompletedPendingFinalize
          ) {
            window.screenManager.goToScreen("mission");
            if (window.missionUI) {
              window.missionUI.loadCurrentQuestion();
            } else {
              console.error("missionUI not loaded yet");
              window.screenManager.goToScreen("hub");
            }

            return;
          }

          // Start mission
          window.missionEngine.startMission(missionId);
          window.screenManager.goToScreen("mission");
          if (window.missionUI) {
            window.missionUI.loadCurrentQuestion();
          } else {
            console.error("missionUI not loaded yet");
            window.screenManager.goToScreen("hub");
          }
        }
      });
    });
  }

  /**
   * Get total keys collected across all missions
   */
  getTotalKeys() {
    const keys = this.gameState.get("keys");
    let total = 0;
    for (const mission of Object.values(keys)) {
      if (mission.gold) total++;
      if (mission.silver) total++;
      if (mission.bronze) total++;
    }
    return total;
  }
}

// Create global instance
const mapUI = new MapUI();

// Export
window.mapUI = mapUI;

/* ============================================
   المعلم الرفيق - Popup System
   Hint popup, success popup, with proper state management
   ============================================ */

class PopupSystem {
    constructor() {
        this.hintPopup = document.getElementById('hintPopup');
        this.successPopup = document.getElementById('successPopup');
        this.victoryDrawer = document.getElementById('victoryDrawer');
        this.isOpen = false;
        this.currentCallback = null;
        this.currentVictoryCallback = null;
        this.feedbackTimeout = null;
        this.lastFocusedElement = null;
        this.boundEscapeHandler = this._handleEscapeKey.bind(this);
    }

    _rememberFocus() {
        this.lastFocusedElement = document.activeElement;
    }

    _restoreFocus() {
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
            this.lastFocusedElement.focus();
        }
        this.lastFocusedElement = null;
    }

    _handleEscapeKey(event) {
        if (event.key === 'Escape') {
            this.closeAll();
        }
    }

    _isAnyPopupVisible() {
        const hintVisible = this.hintPopup && !this.hintPopup.classList.contains('hidden');
        const successVisible = this.successPopup && !this.successPopup.classList.contains('hidden');
        return hintVisible || successVisible;
    }

    _cleanupPopupState() {
        if (!this._isAnyPopupVisible()) {
            this.isOpen = false;
            document.body.style.overflow = '';
            document.removeEventListener('keydown', this.boundEscapeHandler);
            this._restoreFocus();
        }
    }
    
    /**
     * Show hint popup with current hint text
     * @param {string} hintText 
     * @param {boolean} hasMoreHints 
     */
    showHintPopup(hintText, hasMoreHints = false) {
        if (!this.hintPopup) return;
        
        const hintTextEl = document.getElementById('hintText');
        const moreBtn = document.getElementById('hintMoreBtn');
        const retryBtn = document.getElementById('hintRetryBtn');
        
        if (hintTextEl) hintTextEl.textContent = hintText;
        if (moreBtn) {
            if (hasMoreHints) {
                moreBtn.classList.remove('hidden');
            } else {
                moreBtn.classList.add('hidden');
            }
        }
        
        // Render avatar inside hint popup
        if (window.avatarRenderer) {
            const avatarContainer = document.getElementById('hintAvatarDisplay');
            window.avatarRenderer.renderHintAvatar(avatarContainer);
        }

        this._rememberFocus();
        
        this.hintPopup.classList.remove('hidden');
        this.hintPopup.setAttribute('aria-hidden', 'false');
        this.isOpen = true;
        
        // Disable background scrolling
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.boundEscapeHandler);
        if (retryBtn) retryBtn.focus();
    }
    
    /**
     * Hide hint popup
     */
    hideHintPopup() {
        if (!this.hintPopup) return;
        this.hintPopup.classList.add('hidden');
        this.hintPopup.setAttribute('aria-hidden', 'true');
        this._cleanupPopupState();
    }
    
    /**
     * Show success popup with earned key
     * @param {string} keyType - 'bronze', 'silver', or 'gold'
     * @param {Function} onClose - callback when popup closes
     */
    showSuccessPopup(keyType, onClose = null) {
        if (!this.successPopup) return;
        
        const keyDisplay = document.getElementById('earnedKeyDisplay');
        const successBtn = document.getElementById('successBtn');
        const keyEmojis = {
            bronze: '🔑<br>(مفتاح برونزي)',
            silver: '🗝️<br>(مفتاح فضي)',
            gold: '🔐<br>(مفتاح ذهبي)'
        };
        
        if (keyDisplay) {
            keyDisplay.innerHTML = keyEmojis[keyType] || '🔑';
        }

        this._rememberFocus();
        
        this.successPopup.classList.remove('hidden');
        this.successPopup.setAttribute('aria-hidden', 'false');
        this.isOpen = true;
        this.currentCallback = onClose;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.boundEscapeHandler);
        if (successBtn) successBtn.focus();
    }
    
    /**
     * Hide success popup and execute callback
     */
    hideSuccessPopup() {
        if (!this.successPopup) return;
        this.successPopup.classList.add('hidden');
        this.successPopup.setAttribute('aria-hidden', 'true');
        this._cleanupPopupState();
        if (this.currentCallback) {
            this.currentCallback();
            this.currentCallback = null;
        }
    }
    
    /**
     * Show generic feedback message (not a popup, but inline feedback)
     * @param {string} message 
     * @param {string} type - 'success' or 'error'
     */
    showFeedback(message, type = 'success') {
        const feedbackBox = document.getElementById('feedbackBox');
        const feedbackText = document.getElementById('feedbackText');
        
        if (feedbackBox && feedbackText) {
            feedbackText.textContent = message;
            feedbackBox.classList.remove('hidden', 'success', 'error');
            feedbackBox.classList.add(type);

            if (this.feedbackTimeout) {
                clearTimeout(this.feedbackTimeout);
            }
            
            const duration = type === 'error' ? 5000 : 4000;
            this.feedbackTimeout = setTimeout(() => {
                feedbackBox.classList.add('hidden');
                this.feedbackTimeout = null;
            }, duration);
        }
    }

    /**
     * Show the bottom victory drawer used for correct answers.
     * @param {object} options
     */
    showVictoryDrawer(options = {}) {
        if (!this.victoryDrawer) return;

        const titleEl = document.getElementById('victoryTitle');
        const messageEl = document.getElementById('victoryMessage');
        const continueBtn = document.getElementById('victoryContinueBtn');

        if (titleEl) titleEl.textContent = options.title || 'أحسنت!';
        if (messageEl) messageEl.textContent = options.message || 'إجابة صحيحة. استمر واصل التحدي.';
        if (continueBtn) continueBtn.textContent = options.continueLabel || 'متابعة';

        this.currentVictoryCallback = typeof options.onContinue === 'function' ? options.onContinue : null;

        this.victoryDrawer.classList.remove('hidden');
        this.victoryDrawer.classList.add('visible');

        if (continueBtn) {
            continueBtn.onclick = () => {
                const callback = this.currentVictoryCallback;
                this.hideVictoryDrawer();
                if (callback) {
                    callback();
                }
            };
            continueBtn.focus();
        }

        if (window.avatarRenderer) {
            window.avatarRenderer.setReaction?.('excited');
        }
    }

    /**
     * Hide the victory drawer.
     */
    hideVictoryDrawer() {
        if (!this.victoryDrawer) return;
        this.victoryDrawer.classList.remove('visible');
        this.victoryDrawer.classList.add('hidden');
        this.currentVictoryCallback = null;
    }
    
    /**
     * Close all popups
     */
    closeAll() {
        this.hideHintPopup();
        this.hideSuccessPopup();
        this.hideVictoryDrawer();
    }
}

// Create global instance
const popupSystem = new PopupSystem();

// Export
window.popupSystem = popupSystem;
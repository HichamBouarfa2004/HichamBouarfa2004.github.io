/* ============================================
   المعلم الرفيق - Avatar Renderer
   Displays avatars in helper, profile, hint popup
   ============================================ */

class AvatarRenderer {
    constructor() {
        this.gameState = window.gameState;
        this.avatarAssets = {
            sibawayh: {
                src: 'assets/images/avatar-sibawayh.jpeg',
                name: 'سيبويه'
            },
            'al-farahidi': {
                src: 'assets/images/avatar-al-farahidi.jpeg',
                name: 'الفراهيدي'
            }
        };
    }

    _createAvatarImage(avatarType, className) {
        const asset = this.avatarAssets[avatarType];
        if (!asset) return null;

        const img = document.createElement('img');
        img.src = asset.src;
        img.alt = asset.name;
        img.className = className;
        img.loading = 'lazy';
        return img;
    }
    
    /**
     * Get avatar type (sibawayh or al-farahidi)
     * @returns {string|null}
     */
    getCurrentAvatar() {
        return this.gameState.get('selectedAvatar');
    }
    
    /**
     * Render avatar in the helper section (mission screen)
     * @param {HTMLElement} container 
     */
    renderHelperAvatar(container) {
        if (!container) return;
        container.innerHTML = '';
        
        const avatarType = this.getCurrentAvatar();
        if (!avatarType) return;

        const avatarImage = this._createAvatarImage(avatarType, 'companion-portrait companion-portrait-lg');
        if (avatarImage) {
            container.appendChild(avatarImage);
        }
    }
    
    /**
     * Render avatar in hint popup (small version)
     * @param {HTMLElement} container 
     */
    renderHintAvatar(container) {
        if (!container) return;
        container.innerHTML = '';
        
        const avatarType = this.getCurrentAvatar();
        if (!avatarType) return;

        const avatarImage = this._createAvatarImage(avatarType, 'companion-portrait companion-portrait-sm');
        if (avatarImage) {
            container.appendChild(avatarImage);
        }
    }
    
    /**
     * Render avatar name in profile
     * @returns {string}
     */
    getAvatarName() {
        const avatarType = this.getCurrentAvatar();
        if (avatarType === 'sibawayh') return 'سيبويه';
        if (avatarType === 'al-farahidi') return 'الفراهيدي';
        return 'لم يختار بعد';
    }
    
    /**
     * Subscribe to avatar changes and update UI
     * @param {Function} callback 
     */
    onAvatarChange(callback) {
        this.gameState.subscribe((state) => {
            if (state.selectedAvatar !== this._lastAvatar) {
                this._lastAvatar = state.selectedAvatar;
                callback(state.selectedAvatar);
            }
        });
    }
}

// Create global instance
const avatarRenderer = new AvatarRenderer();

// Export
window.avatarRenderer = avatarRenderer;
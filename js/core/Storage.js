/* ============================================
   المعلم الرفيق - Storage Manager
   Save, load, export, import game state
   ============================================ */

class StorageManager {
    constructor() {
        this.storageKey = 'alMuarifGameState';
        this.gameState = window.gameState;
    }
    
    /**
     * Save current game state to localStorage
     */
    saveGameState() {
        try {
            const state = this.gameState.getState();
            const toSave = {
                ...state,
                savedAt: new Date().toISOString(),
                version: '2.0.0'
            };
            localStorage.setItem(this.storageKey, JSON.stringify(toSave));
            return true;
        } catch (error) {
            console.warn('Failed to save game state:', error);
            return false;
        }
    }
    
    /**
     * Load game state from localStorage
     */
    loadGameState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate essential fields
                if (parsed && parsed.version) {
                    this.gameState.loadFromSaved(parsed);
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load saved game state:', error);
        }
        return false;
    }
    
    /**
     * Export game state as downloadable JSON file
     */
    exportGameState() {
        const state = this.gameState.getState();
        const exportData = {
            ...state,
            exportDate: new Date().toISOString(),
            version: '2.0.0'
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `almuarif_save_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Import game state from JSON file
     * @param {File} file 
     * @returns {Promise<boolean>}
     */
    importGameState(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported && imported.version) {
                        this.gameState.loadFromSaved(imported);
                        this.saveGameState();
                        resolve(true);
                    } else {
                        reject(new Error('Invalid save file format'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Clear all saved data
     */
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.gameState.reset();
        this.saveGameState();
    }
    
    /**
     * Check if saved data exists
     * @returns {boolean}
     */
    hasSavedData() {
        return localStorage.getItem(this.storageKey) !== null;
    }
    
    /**
     * Get last save time
     * @returns {string|null}
     */
    getLastSaveTime() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.savedAt || null;
            } catch {
                return null;
            }
        }
        return null;
    }
}

// Create global instance
const StorageManagerInstance = new StorageManager();

// Export
window.StorageManager = StorageManagerInstance;
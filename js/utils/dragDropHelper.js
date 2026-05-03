/* ============================================
   المعلم الرفيق - Drag & Drop Helper (SortableJS)
   Touch-friendly, RTL-compatible sorting for categories
   ============================================ */

/**
 * Initialize SortableJS for sorting/categorization questions
 * Uses the global Sortable library (loaded from CDN in index.html)
 * @param {string} containerId - ID of the container that holds the categories
 * @param {Function} onEndCallback - optional callback when sorting ends
 * @returns {Object} Sortable instances
 */
function initSortableCategories(containerElement, onEndCallback) {
    if (!containerElement || typeof Sortable === 'undefined') {
        console.warn('SortableJS not loaded or container missing');
        return null;
    }
    
    const sortableInstances = [];
    
    // Find all sort-list elements inside the container
    const categoryLists = containerElement.querySelectorAll('.sort-list');
    
    categoryLists.forEach(list => {
        const sortable = new Sortable(list, {
            group: {
                name: 'shared',
                pull: true,
                revertClone: false,
                put: function(to, from, drag) {
                    // Allow dropping into any list
                    return true;
                }
            },
            animation: 200,
            touchStartThreshold: 2,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function() {
                if (onEndCallback) onEndCallback();
            }
        });
        sortableInstances.push(sortable);
    });
    
    // Also make the original items container sortable (so items can be moved back)
    const itemsContainer = containerElement.querySelector('.sort-items-pool');
    if (itemsContainer) {
        const poolSortable = new Sortable(itemsContainer, {
            group: {
                name: 'shared',
                pull: true,
                revertClone: false
            },
            animation: 200,
            touchStartThreshold: 2,
            onEnd: function() {
                if (onEndCallback) onEndCallback();
            }
        });
        sortableInstances.push(poolSortable);
    }
    
    return sortableInstances;
}

/**
 * Collect current sorting state from category lists
 * @param {HTMLElement} containerElement - The question content container
 * @returns {Object} - Map of category name to array of items
 */
function getSortingState(containerElement) {
    const state = {};
    const categoryLists = containerElement.querySelectorAll('.sort-category');
    
    categoryLists.forEach(categoryDiv => {
        const categoryName = categoryDiv.querySelector('h4')?.textContent || '';
        const list = categoryDiv.querySelector('.sort-list');
        if (list) {
            const items = Array.from(list.querySelectorAll('.sort-item')).map(item => item.textContent);
            state[categoryName] = items;
        }
    });
    
    // Also check if any items remain in the original pool (should be empty for correct answer)
    const itemsPool = containerElement.querySelector('.sort-items-pool');
    if (itemsPool) {
        const remainingItems = Array.from(itemsPool.querySelectorAll('.sort-item')).map(item => item.textContent);
        state['_remaining'] = remainingItems;
    }
    
    return state;
}

/**
 * Verify sorting answer against expected categories
 * @param {Object} expectedCategories - e.g., { 'ممنوع من الصرف': ['فاطمة', 'مساجد'], 'غير ممنوع': ['كرسي'] }
 * @param {Object} currentState - from getSortingState()
 * @returns {boolean} - true if all items correctly placed and no leftovers
 */
function verifySortingAnswer(expectedCategories, currentState) {
    // First, ensure no items left in the pool
    if (currentState['_remaining'] && currentState['_remaining'].length > 0) {
        return false;
    }
    
    // Collect all items from current categories
    const allPlacedItems = [];
    for (const [cat, items] of Object.entries(currentState)) {
        if (cat !== '_remaining') {
            allPlacedItems.push(...items);
        }
    }
    
    // Collect all expected items
    const allExpectedItems = [];
    for (const items of Object.values(expectedCategories)) {
        allExpectedItems.push(...items);
    }
    
    // Must have same length and same items (order independent)
    if (allPlacedItems.length !== allExpectedItems.length) {
        return false;
    }
    
    // Sort and compare strings
    const sortString = (arr) => [...arr].sort().join('|');
    if (sortString(allPlacedItems) !== sortString(allExpectedItems)) {
        return false;
    }
    
    // Check each category's items match expected
    for (const [category, expectedItems] of Object.entries(expectedCategories)) {
        const currentItems = currentState[category] || [];
        if (sortString(currentItems) !== sortString(expectedItems)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Reset sorting UI to initial state (all items in pool, categories empty)
 * @param {HTMLElement} containerElement 
 * @param {Array} allItems - list of item texts
 * @param {Array} categories - list of category names
 */
function resetSortingUI(containerElement, allItems, categories) {
    // Clear all category lists
    categories.forEach(category => {
        const categoryId = `sort-${category.replace(/\s+/g, '-').toLowerCase()}`;
        const list = containerElement.querySelector(`#${categoryId}`);
        if (list) list.innerHTML = '';
    });
    
    // Rebuild items pool
    let itemsPool = containerElement.querySelector('.sort-items-pool');
    if (!itemsPool) {
        itemsPool = document.createElement('div');
        itemsPool.className = 'sort-items-pool';
        itemsPool.style.display = 'flex';
        itemsPool.style.flexWrap = 'wrap';
        itemsPool.style.gap = 'var(--spacing-md)';
        itemsPool.style.marginTop = 'var(--spacing-lg)';
        itemsPool.style.padding = 'var(--spacing-md)';
        itemsPool.style.border = '1px dashed var(--border-color)';
        itemsPool.style.borderRadius = 'var(--radius-md)';
        itemsPool.style.backgroundColor = 'var(--bg-cream)';
        containerElement.appendChild(itemsPool);
    }
    itemsPool.innerHTML = '';
    
    allItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'sort-item';
        itemDiv.textContent = item;
        itemDiv.setAttribute('data-item', item);
        itemsPool.appendChild(itemDiv);
    });
}

// Export for global use
window.initSortableCategories = initSortableCategories;
window.getSortingState = getSortingState;
window.verifySortingAnswer = verifySortingAnswer;
window.resetSortingUI = resetSortingUI;
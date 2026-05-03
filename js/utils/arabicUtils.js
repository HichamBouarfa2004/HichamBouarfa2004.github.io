/* ============================================
   المعلم الرفيق - Arabic Utilities
   Text normalization, diacritic removal, basic sentence hints
   ============================================ */

/**
 * Remove Arabic diacritics (tashkeel) for comparison
 * @param {string} text - Arabic text with possible diacritics
 * @returns {string} - Text without diacritics
 */
function removeDiacritics(text) {
    if (!text) return '';
    return text.replace(/[\u064B-\u0652]/g, '');
}

/**
 * Normalize Arabic text for comparison (remove diacritics, normalise alif)
 * @param {string} text 
 * @returns {string}
 */
function normalizeArabic(text) {
    if (!text) return '';
    let normalized = removeDiacritics(text);
    // Normalize different alif forms to bare alif
    normalized = normalized.replace(/[اآأإٱ]/g, 'ا');
    // Normalize teh marbuta to ha
    normalized = normalized.replace(/ة/g, 'ه');
    return normalized.trim();
}

/**
 * Basic structural hints for lab sentences (honest, not full grammar check)
 * @param {string} sentence 
 * @returns {object} - { valid: boolean, suggestions: string[] }
 */
function analyzeSentenceStructure(sentence) {
    const suggestions = [];
    const trimmed = sentence.trim();
    
    if (!trimmed) {
        suggestions.push('الجملة فارغة. اكتب جملة مفيدة.');
        return { valid: false, suggestions };
    }
    
    const words = trimmed.split(/\s+/);
    if (words.length < 2) {
        suggestions.push('الجملة قصيرة جداً. حاول كتابة جملة من كلمتين على الأقل.');
    }
    
    // Check for common Arabic patterns (very basic heuristics)
    const hasVerb = /(كتب|قرأ|ذهب|جاء|أكل|شرب|قال|رأى|علم|فهم|درس|عمل|لعب|نام|استيقظ|كان|صار|ليس)/.test(trimmed);
    const hasNoun = /(كتاب|طالب|معلم|بيت|مسجد|مدرسة|سيارة|قلم|ورقة|باب|نافذة|رجل|امرأة|طفل)/.test(trimmed);
    const hasSubjectMarker = /(ال|هذا|هذه|الذي|التي)/.test(trimmed);
    
    if (!hasVerb && !hasNoun) {
        suggestions.push('حاول أن تجعل جملتك تحتوي على فعل أو اسم واضح.');
    } else {
        if (hasVerb) suggestions.push('✓ جملتك تحتوي على فعل.');
        if (hasNoun) suggestions.push('✓ جملتك تحتوي على اسم.');
        if (hasSubjectMarker) suggestions.push('✓ جملتك تبدو سليمة من حيث التركيب الأولي.');
    }
    
    if (suggestions.length === 0) {
        suggestions.push('جملتك تبدو جيدة من حيث التركيب. استمر في الإبداع!');
    }
    
    return { valid: suggestions.length <= 2, suggestions };
}

/**
 * Compare two answers ignoring diacritics and normalised alif
 * @param {string} userAnswer 
 * @param {string} correctAnswer 
 * @returns {boolean}
 */
function isAnswerMatching(userAnswer, correctAnswer) {
    if (!userAnswer || !correctAnswer) return false;
    return normalizeArabic(userAnswer) === normalizeArabic(correctAnswer);
}

// Export for global use
window.removeDiacritics = removeDiacritics;
window.normalizeArabic = normalizeArabic;
window.analyzeSentenceStructure = analyzeSentenceStructure;
window.isAnswerMatching = isAnswerMatching;
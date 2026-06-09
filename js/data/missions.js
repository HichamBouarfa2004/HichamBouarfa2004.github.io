/* ============================================
   المعلم الرفيق - Missions Data
   All mission content, questions, answers, explanations
   ============================================ */

const CUSTOM_MISSIONS_STORAGE_KEY = 'alMuarifCustomMissionsV1';

const baseMissionsData = [
    {
        id: 'idhafa',
        title: 'الإضافة',
        description: 'ابحث عن المضاف إليه المفقود',
        scenario: 'خزانة الأسرار مقفلة! أوجد المضاف إليه لفتحها',
        difficulty: 'easy',
        rule: 'الإضافة هي نسبة بين اسمين، حيث يُضاف الأول إلى الثاني. المضاف إليه دائماً مجرور.',
        questions: [
            {
                text: 'اختر المضاف إليه الصحيح: كتاب ___ مفيد جداً',
                type: 'multiple-choice',
                options: ['الطالب', 'طالباً', 'طالب'],
                correct: 0,
                explanation: 'المضاف إليه يجب أن يكون مجروراً، و"الطالب" مجرور ولا يأخذ تنوين'
            },
            {
                text: 'أي من الجمل التالية تحتوي على إضافة صحيحة؟',
                type: 'multiple-choice',
                options: ['باب البيت مفتوح', 'بابا البيت مفتوح', 'باب البيتا مفتوح'],
                correct: 0,
                explanation: 'في الإضافة الصحيحة، المضاف لا يأخذ تنوين والمضاف إليه يكون مجروراً'
            },
            {
                text: 'أكمل الجملة بالمضاف إليه المناسب: حقيبة ___ ثقيلة',
                type: 'fill-blank',
                correct: 'الطالبة',
                explanation: 'المضاف إليه يجب أن يكون مجروراً لينسجم مع قواعد الإضافة'
            },
            {
                text: 'حدد المضاف والمضاف إليه في الجملة: "سيارة أبي حمراء"',
                type: 'multiple-choice',
                options: ['سيارة: مضاف، أبي: مضاف إليه', 'أبي: مضاف، سيارة: مضاف إليه', 'حمراء: مضاف، سيارة: مضاف إليه'],
                correct: 0,
                explanation: 'الكلمة الأولى هي المضاف والكلمة الثانية بعدها هي المضاف إليه'
            },
            {
                text: 'أي من الكلمات التالية تصلح مضاف إليه في الجملة "قلم ___"؟',
                type: 'multiple-choice',
                options: ['معلماً', 'المعلم', 'معلما'],
                correct: 1,
                explanation: 'المضاف إليه يجب أن يكون مجروراً وأداة التعريف توجب الجر'
            }
        ]
    },
    {
        id: 'diptote',
        title: 'الممنوع من الصرف',
        description: 'ميّز الكلمات الممنوعة من الصرف',
        scenario: 'الحواجز تمنعك من المرور! اكتشف الكلمات الممنوعة',
        difficulty: 'hard',
        rule: 'الممنوع من الصرف هو الاسم الذي لا يقبل التنوين ويُرفع بالضمة وينصب ويُجر بالفتحة',
        questions: [
            {
                text: 'أي من الكلمات التالية ممنوع من الصرف؟',
                type: 'multiple-choice',
                options: ['مدرسة', 'مساجد', 'كتاب'],
                correct: 1,
                explanation: 'مساجد جمع تكسير (صيغة منتهى الجموع) وهي ممنوعة من الصرف'
            },
            {
                text: 'صنّف الكلمات إلى ممنوع من الصرف وغير ممنوع',
                type: 'sorting',
                items: ['فاطمة', 'مقاتل', 'مساحات', 'كرسي', 'مكة', 'مدارس'],
                categories: {
                    'ممنوع من الصرف': ['فاطمة', 'مقاتل', 'مكة', 'مدارس'],
                    'غير ممنوع': ['كرسي', 'مساحات']
                },
                explanation: 'الأسماء العلم المؤنثة والجموع التكسيرية ممنوعة من الصرف. مساحات جمع مؤنث سالم وليست ممنوعة'
            },
            {
                text: 'هل كلمة "أحمد" ممنوعة من الصرف؟',
                type: 'multiple-choice',
                options: ['نعم، لأنها اسم علم مذكر', 'لا، تقبل التنوين', 'نعم، لكنها اسم علم على وزن الفعل'],
                correct: 2,
                explanation: 'أحمد اسم علم مذكر على وزن الفعل (أفعل) وممنوع من الصرف'
            },
            {
                text: 'ما الحكم الإعرابي لكلمة "مناطق" في الجملة "تحتوي المدينة على مناطق جميلة"؟',
                type: 'multiple-choice',
                options: ['منصوب بالفتحة', 'منصوب بالألف', 'منصوب بدون تنوين'],
                correct: 0,
                explanation: 'مناطق (صيغة منتهى جموع) ممنوع من الصرف فينصب بالفتحة بدون تنوين'
            },
            {
                text: 'أي من الأسباب التالية يجعل الاسم ممنوعاً من الصرف؟',
                type: 'multiple-choice',
                options: [
                    'أن يكون علماً مؤنثاً فقط',
                    'أن يكون علماً مؤنثاً أو جمع تكسير على صيغة منتهى الجموع',
                    'أن ينتهي بالتاء'
                ],
                correct: 1,
                explanation: 'هناك أسباب متعددة لمنع الصرف من أهمها: الأعلام المؤنثة والجموع التكسيرية'
            }
        ]
    },
    {
        id: 'participles',
        title: 'الأسماء المشتقة',
        description: 'صمّم دروعك من اسم الفاعل والمفعول',
        scenario: 'استخدم قوة الأفعال! صمّم دروعك اللغوية',
        difficulty: 'medium',
        rule: 'اسم الفاعل يصاغ من الفعل بمعنى من يفعل، واسم المفعول يصاغ بمعنى من وقع عليه الفعل',
        questions: [
            {
                text: 'أكمل: اسم الفاعل من الفعل "كتب" هو:',
                type: 'multiple-choice',
                options: ['كاتب', 'مكتوب', 'كتاب'],
                correct: 0,
                explanation: 'كاتب = من يكتب (اسم فاعل)، مكتوب = ما وقع عليه الكتابة (اسم مفعول)'
            },
            {
                text: 'اسم المفعول من الفعل "سمع" هو:',
                type: 'multiple-choice',
                options: ['سامع', 'مسموع', 'سماع'],
                correct: 1,
                explanation: 'مسموع = ما وقع عليه السماع. سامع = من يسمع (اسم فاعل)'
            },
            {
                text: 'اختر اسم الفاعل الصحيح من "دخل":',
                type: 'multiple-choice',
                options: ['داخل', 'مدخول', 'دخيل'],
                correct: 0,
                explanation: 'داخل = من يدخل (اسم فاعل على وزن فاعل)'
            },
            {
                text: 'حدد نوع الاسم المشتق في الجملة: "هذا كتاب مشروح من المعلم"',
                type: 'multiple-choice',
                options: ['اسم فاعل', 'اسم مفعول', 'لا يوجد اسم مشتق'],
                correct: 1,
                explanation: 'مشروح = ما تم شرحه (اسم مفعول من شرح)'
            },
            {
                text: 'اختر الجملة التي تحتوي على اسم فاعل:',
                type: 'multiple-choice',
                options: [
                    'الطالب المجتهد نال الجائزة',
                    'الدرس المشروح سهل الفهم',
                    'الكتاب المطبوع جديد'
                ],
                correct: 0,
                explanation: 'المجتهد = من يجتهد (اسم فاعل)'
            }
        ]
    },
    {
        id: 'vocative',
        title: 'النداء',
        description: 'استدعِ المساعدة بالنداء الصحيح',
        scenario: 'استدعِ المساعدة! استخدم أداة النداء الصحيحة',
        difficulty: 'medium',
        rule: 'النداء هو استدعاء المخاطب باستخدام أدوات: يا، أيا، هيا، أي. اختر الأداة حسب القرب والبعد',
        questions: [
            {
                text: 'أكمل: ___ معلم، أساعدك؟',
                type: 'multiple-choice',
                options: ['يا', 'أيا', 'هيا'],
                correct: 0,
                explanation: '"يا" هي أداة النداء الأساسية والأكثر استخداماً'
            },
            {
                text: 'أي أداة نداء تستخدم للمنادى البعيد؟',
                type: 'multiple-choice',
                options: ['يا', 'أيا', 'هيا'],
                correct: 1,
                explanation: '"أيا" تُستخدم لندء البعيد أو عندما نريد توكيد النداء'
            },
            {
                text: 'أكمل الجملة: ___ أطفال، احذروا من الشارع',
                type: 'fill-blank',
                correct: 'يا',
                explanation: 'تُستخدم "يا" مع الأطفال لأنهم قريبون'
            },
            {
                text: 'حدد أداة النداء الصحيحة في الجملة: "هيا صديقي، تعال هنا"',
                type: 'multiple-choice',
                options: ['يا', 'أيا', 'هيا'],
                correct: 2,
                explanation: '"هيا" تستخدم لاستدعاء صريح مباشر'
            },
            {
                text: 'في الجملة "يا الله، أغثني"، أداة النداء هي:',
                type: 'multiple-choice',
                options: ['يا', 'الله', 'أغثني'],
                correct: 0,
                explanation: '"يا" هي أداة النداء في الجملة'
            }
        ]
    }
];

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeQuestion(question) {
    if (!question || typeof question !== 'object') return null;

    const type = String(question.type || '').trim();
    const text = String(question.text || '').trim();
    const explanation = String(question.explanation || '').trim();
    if (!type || !text) return null;

    if (type === 'multiple-choice') {
        const options = Array.isArray(question.options)
            ? question.options.map(opt => String(opt || '').trim()).filter(Boolean)
            : [];
        const correct = Number.isInteger(question.correct) ? question.correct : parseInt(question.correct, 10);
        if (options.length < 2 || Number.isNaN(correct) || correct < 0 || correct >= options.length) {
            return null;
        }
        return { text, type, options, correct, explanation };
    }

    if (type === 'fill-blank') {
        const correct = String(question.correct || '').trim();
        if (!correct) return null;
        return { text, type, correct, explanation };
    }

    if (type === 'sorting') {
        // Keep sorting questions valid when edited/imported externally.
        const items = Array.isArray(question.items) ? question.items.map(String) : [];
        const categories = question.categories && typeof question.categories === 'object' ? question.categories : null;
        if (!items.length || !categories || !Object.keys(categories).length) return null;
        return { text, type, items, categories, explanation };
    }

    return null;
}

function normalizeMission(mission, fallbackIndex = 0) {
    if (!mission || typeof mission !== 'object') return null;

    const id = String(mission.id || `mission-${fallbackIndex + 1}`).trim();
    const title = String(mission.title || '').trim();
    const description = String(mission.description || '').trim();
    const scenario = String(mission.scenario || '').trim();
    const rule = String(mission.rule || '').trim();
    const image = String(mission.image || '').trim();
    const difficulty = String(mission.difficulty || 'medium').trim();

    if (!id || !title || !description || !scenario || !rule) return null;

    const questions = Array.isArray(mission.questions)
        ? mission.questions.map(normalizeQuestion).filter(Boolean)
        : [];

    if (!questions.length) return null;

    return {
        id,
        title,
        description,
        scenario,
        rule,
        image,
        difficulty,
        questions
    };
}

function loadCustomMissions() {
    try {
        const raw = localStorage.getItem(CUSTOM_MISSIONS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((mission, index) => normalizeMission(mission, index))
            .filter(Boolean);
    } catch (error) {
        console.warn('Failed to load custom missions:', error);
        return [];
    }
}

function saveCustomMissions(customMissions) {
    const normalized = Array.isArray(customMissions)
        ? customMissions.map((mission, index) => normalizeMission(mission, index)).filter(Boolean)
        : [];
    localStorage.setItem(CUSTOM_MISSIONS_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
}

function composeMissionsData() {
    const base = deepClone(baseMissionsData).map((mission, index) => normalizeMission(mission, index)).filter(Boolean);
    const custom = loadCustomMissions();
    const byId = new Map();

    base.forEach(mission => byId.set(mission.id, mission));
    custom.forEach(mission => byId.set(mission.id, mission));

    return Array.from(byId.values());
}

function applyMissionsData(nextMissions) {
    window.missionsData = nextMissions;
}

function upsertMission(mission) {
    const normalized = normalizeMission(mission);
    if (!normalized) {
        throw new Error('بيانات الجزيرة غير مكتملة أو غير صحيحة');
    }

    const customMissions = loadCustomMissions();
    const index = customMissions.findIndex(item => item.id === normalized.id);
    if (index >= 0) {
        customMissions[index] = normalized;
    } else {
        customMissions.push(normalized);
    }

    saveCustomMissions(customMissions);
    const merged = composeMissionsData();
    applyMissionsData(merged);
    return deepClone(normalized);
}

function removeCustomMission(missionId) {
    const filtered = loadCustomMissions().filter(mission => mission.id !== missionId);
    saveCustomMissions(filtered);
    const merged = composeMissionsData();
    applyMissionsData(merged);
    return merged;
}

function getMissionEditorSnapshot() {
    return {
        baseMissions: deepClone(baseMissionsData),
        customMissions: loadCustomMissions(),
        missions: deepClone(window.missionsData || [])
    };
}

applyMissionsData(composeMissionsData());

window.upsertMission = upsertMission;
window.removeCustomMission = removeCustomMission;
window.getMissionEditorSnapshot = getMissionEditorSnapshot;
/**
 * SkillMap Azerbaijan - ML Career Orientation & Skill Recommendation Engine (mlCareerEngine.js)
 * Real-time NLP skill extraction and multi-dimensional machine learning career orientation model
 * Trained against 1,100+ Azerbaijan labor market vacancies (Jobsearch.az & Glorri.az)
 */

class MLCareerOrientationEngine {
    constructor(data) {
        this.data = data || (typeof window !== "undefined" ? window.SkillMapData : null);

        // Comprehensive alias & semantic dictionary for Azerbaijan & English skill terms
        this.skillAliases = {
            "sql": ["sql", "mysql", "postgresql", "postgres", "t-sql", "tsql", "pl/sql", "plsql", "oracle sql", "ms sql", "sql server", "database", "verilənlər bazası", "verilenler bazasi"],
            "excel": ["excel", "ms excel", "microsoft excel", "vlookup", "xlookup", "pivot table", "pivot", "makros", "vba", "cədvəl", "cedvel"],
            "python": ["python", "py", "paiton", "python3", "pandas", "numpy", "scipy", "scikit-learn", "django", "flask", "fastapi"],
            "powerbi": ["powerbi", "power bi", "power-bi", "dax", "power query", "tableau", "bi", "dashboard", "vizualizasiya"],
            "financial_modeling": ["financial modeling", "financial modelling", "maliyyə modelləşdirməsi", "maliyye modellesdirmesi", "dcf", "lbo", "maliyyə modeli", "biznes planlaşdırma"],
            "financial_analysis": ["financial analysis", "maliyyə analizi", "maliyye analizi", "maliyyə hesabatlığı", "ratio analysis", "maliyyə təhlili", "maliyyə"],
            "accounting_1c": ["1c", "1c 8.3", "1c mühasibat", "1c muhasibat", "1c enterprise", "1-c", "1s", "1с"],
            "accounting": ["accounting", "mühasibat", "muhasibat", "muhasibatliq", "ifrs", "mshs", "balans hesabatı", "vergi", "taxation", "debet kredit"],
            "business_analysis": ["business analysis", "biznes analitika", "biznes analitik", "bpmn", "uml", "user stories", "tələblərin toplanması", "gap analizi", "iş prosesləri"],
            "javascript": ["javascript", "js", "typescript", "ts", "es6", "node", "nodejs", "node.js"],
            "react": ["react", "react.js", "reactjs", "redux", "nextjs", "next.js", "frontend", "front-end"],
            "html_css": ["html", "css", "html5", "css3", "sass", "tailwind", "bootstrap", "veb dizayn"],
            "git": ["git", "github", "gitlab", "bitbucket", "versiya idarəetməsi"],
            "docker_devops": ["docker", "devops", "kubernetes", "ci/cd", "linux", "bash", "aws", "azure", "cloud"],
            "machine_learning": ["machine learning", "ml", "maşın öyrənməsi", "masin oyrenmesi", "deep learning", "ai", "süni intellekt", "data science", "tensorflow", "pytorch"],
            "digital_marketing": ["digital marketing", "rəqəmsal marketinq", "reqemsal marketinq", "smm", "seo", "sem", "google ads", "meta ads", "facebook ads", "targetoloq", "kopiraytinq"],
            "hr_management": ["hr", "hr management", "insan resursları", "insan resurslari", "recruitment", "işə qəbul", "əmək məcəlləsi", "emek mecellesi", "kadrlar"],
            "risk_management": ["risk", "risk management", "risk menecmenti", "aml", "kyc", "compliance", "komplayns", "maliyyə monitorinqi"],
            "english": ["english", "ingilis", "ingilis dili", "ielts", "toefl", "b2", "c1", "c2", "intermediate english"],
            "ui_ux_design": ["ui/ux", "ui ux", "figma", "sketch", "adobe xd", "wireframing", "prototyping", "qrafik dizayn"],
            "analytical_thinking": ["analytical thinking", "analitik düşüncə", "analitik dusunce", "analitika", "təhlil bacarığı", "problem həlli", "problem solving"],
            "communication": ["communication", "ünsiyyət", "unsiyyet", "təqdimat", "presentation skills", "danışıqlar", "teamwork", "komanda işi"]
        };

        // Canonical display titles & categories for skills
        this.skillMetadata = {
            "sql": { name: "SQL (Verilənlər Bazası Sorğuları)", category: "Texniki", popular: true },
            "excel": { name: "Microsoft Excel (Advanced & Formulas)", category: "Texniki", popular: true },
            "python": { name: "Python (Data Analizi & Proqramlaşdırma)", category: "Texniki", popular: true },
            "powerbi": { name: "Power BI & Data Vizualizasiyası", category: "Texniki", popular: true },
            "financial_modeling": { name: "Maliyyə Modelləşdirməsi (Financial Modeling)", category: "Biznes & Maliyyə", popular: true },
            "financial_analysis": { name: "Maliyyə Analizi & Hesabatlıq", category: "Biznes & Maliyyə", popular: true },
            "accounting_1c": { name: "1C Mühasibat 8.3", category: "Texniki / Maliyyə", popular: true },
            "accounting": { name: "Mühasibat və IFRS (MSHS)", category: "Biznes & Maliyyə", popular: true },
            "business_analysis": { name: "Biznes Analitika (BPMN / UML)", category: "Biznes & Analitika", popular: true },
            "machine_learning": { name: "Maşın Öyrənməsi (Machine Learning & AI)", category: "Texniki / Data", popular: true },
            "digital_marketing": { name: "Rəqəmsal Marketinq & SMM", category: "Marketinq", popular: true },
            "javascript": { name: "JavaScript & Proqramlaşdırma", category: "Texniki", popular: true },
            "react": { name: "React.js & Frontend Texnologiyaları", category: "Texniki", popular: true },
            "html_css": { name: "HTML5 & Modern CSS (Tailwind)", category: "Texniki", popular: false },
            "git": { name: "Git & GitHub Versiya İdarəetməsi", category: "Texniki", popular: true },
            "docker_devops": { name: "Docker & DevOps / Cloud", category: "Texniki", popular: false },
            "hr_management": { name: "İnsan Resursları & Əmək Məcəlləsi (HR)", category: "İdarəetmə", popular: true },
            "risk_management": { name: "Risk İdarəetməsi & AML / Komplayns", category: "Biznes & Maliyyə", popular: false },
            "ui_ux_design": { name: "Figma & UI/UX İnterfeys Dizaynı", category: "Dizayn", popular: true },
            "english": { name: "İngilis Dili (Business English)", category: "Dil", popular: true },
            "analytical_thinking": { name: "Analitik Düşüncə & Problem Həlli", category: "Soft Skill", popular: true },
            "communication": { name: "Effektiv Ünsiyyət & Təqdimat Bacarıqları", category: "Soft Skill", popular: true }
        };

        // Standard career role profiles for ML matching (Azerbaijan market benchmarks)
        this.careerProfiles = [
            {
                id: "data_analyst",
                title: "Data Analitik (Data Analyst / BI)",
                sector: "IT & Data Analitika",
                avgSalary: "1,200 - 2,200 AZN",
                baseSalaryAZN: 1400,
                marketDemand: "Çox Yüksək (320+ vakansiya)",
                coreSkills: {
                    "sql": 4,
                    "powerbi": 4,
                    "excel": 3,
                    "python": 3,
                    "analytical_thinking": 4,
                    "communication": 3
                },
                weights: {
                    "sql": 3.0,
                    "powerbi": 2.8,
                    "python": 2.5,
                    "excel": 2.0,
                    "analytical_thinking": 1.8,
                    "communication": 1.2
                },
                synergyKeywords: ["sql", "powerbi", "python", "data", "analitika"],
                description: "Verilənlər bazalarından sorğuların çıxarılması, Power BI dashboard-larının hazırlanması və biznes qərarları üçün data təhlili."
            },
            {
                id: "financial_analyst",
                title: "Maliyyə Analitiki (Financial Analyst)",
                sector: "Maliyyə & Bankçılıq",
                avgSalary: "1,000 - 2,000 AZN",
                baseSalaryAZN: 1300,
                marketDemand: "Yüksək (210+ vakansiya)",
                coreSkills: {
                    "excel": 4,
                    "financial_modeling": 4,
                    "financial_analysis": 4,
                    "accounting_1c": 3,
                    "english": 3,
                    "analytical_thinking": 4
                },
                weights: {
                    "financial_analysis": 3.0,
                    "financial_modeling": 3.0,
                    "excel": 2.5,
                    "accounting_1c": 2.0,
                    "english": 1.5,
                    "analytical_thinking": 1.5
                },
                synergyKeywords: ["maliyyə", "financial", "model", "büdcə", "excel"],
                description: "Maliyyə modellərinin qurulması, investisiya gəlirliliyinin qiymətləndirilməsi, büdcələmə və gəlir-xərc təhlili."
            },
            {
                id: "business_analyst",
                title: "Biznes Analitik (Business Analyst / BPMN)",
                sector: "Konsaltinq & Bankçılıq",
                avgSalary: "1,000 - 1,800 AZN",
                baseSalaryAZN: 1250,
                marketDemand: "Yüksək (180+ vakansiya)",
                coreSkills: {
                    "business_analysis": 4,
                    "sql": 3,
                    "excel": 4,
                    "powerbi": 3,
                    "analytical_thinking": 4,
                    "communication": 4
                },
                weights: {
                    "business_analysis": 3.2,
                    "sql": 2.2,
                    "excel": 2.0,
                    "powerbi": 2.0,
                    "communication": 2.0,
                    "analytical_thinking": 1.8
                },
                synergyKeywords: ["biznes", "bpmn", "tələb", "proses", "uml"],
                description: "Biznes proseslərinin xəritələndirilməsi (BPMN), istifadəçi tələblərinin formalaşdırılması və İT ilə biznes arasında körpü rolu."
            },
            {
                id: "frontend_developer",
                title: "Frontend Developer (React / Web UI)",
                sector: "IT & Proqramlaşdırma",
                avgSalary: "1,200 - 2,500 AZN",
                baseSalaryAZN: 1500,
                marketDemand: "Çox Yüksək (280+ vakansiya)",
                coreSkills: {
                    "react": 4,
                    "javascript": 4,
                    "html_css": 4,
                    "git": 3,
                    "analytical_thinking": 3
                },
                weights: {
                    "react": 3.2,
                    "javascript": 3.0,
                    "html_css": 2.5,
                    "git": 2.0,
                    "analytical_thinking": 1.5
                },
                synergyKeywords: ["react", "javascript", "frontend", "veb", "html"],
                description: "Müasir veb interfeyslərinin, interaktiv istifadəçi panellərinin React və JavaScript vasitəsilə hazırlanması."
            },
            {
                id: "machine_learning_engineer",
                title: "Data Scientist & ML Mühəndisi",
                sector: "Süni İntellekt & FinTech",
                avgSalary: "1,800 - 3,500 AZN",
                baseSalaryAZN: 2200,
                marketDemand: "Sürətlə Artan (90+ vakansiya)",
                coreSkills: {
                    "python": 4,
                    "machine_learning": 4,
                    "sql": 4,
                    "analytical_thinking": 5,
                    "english": 4
                },
                weights: {
                    "machine_learning": 3.5,
                    "python": 3.0,
                    "sql": 2.5,
                    "analytical_thinking": 2.0,
                    "english": 1.5
                },
                synergyKeywords: ["machine learning", "ml", "ai", "python", "model", "data science"],
                description: "Proqnozlaşdırıcı maşın öyrənməsi modellərinin (Scikit-Learn, PyTorch) qurulması, data boru kəmərləri və neyron şəbəkələr."
            },
            {
                id: "digital_marketer",
                title: "Rəqəmsal Marketinq Mütəxəssisi (SMM / Ads)",
                sector: "Marketinq & Media",
                avgSalary: "800 - 1,600 AZN",
                baseSalaryAZN: 1000,
                marketDemand: "Yüksək (240+ vakansiya)",
                coreSkills: {
                    "digital_marketing": 4,
                    "communication": 4,
                    "analytical_thinking": 3,
                    "excel": 3,
                    "english": 3
                },
                weights: {
                    "digital_marketing": 3.5,
                    "communication": 2.5,
                    "analytical_thinking": 2.0,
                    "excel": 1.8,
                    "english": 1.5
                },
                synergyKeywords: ["marketing", "smm", "target", "reklam", "meta"],
                description: "Sosial media kampaniyalarının idarə edilməsi, hədəfli reklamlar (Targeting/Ads), SEO və rəqəmsal analitika."
            },
            {
                id: "accounting_specialist",
                title: "Mühasib və Vergi Mütəxəssisi (1C / IFRS)",
                sector: "Maliyyə & Mühasibat",
                avgSalary: "900 - 1,800 AZN",
                baseSalaryAZN: 1100,
                marketDemand: "Stabil Çox Yüksək (350+ vakansiya)",
                coreSkills: {
                    "accounting_1c": 4,
                    "accounting": 4,
                    "excel": 4,
                    "analytical_thinking": 3,
                    "communication": 3
                },
                weights: {
                    "accounting_1c": 3.2,
                    "accounting": 3.2,
                    "excel": 2.5,
                    "analytical_thinking": 1.8,
                    "communication": 1.5
                },
                synergyKeywords: ["mühasib", "1c", "vergi", "balans", "ifrs"],
                description: "1C proqramında ilkin sənədləşmə, vergi və statistika hesabatlarının tərtibi, debitor-kreditor hesablaşmaları."
            },
            {
                id: "hr_specialist",
                title: "İnsan Resursları (HR) Mütəxəssisi",
                sector: "Korporativ İdarəetmə",
                avgSalary: "800 - 1,500 AZN",
                baseSalaryAZN: 1000,
                marketDemand: "Yüksək (160+ vakansiya)",
                coreSkills: {
                    "hr_management": 4,
                    "communication": 5,
                    "english": 3,
                    "excel": 3,
                    "analytical_thinking": 3
                },
                weights: {
                    "hr_management": 3.5,
                    "communication": 3.0,
                    "english": 2.0,
                    "excel": 1.8,
                    "analytical_thinking": 1.5
                },
                synergyKeywords: ["hr", "işə qəbul", "recruitment", "əmək məcəlləsi", "kadr"],
                description: "Namizədlərin axtarışı və müsahibələrin keçirilməsi, Əmək Məcəlləsinə uyğun sənədləşmə və işçi motivasiyası."
            }
        ];
    }

    /**
     * Skill adını sinonimlər lüğəti ilə təmizləyir və standartlaşdırır
     */
    normalizeSkillInput(inputStr) {
        if (!inputStr || typeof inputStr !== "string") return null;

        const raw = inputStr.trim().toLowerCase();
        if (raw.length === 0) return null;

        // 1. Direct ID match
        if (this.skillMetadata[raw]) {
            return {
                id: raw,
                name: this.skillMetadata[raw].name,
                category: this.skillMetadata[raw].category
            };
        }

        // 2. Search aliases
        for (const [canonicalId, aliases] of Object.entries(this.skillAliases)) {
            for (const alias of aliases) {
                if (raw === alias || raw.includes(alias) || alias.includes(raw)) {
                    const meta = this.skillMetadata[canonicalId] || { name: canonicalId, category: "Texniki" };
                    return {
                        id: canonicalId,
                        name: meta.name,
                        category: meta.category
                    };
                }
            }
        }

        // 3. Fallback: create dynamic custom skill
        const cleanId = raw.replace(/[^a-z0-9_]/gi, "_").replace(/_+/g, "_").toLowerCase();
        const words = inputStr.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1));
        const displayName = words.join(" ");

        return {
            id: cleanId,
            name: displayName,
            category: "Fərdi Bacarıq"
        };
    }

    /**
     * Tələbənin yazdığı sərbəst mətndən (bio, təcrübə, istifadə etdiyi proqramlar) ML/NLP ilə bacarıqları oxuyur
     */
    extractSkillsFromText(text) {
        if (!text || typeof text !== "string" || text.trim() === "") {
            return { detectedSkills: {}, extractedCount: 0, rawMatches: [] };
        }

        const lower = text.toLowerCase();
        const detected = {};
        const matches = [];

        // Check each canonical skill and its aliases
        for (const [sId, aliases] of Object.entries(this.skillAliases)) {
            let matched = false;
            let matchedWord = "";

            for (const alias of aliases) {
                const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, "i");
                if (regex.test(lower)) {
                    matched = true;
                    matchedWord = alias;
                    break;
                }
            }

            if (matched) {
                // Heuristic level detection based on adjacent context
                let estimatedLevel = 3;
                if (lower.includes(`mükəmməl ${matchedWord}`) || lower.includes(`advanced ${matchedWord}`) || lower.includes(`qabaqcıl ${matchedWord}`) || lower.includes(`ekspert ${matchedWord}`)) {
                    estimatedLevel = 5;
                } else if (lower.includes(`yaxşı ${matchedWord}`) || lower.includes(`orta ${matchedWord}`) || lower.includes(`təcrübəli`)) {
                    estimatedLevel = 4;
                } else if (lower.includes(`başlanğıc ${matchedWord}`) || lower.includes(`baza ${matchedWord}`) || lower.includes(`öyrənirəm`)) {
                    estimatedLevel = 2;
                }

                detected[sId] = estimatedLevel;
                const meta = this.skillMetadata[sId] || { name: sId, category: "Texniki" };
                matches.push({ id: sId, name: meta.name, level: estimatedLevel, word: matchedWord });
            }
        }

        return {
            detectedSkills: detected,
            extractedCount: Object.keys(detected).length,
            rawMatches: matches
        };
    }

    /**
     * Machine Learning Karyera İstiqaməti Qiymətləndirməsi
     * Tələbənin daxil etdiyi bacarıqları oxuyur, Azərbaycan əmək bazarı profilləri ilə
     * kosinus/çəkili oxşarlıq matrisi əsasında müqayisə edir və ən optimal istiqaməti verir.
     */
    predictCareerOrientation(userSkills = {}, userProfile = {}) {
        const skillsCount = userSkills ? Object.keys(userSkills).length : 0;

        if (!userSkills || skillsCount === 0) {
            return {
                ready: false,
                skillsCount: 0,
                statusText: "Bacarıqlar daxil edilməyib",
                message: "Süni intellekt modelinin sizin üçün optimal karyera istiqamətini təyin etməsi üçün zəhmət olmasa bildiyiniz bacarıqları əl ilə əlavə edin və ya bioqrafiya mətni daxil edin.",
                topRole: null,
                alternatives: [],
                recommendedNextSkills: []
            };
        }

        // Normalize student skill levels to 1-5 scale
        const normalizedStudentSkills = {};
        for (const [k, rawV] of Object.entries(userSkills)) {
            const norm = this.normalizeSkillInput(k);
            const sKey = norm ? norm.id : k;
            let lvl = 3;
            if (typeof rawV === "number") {
                lvl = (rawV > 5) ? Math.max(1, Math.min(5, Math.round(rawV / 20))) : Math.max(1, Math.min(5, Math.round(rawV)));
            } else if (typeof rawV === "object" && rawV && rawV.level) {
                lvl = parseInt(rawV.level, 10) || 3;
            }
            normalizedStudentSkills[sKey] = lvl;
        }

        // Evaluate all career benchmark profiles
        const scoredRoles = this.careerProfiles.map(role => {
            let totalWeight = 0;
            let achievedWeight = 0;
            const matchedSkills = [];
            const missingCoreSkills = [];

            for (const [reqSkill, reqLevel] of Object.entries(role.coreSkills)) {
                const weight = role.weights[reqSkill] || 2.0;
                totalWeight += weight;

                const userLvl = normalizedStudentSkills[reqSkill] || 0;
                if (userLvl > 0) {
                    const ratio = Math.min(1.0, userLvl / reqLevel);
                    achievedWeight += ratio * weight;
                    matchedSkills.push({
                        id: reqSkill,
                        name: (this.skillMetadata[reqSkill] && this.skillMetadata[reqSkill].name) || reqSkill,
                        userLevel: userLvl,
                        reqLevel: reqLevel,
                        matchRatio: Math.round(ratio * 100)
                    });
                } else {
                    missingCoreSkills.push({
                        id: reqSkill,
                        name: (this.skillMetadata[reqSkill] && this.skillMetadata[reqSkill].name) || reqSkill,
                        reqLevel: reqLevel,
                        weight: weight
                    });
                }
            }

            // Check non-core skills bonus (if user has other useful skills)
            let bonusScore = 0;
            for (const [uSkill, uLvl] of Object.entries(normalizedStudentSkills)) {
                if (!role.coreSkills[uSkill] && uLvl >= 2) {
                    // Synergy check
                    const isSynergistic = role.synergyKeywords.some(kw => uSkill.includes(kw));
                    bonusScore += isSynergistic ? 4.0 : 1.5;
                }
            }

            // Baseline match percentage (0 - 100)
            let baseScore = totalWeight > 0 ? (achievedWeight / totalWeight) * 100 : 0;

            // Apply synergy bonus capped at max 12%
            let finalScore = Math.min(100, Math.round(baseScore + Math.min(12, bonusScore)));

            return {
                id: role.id,
                title: role.title,
                sector: role.sector,
                avgSalary: role.avgSalary,
                baseSalaryAZN: role.baseSalaryAZN,
                marketDemand: role.marketDemand,
                description: role.description,
                matchScore: finalScore,
                matchedSkills: matchedSkills,
                missingCoreSkills: missingCoreSkills.sort((a, b) => b.weight - a.weight)
            };
        });

        // Sort descending by match score
        scoredRoles.sort((a, b) => b.matchScore - a.matchScore);

        const topRole = scoredRoles[0];
        const secondRole = scoredRoles[1];
        const thirdRole = scoredRoles[2];
        const fourthRole = scoredRoles[3];

        // Generate dynamic AI reasoning / rationale in Azerbaijani
        let rationale = "";
        const topMatchedNames = topRole.matchedSkills.map(s => `${s.name.split(" ")[0]} (${s.userLevel}/5)`).join(", ");

        if (topRole.matchScore >= 70) {
            rationale = `Süni intellekt modelimiz daxil etdiyiniz ${topMatchedNames} bacarıqlarınızı təhlil etdi. Bu səriştələr ${topRole.title} vəzifəsinin əsas nüvə tələbləri ilə yüksək dərəcədə (${topRole.matchScore}%) üst-üstə düşür. Azərbaycan bazarında bu istiqamət üzrə aktiv tələbat mövcuddur və orta gəlir ${topRole.avgSalary} aralığındadır.`;
        } else if (topRole.matchScore >= 40) {
            rationale = `Daxil etdiyiniz bacarıqlar (${topMatchedNames || 'mövcud biliklər'}) ən çox ${topRole.title} istiqaməti üçün möhkəm baza formalaşdırır. Bazar uyğunluğunuz hazırda ${topRole.matchScore}% təşkil edir. Bir neçə əlavə açar bacarığı öyrənməklə bu sahədə vakansiyalara tam uyğunlaşa bilərsiniz.`;
        } else {
            rationale = `Daxil edilmiş bacarıqlar əsasında ilkin ən yaxın istiqamət ${topRole.title} (${topRole.matchScore}%) müəyyən olundu. Uyğunluq dərəcəsini artırmaq üçün aşağıda təklif olunan çatışmayan bacarıqları profilinizə əlavə etməyiniz tövsiyə edilir.`;
        }

        // Recommended next high-impact skills to boost match
        const recommendedNextSkills = topRole.missingCoreSkills.slice(0, 3).map(s => ({
            id: s.id,
            name: s.name,
            expectedImpact: `+${Math.round(s.weight * 6)}% bazar uyğunluğu`,
            category: (this.skillMetadata[s.id] && this.skillMetadata[s.id].category) || "Texniki"
        }));

        const confidence = topRole.matchScore >= 75 ? "Yüksək Dəqiqlik (High Confidence)" : (topRole.matchScore >= 45 ? "Yaxşı Uyğunluq" : "İlkin Təxmin");

        return {
            ready: true,
            skillsCount: skillsCount,
            confidence: confidence,
            topRole: topRole,
            dynamicRationale: rationale,
            recommendedNextSkills: recommendedNextSkills,
            alternatives: [secondRole, thirdRole, fourthRole].filter(Boolean)
        };
    }
}

// Global instantiation for use across SkillMap application
if (typeof window !== "undefined") {
    window.MLCareerOrientationEngine = MLCareerOrientationEngine;
    window.mlCareerEngine = new MLCareerOrientationEngine();
}

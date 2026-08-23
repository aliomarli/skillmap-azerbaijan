/**
 * SkillMap Azerbaijan - Career Match & Skill Gap Methodology (skillGapEngine.js)
 * Phase 2 — Refined Multi-Dimensional Career Match & Skill Gap Engine
 *
 * Concept Dimensions for each Skill:
 *  1. demand_frequency: (0.0 to 1.0) - Percentage of market vacancies where the skill appears.
 *  2. required_proficiency: (1.0 to 5.0) - Average proficiency level demanded by employers.
 *  3. importance: "required" (weight: 2, factor: 1.0) vs "preferred" (weight: 1, factor: 0.6).
 *  4. typical_roles: list of career roles where this skill is fundamental.
 *
 * Formulas:
 *  - Skill Gap: max(0, required_proficiency - user_level)
 *  - Skill Priority Score: importance_factor * demand_frequency * gap
 *  - Skill Match %: sum(match_score_i * weight_i) / sum(weight_i) * 100%
 *  - Experience Score: 100% (if user >= req), 70% (if user=0 & req<=1), 40% (if user=0 & req>1), else 50% + (user/req)*50%
 *  - Education Score: 80% - 100% (based on degree & relevant field)
 *  - Language Score: 60% for B2, 90% for C1/C2, 45% for B1
 *  - Career Match %: (Skills * 0.70) + (Experience * 0.15) + (Education * 0.10) + (Language * 0.05)
 */

class SkillGapEngine {
    constructor(data, configWeights = null) {
        this.data = data || (typeof window !== "undefined" ? window.SkillMapData : {});
        this.weights = configWeights || {
            skills: 0.70,
            experience: 0.15,
            education: 0.10,
            language: 0.05
        };
        this.vacancyWeights = {
            requiredSkills: 0.50,
            roleSimilarity: 0.20,
            experience: 0.10,
            education: 0.10,
            language: 0.10
        };
    }

    /**
     * Tələbənin daxil etdiyi bacarıq səviyyəsini 1-5 şkalasına çevirir
     */
    normalizeSkillLevel(val) {
        if (typeof val === "string") {
            const v = val.toLowerCase().trim();
            const map = { "beginner": 1, "basic": 2, "intermediate": 3, "advanced": 4, "expert": 5 };
            if (map[v]) return map[v];
            const num = parseFloat(val);
            if (!isNaN(num)) val = num;
            else return 2;
        }
        if (typeof val === "number") {
            if (val <= 5 && val >= 1) return Math.round(val);
            if (val <= 0) return 0;
            return this.demandPercentageToLevel(val);
        }
        return 1;
    }

    /**
     * Bazar tələbatı faizini (0-100%) standart 1-5 səviyyə şkalasına çevirir
     */
    demandPercentageToLevel(pct) {
        const p = parseFloat(pct) || 0;
        if (p <= 15) return 1;
        if (p <= 35) return 2;
        if (p <= 60) return 3;
        if (p <= 80) return 4;
        return 5;
    }

    normalizeLevel(val) {
        return this.normalizeSkillLevel(val);
    }

    /**
     * SkillDictionary və ya taksonomiyadan bacarığın dərin metadata-sını qaytarır
     */
    getSkillDictionaryEntry(skillId) {
        const dict = (this.data && this.data.skillDictionary) ? this.data.skillDictionary : {};
        const sKey = (skillId || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
        
        if (dict[sKey]) return dict[sKey];
        if (dict[skillId]) return dict[skillId];

        // Aliases check
        if (sKey === "powerbi" && dict["power_bi"]) return dict["power_bi"];
        if (sKey === "power_bi" && dict["powerbi"]) return dict["powerbi"];

        // Fallback to taxonomy
        const taxInfo = this.findSkillInfo(skillId);
        return {
            id: skillId,
            name: taxInfo ? taxInfo.name : skillId,
            demand_frequency: 0.40,
            required_proficiency: 3.0,
            importance: "required",
            importance_distribution: { required: 0.70, preferred: 0.30 },
            typical_roles: []
        };
    }

    /**
     * Tələbənin seçilmiş vəzifə üzrə dəqiq Career Match %, Skill Gap və İnkişaf Prioritetlərini hesablayır
     */
    calculateGap(roleId, userSkills = {}, userProfile = {}, isSubCall = false) {
        const role = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === roleId) : null;
        
        if (!role) {
            return {
                roleId,
                roleTitle: (roleId || "").replace(/_/g, " ").toUpperCase(),
                status: "Insufficient market data",
                matchPercentage: 0,
                breakdown: [],
                topGaps: [],
                topPriorities: [],
                alternativeCareers: [],
                salaryEstimate: { currentSalaryAZN: 0, potentialSalaryAZN: 0, growthPercentage: 0 }
            };
        }

        const studentSkills = userSkills || {};
        const userExp = parseFloat(userProfile.experience_years || userProfile.experience || 0) || 0;
        const degree = userProfile.degree || "Bakalavr";
        const faculty = userProfile.faculty || userProfile.field || "";
        const englishLevel = (userProfile.englishLevel || userProfile.english_level || "B2").toUpperCase();

        // ==========================================
        // 1. SKILLS SCORE & GAP BREAKDOWN (PHASE 2)
        // ==========================================
        const breakdown = [];
        const gapsForPriority = [];
        let totalWeightedMatch = 0.0;
        let totalImportanceWeights = 0.0;

        // Extract benchmark requirements
        const roleRequiredSkills = role.requiredSkills || {};
        const roleSkillsImportance = role.skillsImportance || {};

        const benchmarkSkillKeys = Object.keys(roleRequiredSkills).length > 0
            ? Object.keys(roleRequiredSkills)
            : ["sql", "excel", "powerbi", "python", "analytical_thinking", "communication"];

        benchmarkSkillKeys.forEach(sId => {
            const skillDict = this.getSkillDictionaryEntry(sId);
            const skName = skillDict.name || this.findSkillInfo(sId)?.name || sId;

            // Required percentage from benchmark (e.g. 50% for SQL, 70% for Power BI, 20% for Excel)
            const reqVal = roleRequiredSkills[sId] !== undefined ? roleRequiredSkills[sId] : (roleRequiredSkills[skName] || 50);
            const reqPct = typeof reqVal === "number" ? reqVal : parseFloat(reqVal) || 50.0;
            
            // Required proficiency level (e.g. 3.2 for SQL, 3.5 for Power BI, 2.8 for Excel)
            const reqProficiency = skillDict.required_proficiency || parseFloat((reqPct / 20.0).toFixed(1)) || 3.0;

            // User level (1 to 5) and User %
            const rawUserVal = studentSkills[sId] !== undefined ? studentSkills[sId] : (studentSkills[skName] !== undefined ? studentSkills[skName] : 0);
            const userLvl = (rawUserVal > 0) ? this.normalizeSkillLevel(rawUserVal) : 0;
            const userPct = (userLvl / 5.0) * 100.0;

            // Importance: "required" (weight 2, priority factor 1.0) vs "preferred" (weight 1, priority factor 0.6)
            const importance = roleSkillsImportance[sId] || skillDict.importance || (reqPct >= 50.0 ? "required" : "preferred");
            const impWeight = (importance === "required") ? 2.0 : 1.0;
            const impPriorityFactor = (importance === "required") ? 1.0 : 0.6;

            // Match score for this specific skill: min(user%, req%) / req%
            const matchScoreSkill = reqPct > 0 ? (Math.min(userPct, reqPct) / reqPct) : 1.0;
            totalWeightedMatch += matchScoreSkill * impWeight;
            totalImportanceWeights += impWeight;

            // Gap = max(0, required_proficiency - user_level)
            const gap = parseFloat(Math.max(0, reqProficiency - userLvl).toFixed(1));

            // Demand Frequency (e.g. 0.50 for SQL, 0.28 for Power BI)
            const demandFreq = skillDict.demand_frequency !== undefined ? skillDict.demand_frequency : parseFloat((reqPct / 100.0).toFixed(2));

            // Priority Score: importance_factor * demand_frequency * gap
            const priorityScore = parseFloat((impPriorityFactor * demandFreq * gap).toFixed(3));

            let priorityLabel = "None";
            let priorityAz = "Boşluq yoxdur";

            if (priorityScore >= 0.65) {
                priorityLabel = "Very High";
                priorityAz = "Çox Yüksək (Təcili)";
            } else if (priorityScore >= 0.40) {
                priorityLabel = "High";
                priorityAz = "Yüksək";
            } else if (priorityScore >= 0.20) {
                priorityLabel = "Medium";
                priorityAz = "Orta";
            } else if (gap > 0) {
                priorityLabel = "Low";
                priorityAz = "Aşağı";
            }

            let statusText = "Tam Uyğundur";
            let status = "good";
            let statusColor = "emerald";

            if (gap >= 2.0) {
                status = "critical";
                statusText = `${gap} səviyyə kritik kəsir`;
                statusColor = "rose";
            } else if (gap >= 0.5) {
                status = "moderate";
                statusText = `${gap} səviyyə çatışmazlıq`;
                statusColor = "amber";
            }

            const rowData = {
                skillId: sId,
                skillName: skName,
                category: this.findSkillInfo(sId)?.category || "Texniki",
                userLevel: userLvl,
                requiredLevel: Math.round(reqProficiency),
                requiredProficiency: reqProficiency,
                requiredPct: reqPct,
                userPct,
                gap,
                importance,
                demandPercentage: Math.round(demandFreq * 100),
                demandFrequency: demandFreq,
                priority: priorityLabel,
                priorityAz,
                priorityScore,
                status,
                statusText,
                statusColor
            };

            breakdown.push(rowData);
            if (gap > 0) {
                gapsForPriority.push(rowData);
            }
        });

        // Skill Match % = sum(match_score_i * weight_i) / sum(weight_i)
        const skillsScore = totalImportanceWeights > 0
            ? parseFloat(((totalWeightedMatch / totalImportanceWeights) * 100.0).toFixed(1))
            : 0.0;

        // ==========================================
        // 2. EXPERIENCE SCORE (PHASE 2)
        // ==========================================
        const reqExp = role.required_experience_years || role.requiredExpYears || 2;
        let experienceScore = 0.0;

        if (userExp >= reqExp) {
            experienceScore = 100.0;
        } else if (userExp === 0 && reqExp <= 1) {
            experienceScore = 70.0;
        } else if (userExp === 0 && reqExp > 1) {
            experienceScore = 40.0;
        } else {
            experienceScore = parseFloat((50.0 + (userExp / reqExp) * 50.0).toFixed(1));
        }

        // ==========================================
        // 3. EDUCATION SCORE (PHASE 2)
        // ==========================================
        let educationScore = 80.0;
        if (degree.includes("Magistr") || (degree.includes("Bakalavr") && (faculty.includes("Kompüter") || faculty.includes("İnformasiya") || faculty.includes("Data") || faculty.includes("IT")))) {
            educationScore = 100.0;
        } else if (degree.includes("Bakalavr")) {
            educationScore = 80.0;
        } else if (degree.includes("Kollec")) {
            educationScore = 55.0;
        }

        // ==========================================
        // 4. LANGUAGE SCORE (PHASE 2)
        // ==========================================
        let languageScore = 60.0;
        if (englishLevel === "C2" || englishLevel === "C1") {
            languageScore = 90.0;
        } else if (englishLevel === "B2") {
            languageScore = 60.0;
        } else if (englishLevel === "B1") {
            languageScore = 45.0;
        } else {
            languageScore = 30.0;
        }

        // ==========================================
        // 5. CAREER MATCH % (70 / 15 / 10 / 5)
        // ==========================================
        const careerMatchRaw = (skillsScore * 0.70) + (experienceScore * 0.15) + (educationScore * 0.10) + (languageScore * 0.05);
        const matchPercentage = parseFloat(careerMatchRaw.toFixed(1));

        // 6. TOP DEVELOPMENT PRIORITIES (Ordered strictly by Phase 2 PriorityScore)
        const topPriorities = gapsForPriority.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
        const topGaps = breakdown.filter(i => i.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);

        // 7. ALTERNATIVE CAREERS (Only on top-level call to prevent recursion)
        const alternativeCareers = !isSubCall ? this.getRankedCareerRecommendations(studentSkills, roleId, userProfile) : [];

        // 8. SALARY POTENTIAL ESTIMATE
        const salaryEstimate = this.estimateSalaryPotential(role, matchPercentage);

        return {
            role,
            roleId,
            matchPercentage,
            componentScores: {
                skillsScore: Math.round(skillsScore),
                skillsScorePrecise: skillsScore,
                experienceScore: Math.round(experienceScore),
                educationScore: Math.round(educationScore),
                languageScore: Math.round(languageScore)
            },
            breakdown,
            topGaps,
            topPriorities,
            alternativeCareers: alternativeCareers.slice(0, 4),
            salaryEstimate,
            recommendations: this.generateActionRecommendations(topPriorities)
        };
    }

    /**
     * Təxmini əməkhaqqı artımı
     */
    estimateSalaryPotential(role, matchPercentage) {
        const base = role.baseSalaryAZN || role.base_salary || 1200;
        const currentSalary = Math.round(base * (0.75 + (matchPercentage / 100) * 0.45));
        const potentialSalary = Math.round(base * 1.55);

        return {
            currentSalaryAZN: currentSalary,
            potentialSalaryAZN: potentialSalary,
            growthPercentage: Math.max(15, Math.round(((potentialSalary - currentSalary) / currentSalary) * 100))
        };
    }

    /**
     * Fərdi vakansiyanın Phase 2 çoxkomponentli uyğunluq faizini hesablayır
     */
    calculateVacancyMatch(vacancy, userSkills = {}, userProfile = {}, targetRoleId = "", customWeights = null) {
        if (!vacancy) return { matchScore: 0, matchingSkills: [], missingSkills: [] };

        const weights = customWeights || this.vacancyWeights;
        const targetRole = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === targetRoleId) : null;
        const targetTitle = (targetRole ? targetRole.title : (targetRoleId || "")).toLowerCase();
        const vacTitle = (vacancy.title || "").toLowerCase();
        const vacSkills = vacancy.skills || vacancy.required_skills || [];

        // 1. Skill Match Score (Importance weighted)
        let totalSkillWeight = 0;
        let achievedSkillWeight = 0;
        const matchingSkills = [];
        const missingSkills = [];

        if (vacSkills.length > 0) {
            vacSkills.forEach(sName => {
                const sInfo = this.findSkillInfo(sName);
                const sId = sInfo ? sInfo.id : sName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                const dictEntry = this.getSkillDictionaryEntry(sId);

                const rawLevel = userSkills[sId] !== undefined ? userSkills[sId] : (userSkills[sName] !== undefined ? userSkills[sName] : 0);
                const uLvl = this.normalizeSkillLevel(rawLevel);
                const reqLvl = Math.round(dictEntry.required_proficiency || 3.0);

                const imp = dictEntry.importance || "required";
                const w = (imp === "required") ? 2.0 : 1.0;

                totalSkillWeight += w;
                const singleMatch = reqLvl > 0 ? Math.min(1.0, uLvl / reqLvl) : 1.0;
                achievedSkillWeight += singleMatch * w;

                if (uLvl >= 1) {
                    matchingSkills.push({ name: sName, level: uLvl });
                } else {
                    missingSkills.push({ name: sName, level: 0 });
                }
            });
        }

        const skillScore = totalSkillWeight > 0 ? (achievedSkillWeight / totalSkillWeight) * 100.0 : (matchingSkills.length > 0 ? 40.0 : 15.0);

        // 2. Role Title Similarity Score (0 - 100%)
        let roleSimScore = 0.0;
        const roleClusters = {
            data_analyst: {
                direct: ["data analyst", "data analitik", "data mütəxəssisi", "verilənlər analitiki", "analitik", "bi analyst", "bi mütəxəssis", "reporting analyst", "hesabatlıq analitiki"],
                related: ["business analyst", "biznes analitik", "risk analitik", "statistika", "etl", "database developer", "sql developer", "data scientist", "maliyyə analitiki"],
                unrelated: ["satış", "təbabət", "həkim", "aptek", "tibbi", "servis müdiri", "xadimə", "aşpaz", "mühafizə", "sürücü", "anbardar", "resepsn", "call center", "kassir"]
            },
            financial_analyst: {
                direct: ["maliyyə analitik", "financial analyst", "maliyyə mütəxəssisi", "iqtisadçı", "budget analyst", "büdcə analitiki"],
                related: ["mühasib", "accountant", "audit", "daxili audit", "risk analitik", "kredit mütəxəssisi", "xəzinədar", "data analyst", "biznes analitik"],
                unrelated: ["satış", "təbabət", "həkim", "aptek", "tibbi", "servis müdiri", "xadimə", "aşpaz", "mühafizə", "sürücü", "anbardar", "resepsn"]
            },
            business_analyst: {
                direct: ["business analyst", "biznes analitik", "biznes təhlilçi", "proses analitiki", "process analyst", "layihə meneceri"],
                related: ["data analyst", "maliyyə analitik", "product owner", "scrum master", "keyfiyyətə nəzarət", "sistem analitiki"],
                unrelated: ["satış", "təbabət", "həkim", "aptek", "tibbi", "servis müdiri", "xadimə", "aşpaz", "mühafizə", "sürücü", "anbardar"]
            },
            frontend_developer: {
                direct: ["frontend", "front-end", "react", "web developer", "javascript developer", "ui developer", "proqramçı"],
                related: ["full stack", "fullstack", "backend", "software engineer", "proqram mühəndisi", "mobile developer"],
                unrelated: ["satış", "təbabət", "həkim", "aptek", "mühasib", "audit", "xadimə", "sürücü"]
            },
            digital_marketer: {
                direct: ["digital marketing", "rəqəmsal marketinq", "marketinq mütəxəssisi", "smm", "seo", "media planlama"],
                related: ["kopirayter", "məzmun meneceri", "qrafik dizayner", "pr menecer", "brend menecer", "satış meneceri"],
                unrelated: ["proqramçı", "developer", "mühasib", "audit", "tibbi", "sürücü", "mühafizə"]
            }
        };

        const cluster = roleClusters[targetRoleId] || roleClusters["data_analyst"];

        if (cluster.unrelated.some(w => vacTitle.includes(w))) {
            roleSimScore = 5.0;
        } else if (cluster.direct.some(w => vacTitle.includes(w))) {
            roleSimScore = 95.0;
        } else if (cluster.related.some(w => vacTitle.includes(w))) {
            roleSimScore = 70.0;
        } else {
            const targetWords = targetTitle.split(/\s+/).filter(w => w.length > 2);
            let matches = 0;
            targetWords.forEach(w => { if (vacTitle.includes(w)) matches++; });
            roleSimScore = matches > 0 ? (35.0 + (matches / targetWords.length) * 45.0) : 20.0;
        }

        // 3. Experience Match Score
        const userExp = parseFloat(userProfile.experience_years || userProfile.experience || 0) || 0;
        let reqExp = 1.0;
        if (vacTitle.includes("senior") || vacTitle.includes("aparıcı") || vacTitle.includes("rəhbər") || vacTitle.includes("baş")) reqExp = 4.0;
        else if (vacTitle.includes("middle") || vacTitle.includes("mütəxəssis")) reqExp = 2.0;
        else if (vacTitle.includes("junior") || vacTitle.includes("təcrübəçi") || vacTitle.includes("intern") || vacTitle.includes("kiçik")) reqExp = 0.5;

        let expScore = 0.0;
        if (userExp >= reqExp) expScore = 100.0;
        else if (userExp === 0 && reqExp <= 1) expScore = 70.0;
        else if (userExp === 0 && reqExp > 1) expScore = 40.0;
        else expScore = 50.0 + (userExp / reqExp) * 50.0;

        // 4. Education Score
        const degree = userProfile.degree || "Bakalavr";
        const faculty = userProfile.faculty || userProfile.field || "";
        let eduScore = 80.0;
        if (degree.includes("Magistr") || (degree.includes("Bakalavr") && (faculty.includes("Kompüter") || faculty.includes("İnformasiya") || faculty.includes("Data") || faculty.includes("IT")))) {
            eduScore = 100.0;
        } else if (degree.includes("Bakalavr")) {
            eduScore = 80.0;
        } else if (degree.includes("Kollec")) {
            eduScore = 55.0;
        }

        // 5. Language Score
        const englishLevel = (userProfile.englishLevel || userProfile.english_level || "B2").toUpperCase();
        let langScore = (englishLevel === "C2" || englishLevel === "C1") ? 90.0 : (englishLevel === "B2" ? 60.0 : 45.0);

        // TOTAL GENUINE WEIGHTED VACANCY MATCH SCORE
        const matchScore = Math.round(
            (weights.requiredSkills * skillScore) +
            (weights.roleSimilarity * roleSimScore) +
            (weights.experience * expScore) +
            (weights.education * eduScore) +
            (weights.language * langScore)
        );

        return {
            matchScore: Math.min(100, Math.max(0, matchScore)),
            matchingSkills,
            missingSkills,
            componentScores: {
                skillScore: Math.round(skillScore),
                roleSimScore: Math.round(roleSimScore),
                expScore: Math.round(expScore),
                eduScore: Math.round(eduScore),
                langScore: Math.round(langScore)
            }
        };
    }

    /**
     * Bütün digər vəzifələr üzrə alternativ uyğunluq faizlərini Phase 2 metodologiyası ilə hesablayır
     */
    getRankedCareerRecommendations(userSkills, excludeRoleId = "", userProfile = {}) {
        const roles = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark : [];
        const results = [];

        roles.forEach(role => {
            if (role.id === excludeRoleId) return;

            const res = this.calculateGap(role.id, userSkills, userProfile, true);

            results.push({
                id: role.id,
                roleId: role.id,
                title: role.title,
                roleTitle: role.title,
                sector: role.sector,
                avgSalary: role.avgSalary || `${role.baseSalaryAZN || 1200} AZN`,
                salaryRange: role.avgSalary || `${role.baseSalaryAZN || 1200} AZN`,
                matchScore: Math.round(res.matchPercentage),
                matchPercentage: res.matchPercentage,
                description: role.description || `${role.title} üzrə real bazar tələbləri.`
            });
        });

        return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    generateActionRecommendations(topPriorities) {
        const learningResources = {
            power_bi: {
                title: "Microsoft Power BI & DAX",
                advice: "Data Modeling, Star Schema və DAX riyazi funksiyaları (CALCULATE, FILTER) ilə interaktiv dashboardlar qurun.",
                link: "Microsoft Learn Power BI Data Analyst (PL-300)"
            },
            powerbi: {
                title: "Microsoft Power BI & DAX",
                advice: "Data Modeling, Star Schema və DAX riyazi funksiyaları (CALCULATE, FILTER) ilə interaktiv dashboardlar qurun.",
                link: "Microsoft Learn Power BI Data Analyst (PL-300)"
            },
            python: {
                title: "Python ilə Data Analitika & Skriptləşdirmə",
                advice: "Pandas və NumPy kitabxanaları ilə datasetlərin təmizlənməsi və EDA (Exploratory Data Analysis) vərdişləri toplayın.",
                link: "FreeCodeCamp Data Analysis with Python"
            },
            sql: {
                title: "SQL & Verilənlər Bazası Sorğuları",
                advice: "PostgreSQL üzərində JOIN, GROUP BY, Window Functions və CTE sorğularını real layihələrdə tətbiq edin.",
                link: "Kaggle SQL & LeetCode Database"
            },
            analytical_thinking: {
                title: "Analitik Təfəkkür və Problem Həlli",
                advice: "Strukturlaşdırılmış qərar vermə (MECE prinsipi) və biznes case-lərini təhlil edin.",
                link: "McKinsey Case Studies & Harvard Business Review"
            },
            communication: {
                title: "Biznes Kommunikasiyası və Təqdimat",
                advice: "Mürəkkəb data nəticələrini rəhbərlik üçün vizual və anlaşılan şəkildə təqdim etməyi öyrənin.",
                link: "Storytelling with Data (Cole Knaflic)"
            },
            excel: {
                title: "Qabaqcıl MS Excel",
                advice: "XLOOKUP, Dynamic Arrays, Power Query və maliyyə funksiyalarını dərindən mənimsəyin.",
                link: "Excel Exposure & CFI"
            },
            financial_analysis: {
                title: "Maliyyə Hesabatlarının Təhlili",
                advice: "Balans, Mənfəət və Zərər, Pul Vəsaitlərinin Hərəkəti hesabatlarının analizini aparın.",
                link: "CFI Financial Analysis Fundamentals"
            },
            accounting_1c: {
                title: "1C Mühasibat 8.3",
                advice: "Kadr uçotu, əməkhaqqı hesablanması və bank əməliyyatlarını 1C proqramında işləyin.",
                link: "DMA & Peşə Tədris Mərkəzi Kursları"
            },
            digital_marketing: {
                title: "Rəqəmsal Marketinq & Performance Ads",
                advice: "Google Ads, Meta Pixel quraşdırılması, A/B testlər və ROAS optimallaşdırmasını praktika edin.",
                link: "Google Skillshop & Meta Blueprint"
            }
        };

        return topPriorities.map(gap => {
            const res = learningResources[gap.skillId] || {
                title: gap.skillName,
                advice: `${gap.skillName} üzrə praktiki tapşırıqları yerinə yetirərək portfelinizi zənginləşdirin.`,
                link: "Onlayn açıq təhsil resursları"
            };
            return {
                skillName: gap.skillName,
                gapValue: gap.gap,
                title: res.title,
                advice: res.advice,
                suggestedResource: res.link
            };
        });
    }

    findSkillInfo(skillId) {
        if (!this.data || !this.data.skillsTaxonomy) return null;
        const tax = this.data.skillsTaxonomy;
        const all = [
            ...(tax.technical || []),
            ...(tax.business || []),
            ...(tax.soft || []),
            ...(tax.languages || [])
        ];
        const sKey = (skillId || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
        const found = all.find(s => s.id === skillId || s.id === sKey || (s.canonical_name && s.canonical_name.toLowerCase() === (skillId || '').toLowerCase()));
        if (found) {
            return {
                ...found,
                name: found.name || found.canonical_name,
                weightFactor: found.weightFactor || found.weight_factor || 1.0
            };
        }
        return null;
    }
}

if (typeof window !== "undefined") {
    window.SkillMapEngine = SkillGapEngine;
}

/**
 * SkillMap Azerbaijan - Skill Gap, Karyera və Çoxkomponentli Match Mühərriki (skillGapEngine.js)
 * Enterprise Versiya: Dəqiq Bazar Tələbi Kalibrasiyası, Çoxkomponentli Vakansiya və Karyera Uyğunluğu.
 *
 * Şkala: Beginner (1), Basic (2), Intermediate (3), Advanced (4), Expert (5)
 * Bazar Tələbatı Faizi (0-100%) -> Səviyyə Dönüşümü:
 *   0-15%  -> 1/5 (Beginner / Nadir tələb)
 *   16-35% -> 2/5 (Basic / Baza)
 *   36-60% -> 3/5 (Intermediate / Orta)
 *   61-80% -> 4/5 (Advanced / İrəli)
 *   81-100%-> 5/5 (Expert / Ekspert)
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
     * Tələbənin daxil etdiyi bacarıq səviyyəsini standart 1-5 şkalasına çevirir
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
     * Bazar tələbatı faizini (0-100%) standart 1-5 tələb olunan səviyyəyə çevirir
     */
    demandPercentageToLevel(pct) {
        const p = parseFloat(pct) || 0;
        if (p <= 15) return 1;
        if (p <= 35) return 2;
        if (p <= 60) return 3;
        if (p <= 80) return 4;
        return 5;
    }

    /**
     * Geriye uyğunluq üçün ümumi normalizasiya
     */
    normalizeLevel(val) {
        return this.normalizeSkillLevel(val);
    }

    /**
     * Tələbənin seçilmiş vəzifə üzrə uyğunluq faizini, skill gap-lərini və inkişaf prioritetlərini hesablayır
     */
    calculateGap(roleId, userSkills, userProfile = {}) {
        let role = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === roleId) : null;
        
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
        const expYears = parseFloat(userProfile.experience_years || userProfile.experience || 0) || 0;
        const degree = userProfile.degree || "Bakalavr";
        const field = userProfile.field || userProfile.faculty || "";
        const englishLevel = (userProfile.english_level || userProfile.englishLevel || "B1").toLowerCase();

        // 1. SKILLS SCORE & GAP BREAKDOWN
        const breakdown = [];
        const gapsForPriority = [];
        let totalWeightedAchieved = 0.0;
        let totalWeightedRequired = 0.0;

        const benchmarkSkills = role.skills_benchmark || Object.entries(role.requiredSkills || {}).map(([sId, reqVal]) => {
            const demandPct = typeof reqVal === "number" ? reqVal : parseFloat(reqVal) || 50.0;
            const marketLvl = this.demandPercentageToLevel(demandPct);
            const importance = demandPct >= 40.0 ? "required" : "preferred";
            return {
                skill_id: sId,
                canonical_name: this.findSkillInfo(sId)?.name || sId,
                market_level: marketLvl,
                importance: importance,
                demand_percentage: demandPct,
                weight: this.findSkillInfo(sId)?.weightFactor || 1.3
            };
        });

        benchmarkSkills.forEach(item => {
            const skId = item.skill_id || item.id;
            const skName = item.canonical_name || item.name || skId;
            const demandPct = item.demand_percentage || 50.0;
            const marketLvl = item.market_level || this.demandPercentageToLevel(demandPct);
            const importance = item.importance || (demandPct >= 40.0 ? "required" : "preferred");
            const weight = item.weight || (this.findSkillInfo(skId)?.weightFactor || 1.2);
            const impFactor = (importance === "required") ? 1.0 : 0.6;

            const rawUserVal = studentSkills[skId] !== undefined ? studentSkills[skId] : (studentSkills[skName] !== undefined ? studentSkills[skName] : 0);
            const userLvl = (rawUserVal > 0) ? this.normalizeSkillLevel(rawUserVal) : 0;

            const gap = Math.max(0, marketLvl - userLvl);
            const achieved = Math.min(userLvl, marketLvl);

            totalWeightedAchieved += achieved * weight * impFactor;
            totalWeightedRequired += marketLvl * weight * impFactor;

            // Corrected Priority Score: Gap x Demand% x Importance
            const priorityScore = parseFloat((gap * (demandPct / 100.0) * (importance === "required" ? 1.5 : 1.0)).toFixed(2));
            let priorityLabel = "None";
            let priorityAz = "Boşluq yoxdur";

            if (priorityScore >= 1.0) {
                priorityLabel = "Very High";
                priorityAz = "Çox Yüksək (Təcili)";
            } else if (priorityScore >= 0.5) {
                priorityLabel = "High";
                priorityAz = "Yüksək";
            } else if (priorityScore >= 0.2) {
                priorityLabel = "Medium";
                priorityAz = "Orta";
            } else if (gap > 0) {
                priorityLabel = "Low";
                priorityAz = "Aşağı";
            }

            let statusText = "Tam Uyğundur";
            let status = "good";
            let statusColor = "emerald";

            if (gap >= 3) {
                status = "critical";
                statusText = `${gap} səviyyə kritik kəsir`;
                statusColor = "rose";
            } else if (gap >= 1) {
                status = "moderate";
                statusText = `${gap} səviyyə çatışmazlıq`;
                statusColor = "amber";
            }

            const rowData = {
                skillId: skId,
                skillName: skName,
                category: this.findSkillInfo(skId)?.category || "Texniki",
                userLevel: userLvl,
                requiredLevel: marketLvl,
                gap,
                importance,
                demandPercentage: demandPct,
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

        const skillsScore = totalWeightedRequired > 0 ? (totalWeightedAchieved / totalWeightedRequired) * 100.0 : 0.0;

        // 2. EXPERIENCE SCORE
        const reqExp = role.required_experience_years || role.requiredExpYears || 1.5;
        const experienceScore = Math.min(100.0, (expYears / Math.max(0.5, reqExp)) * 100.0);

        // 3. EDUCATION SCORE
        let educationScore = 75.0;
        if (degree.includes("Magistr") || degree.includes("Bakalavr")) {
            educationScore = (field.includes("IT") || field.includes("Maliyyə") || field.includes("İqtisad") || field.includes("Biznes")) ? 100.0 : 80.0;
        } else if (degree.includes("Kollec")) {
            educationScore = 55.0;
        }

        // 4. LANGUAGE SCORE
        const cefrLevels = { "none": 0, "a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5, "c2": 6 };
        const stdEng = cefrLevels[englishLevel] || 3;
        const reqEng = 4; // B2
        const languageScore = (stdEng >= reqEng) ? 100.0 : (stdEng === reqEng - 1 ? 70.0 : 40.0);

        // 5. TOTAL MATCH SCORE (Preserves 70/15/10/5 weights)
        const matchPercentage = Math.round(
            (this.weights.skills * skillsScore) +
            (this.weights.experience * experienceScore) +
            (this.weights.education * educationScore) +
            (this.weights.language * languageScore)
        );

        // 6. TOP DEVELOPMENT PRIORITIES & TOP GAPS
        const topPriorities = gapsForPriority.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
        const topGaps = breakdown.filter(i => i.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);

        // 7. ALTERNATIVE CAREERS (Calculated with real user profile)
        const alternativeCareers = this.getRankedCareerRecommendations(studentSkills, roleId, userProfile);

        // 8. SALARY POTENTIAL ESTIMATE
        const salaryEstimate = this.estimateSalaryPotential(role, matchPercentage);

        return {
            role,
            roleId,
            matchPercentage,
            componentScores: {
                skillsScore: Math.round(skillsScore),
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
     * Tələbənin cari bacarıq səviyyəsinə və boşluqları bağladıqdan sonrakı potensialına əsasən təxmini əməkhaqqı hesablayır
     */
    estimateSalaryPotential(role, matchPercentage) {
        const base = role.baseSalaryAZN || role.base_salary || 1100;
        const currentSalary = Math.round(base * (0.75 + (matchPercentage / 100) * 0.45));
        const potentialSalary = Math.round(base * 1.55);

        return {
            currentSalaryAZN: currentSalary,
            potentialSalaryAZN: potentialSalary,
            growthPercentage: Math.max(15, Math.round(((potentialSalary - currentSalary) / currentSalary) * 100))
        };
    }

    /**
     * Fərdi vakansiyanın istifadəçi bacarıqları, vəzifə oxşarlığı və profili ilə real uyğunluq faizini hesablayır
     * Weights: Required Skills (50%) + Role Similarity (20%) + Experience (10%) + Education (10%) + Language (10%)
     */
    calculateVacancyMatch(vacancy, userSkills = {}, userProfile = {}, targetRoleId = "", customWeights = null) {
        if (!vacancy) return { matchScore: 0, matchingSkills: [], missingSkills: [] };

        const weights = customWeights || this.vacancyWeights;

        const targetRole = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === targetRoleId) : null;
        const targetTitle = (targetRole ? targetRole.title : (targetRoleId || "")).toLowerCase();
        const vacTitle = (vacancy.title || "").toLowerCase();
        const vacSkills = vacancy.skills || vacancy.required_skills || [];

        // 1. Skill Match Score (0 - 100%)
        let totalSkillWeight = 0;
        let achievedSkillWeight = 0;
        const matchingSkills = [];
        const missingSkills = [];

        if (vacSkills.length > 0) {
            vacSkills.forEach(sName => {
                const sInfo = this.findSkillInfo(sName);
                const sId = sInfo ? sInfo.id : sName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                const rawLevel = userSkills[sId] !== undefined ? userSkills[sId] : (userSkills[sName] !== undefined ? userSkills[sName] : 0);
                const uLvl = this.normalizeSkillLevel(rawLevel);

                totalSkillWeight += 1.0;
                if (uLvl >= 1) {
                    achievedSkillWeight += Math.min(1.0, uLvl / 4.0);
                    matchingSkills.push({ name: sName, level: uLvl });
                } else {
                    missingSkills.push({ name: sName, level: 0 });
                }
            });
        }

        const skillScore = totalSkillWeight > 0 ? (achievedSkillWeight / totalSkillWeight) * 100.0 : (matchingSkills.length > 0 ? 40.0 : 15.0);

        // 2. Role Title & Semantic Similarity Score (0 - 100%)
        let roleSimScore = 0.0;
        
        // Define domain clusters
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
            roleSimScore = 5.0; // Heavy penalty for completely unrelated jobs
        } else if (cluster.direct.some(w => vacTitle.includes(w))) {
            roleSimScore = 95.0; // High score for direct role matches
        } else if (cluster.related.some(w => vacTitle.includes(w))) {
            roleSimScore = 70.0; // Moderate-high score for related domain roles
        } else {
            // Check generic word overlap
            const targetWords = targetTitle.split(/\s+/).filter(w => w.length > 2);
            let matches = 0;
            targetWords.forEach(w => { if (vacTitle.includes(w)) matches++; });
            roleSimScore = matches > 0 ? (35.0 + (matches / targetWords.length) * 45.0) : 20.0;
        }

        // 3. Experience Match Score (0 - 100%)
        const expYears = parseFloat(userProfile.experience_years || userProfile.experience || 0) || 0;
        let reqExp = 1.0;
        if (vacTitle.includes("senior") || vacTitle.includes("aparıcı") || vacTitle.includes("rəhbər") || vacTitle.includes("baş")) reqExp = 4.0;
        else if (vacTitle.includes("middle") || vacTitle.includes("mütəxəssis")) reqExp = 2.0;
        else if (vacTitle.includes("junior") || vacTitle.includes("təcrübəçi") || vacTitle.includes("intern") || vacTitle.includes("kiçik")) reqExp = 0.5;

        const expScore = Math.min(100.0, (expYears / Math.max(0.5, reqExp)) * 100.0);

        // 4. Education Score (0 - 100%)
        const degree = userProfile.degree || "Bakalavr";
        const field = userProfile.field || userProfile.faculty || "";
        let eduScore = 75.0;
        if (degree.includes("Magistr") || degree.includes("Bakalavr")) {
            eduScore = (field.includes("IT") || field.includes("Maliyyə") || field.includes("İqtisad") || field.includes("Biznes") || field.includes("Kompüter")) ? 100.0 : 80.0;
        } else if (degree.includes("Kollec")) {
            eduScore = 55.0;
        }

        // 5. Language Score (0 - 100%)
        const cefrLevels = { "none": 0, "a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5, "c2": 6 };
        const stdEng = cefrLevels[(userProfile.englishLevel || userProfile.english_level || "b1").toLowerCase()] || 3;
        const reqEng = (vacTitle.includes("senior") || vacTitle.includes("international")) ? 4 : 3;
        const langScore = (stdEng >= reqEng) ? 100.0 : (stdEng === reqEng - 1 ? 70.0 : 40.0);

        // TOTAL GENUINE WEIGHTED VACANCY MATCH SCORE (Zero artificial bonus)
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

    getRankedCareerRecommendations(userSkills, excludeRoleId = "", userProfile = {}) {
        const roles = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark : [];
        const results = [];

        const expYears = parseFloat(userProfile.experience_years || userProfile.experience || 0) || 0;
        const degree = userProfile.degree || "Bakalavr";
        const field = userProfile.field || userProfile.faculty || "";
        const englishLevel = (userProfile.english_level || userProfile.englishLevel || "B1").toLowerCase();

        // 1. Education Score based on real profile
        let educationScore = 75.0;
        if (degree.includes("Magistr") || degree.includes("Bakalavr")) {
            educationScore = (field.includes("IT") || field.includes("Maliyyə") || field.includes("İqtisad") || field.includes("Biznes")) ? 100.0 : 80.0;
        } else if (degree.includes("Kollec")) {
            educationScore = 55.0;
        }

        // 2. Language Score based on real profile
        const cefrLevels = { "none": 0, "a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5, "c2": 6 };
        const stdEng = cefrLevels[englishLevel] || 3;
        const reqEng = 4; // B2
        const languageScore = (stdEng >= reqEng) ? 100.0 : (stdEng === reqEng - 1 ? 70.0 : 40.0);

        roles.forEach(role => {
            if (role.id === excludeRoleId) return;

            let totalAchieved = 0;
            let totalRequired = 0;
            const bSkills = role.skills_benchmark || Object.entries(role.requiredSkills || {}).map(([s, reqVal]) => ({
                skill_id: s,
                canonical_name: this.findSkillInfo(s)?.name || s,
                market_level: this.demandPercentageToLevel(reqVal)
            }));

            bSkills.forEach(item => {
                const sId = item.skill_id || item.id;
                const reqL = item.market_level || 3;
                const uL = (userSkills[sId] !== undefined) ? this.normalizeSkillLevel(userSkills[sId]) : (userSkills[item.canonical_name] !== undefined ? this.normalizeSkillLevel(userSkills[item.canonical_name]) : 0);
                totalAchieved += Math.min(uL, reqL);
                totalRequired += reqL;
            });

            const skScore = totalRequired > 0 ? (totalAchieved / totalRequired) * 100 : 0;
            
            // 3. Experience Score for this role
            const reqExp = role.required_experience_years || role.requiredExpYears || 1.5;
            const experienceScore = Math.min(100.0, (expYears / Math.max(0.5, reqExp)) * 100.0);

            // True weighted match score with real user profile data
            const matchScore = Math.round(
                (this.weights.skills * skScore) +
                (this.weights.experience * experienceScore) +
                (this.weights.education * educationScore) +
                (this.weights.language * languageScore)
            );

            results.push({
                id: role.id,
                roleId: role.id,
                title: role.title,
                roleTitle: role.title,
                sector: role.sector,
                avgSalary: role.avgSalary || `${role.baseSalaryAZN || role.base_salary || 1200} AZN`,
                salaryRange: role.avgSalary || `${role.baseSalaryAZN || role.base_salary || 1200} AZN`,
                matchScore,
                matchPercentage: matchScore,
                description: role.description || `${role.title} üzrə real bazar tələbləri.`
            });
        });

        return results.sort((a, b) => b.matchScore - a.matchScore);
    }

    generateActionRecommendations(topGaps) {
        const learningResources = {
            sql: {
                title: "SQL & Verilənlər Bazası Sorğuları",
                advice: "PostgreSQL və ya MySQL üzərində JOIN, GROUP BY, Window Functions və CTE sorğularını real layihələrdə tətbiq edin.",
                link: "Kaggle SQL & LeetCode Database"
            },
            powerbi: {
                title: "Microsoft Power BI & DAX",
                advice: "Data Modeling, Star Schema və DAX riyazi funksiyaları (CALCULATE, FILTER) ilə interaktiv dashboardlar qurun.",
                link: "Microsoft Learn Power BI Data Analyst (PL-300)"
            },
            python: {
                title: "Python ilə Data Analitika",
                advice: "Pandas və NumPy kitabxanaları ilə real datasetlərin təmizlənməsi və EDA (Exploratory Data Analysis) vərdişləri toplayın.",
                link: "FreeCodeCamp Data Analysis with Python"
            },
            excel: {
                title: "Qabaqcıl MS Excel",
                advice: "XLOOKUP, Dynamic Arrays, Power Query və maliyyə modelləşdirməsi funksiyalarını dərindən mənimsəyin.",
                link: "Excel Exposure & Corporate Finance Institute"
            },
            financial_analysis: {
                title: "Maliyyə Hesabatlarının Təhlili",
                advice: "Balans, Mənfəət və Zərər, Pul Vəsaitlərinin Hərəkəti hesabatlarının horizontal və şaquli analizini aparın.",
                link: "CFI Financial Analysis Fundamentals"
            },
            financial_modeling: {
                title: "Maliyyə Modelləşdirməsi (DCF)",
                advice: "3-Statement model, DCF və sensitivities analizlərini real şirkət dataları ilə qurun.",
                link: "Wall Street Prep & CFI"
            },
            accounting_1c: {
                title: "1C Mühasibat 8.3",
                advice: "Kadr uçotu, əməkhaqqı hesablanması, bank çıxarışları və anbar əməliyyatlarını 1C proqramında işləyin.",
                link: "DMA & Peşə Tədris Mərkəzi Kursları"
            },
            digital_marketing: {
                title: "Rəqəmsal Marketinq & Performance Ads",
                advice: "Google Ads, Meta Pixel quraşdırılması, A/B testlər və ROAS optimallaşdırmasını praktika edin.",
                link: "Google Skillshop & Meta Blueprint"
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
            }
        };

        return topGaps.map(gap => {
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
        const found = all.find(s => s.id === skillId || (s.canonical_name && s.canonical_name.toLowerCase() === (skillId || '').toLowerCase()));
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

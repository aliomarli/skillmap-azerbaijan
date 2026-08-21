/**
 * SkillMap Azerbaijan - Skill Gap, Karyera və Çoxkomponentli Match Mühərriki (skillGapEngine.js)
 * 1-5 Şkalası: Beginner (1), Basic (2), Intermediate (3), Advanced (4), Expert (5)
 * Çoxkomponentli Match Score: Skills (70%) + Experience (15%) + Education (10%) + Language (5%)
 */

class SkillGapEngine {
    constructor(data, configWeights = null) {
        this.data = data || window.SkillMapData;
        this.weights = configWeights || {
            skills: 0.70,
            experience: 0.15,
            education: 0.10,
            language: 0.05
        };
    }

    /**
     * Səviyyəni standart 1-5 şkalasına çevirir
     */
    normalizeLevel(val) {
        if (typeof val === "string") {
            const v = val.toLowerCase().trim();
            const map = { "beginner": 1, "basic": 2, "intermediate": 3, "advanced": 4, "expert": 5 };
            if (map[v]) return map[v];
            const num = parseFloat(val);
            if (!isNaN(num)) val = num;
            else return 2;
        }
        if (typeof val === "number") {
            if (val <= 5) return Math.max(1, Math.min(5, Math.round(val)));
            if (val >= 85) return 5;
            if (val >= 65) return 4;
            if (val >= 45) return 3;
            if (val >= 20) return 2;
            return 1;
        }
        return 1;
    }

    /**
     * Tələbənin seçilmiş vəzifə üzrə uyğunluq faizini, skill gap-lərini və inkişaf prioritetlərini hesablayır
     */
    calculateGap(roleId, userSkills, userProfile = {}) {
        let role = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === roleId) : null;
        
        if (!role) {
            return {
                roleId,
                roleTitle: roleId.replace("_", " ").toUpperCase(),
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
        const field = userProfile.field || "";
        const englishLevel = (userProfile.english_level || userProfile.englishLevel || "B1").toLowerCase();

        // 1. SKILLS SCORE & GAP BREAKDOWN
        const breakdown = [];
        const gapsForPriority = [];
        let totalWeightedAchieved = 0.0;
        let totalWeightedRequired = 0.0;

        const benchmarkSkills = role.skills_benchmark || Object.entries(role.requiredSkills || {}).map(([sId, reqVal]) => ({
            skill_id: sId,
            canonical_name: this.findSkillInfo(sId)?.name || sId,
            market_level: this.normalizeLevel(reqVal),
            importance: reqVal >= 75 ? "required" : "preferred",
            demand_percentage: reqVal >= 75 ? 80.0 : 50.0,
            weight: 1.3
        }));

        benchmarkSkills.forEach(item => {
            const skId = item.skill_id || item.id;
            const skName = item.canonical_name || item.name || skId;
            const marketLvl = this.normalizeLevel(item.market_level || item.required_level || 3);
            const importance = item.importance || "required";
            const demandPct = item.demand_percentage || 70.0;
            const weight = item.weight || (this.findSkillInfo(skId)?.weightFactor || 1.2);
            const impFactor = (importance === "required") ? 1.0 : 0.6;

            const rawUserVal = studentSkills[skId] !== undefined ? studentSkills[skId] : (studentSkills[skName] !== undefined ? studentSkills[skName] : 0);
            const userLvl = (rawUserVal > 0) ? this.normalizeLevel(rawUserVal) : 0;

            const gap = Math.max(0, marketLvl - userLvl);
            const achieved = Math.min(userLvl, marketLvl);

            totalWeightedAchieved += achieved * weight * impFactor;
            totalWeightedRequired += marketLvl * weight * impFactor;

            // Priority Score
            const priorityScore = parseFloat((gap * (demandPct / 100.0) * (importance === "required" ? 1.5 : 1.0)).toFixed(2));
            let priorityLabel = "None";
            let priorityAz = "Boşluq yoxdur";

            if (priorityScore >= 1.5) {
                priorityLabel = "Very High";
                priorityAz = "Çox Yüksək (Təcili)";
            } else if (priorityScore >= 0.8) {
                priorityLabel = "High";
                priorityAz = "Yüksək";
            } else if (priorityScore >= 0.3) {
                priorityLabel = "Medium";
                priorityAz = "Orta";
            } else if (gap > 0) {
                priorityLabel = "Low";
                priorityAz = "Aşağı";
            }

            let statusText = "Strong (Tam uyğundur)";
            let status = "good";
            let statusColor = "emerald";

            if (gap >= 3) {
                status = "critical";
                statusText = `High Gap (${gap} səviyyə)`;
                statusColor = "rose";
            } else if (gap === 2) {
                status = "moderate";
                statusText = `Medium Gap (${gap} səviyyə)`;
                statusColor = "amber";
            } else if (gap === 1) {
                status = "moderate";
                statusText = "Low Gap (1 səviyyə)";
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
        let languageScore = (stdEng >= reqEng) ? 100.0 : (stdEng === reqEng - 1 ? 70.0 : 40.0);

        // 5. TOTAL MATCH SCORE
        const matchPercentage = Math.round(
            (this.weights.skills * skillsScore) +
            (this.weights.experience * experienceScore) +
            (this.weights.education * educationScore) +
            (this.weights.language * languageScore)
        );

        // 6. TOP DEVELOPMENT PRIORITIES
        const topPriorities = gapsForPriority.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
        const topGaps = breakdown.filter(i => i.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);

        // 7. ALTERNATIVE CAREERS
        const alternativeCareers = this.getRankedCareerRecommendations(studentSkills, roleId);

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
     * Fərdi vakansiyanın istifadəçi bacarıqları ilə uyğunluq faizini hesablayır
     */
    calculateVacancyMatch(vacancy, userSkills) {
        if (!vacancy || !vacancy.skills || vacancy.skills.length === 0) {
            return { matchScore: 50, matchingSkills: [], missingSkills: [] };
        }

        let totalPoints = 0;
        const matchingSkills = [];
        const missingSkills = [];

        vacancy.skills.forEach(skillName => {
            const skillObj = this.findSkillInfo(skillName);
            const skId = skillObj ? skillObj.id : skillName.toLowerCase();
            const userVal = (userSkills[skId] !== undefined) ? this.normalizeLevel(userSkills[skId]) : (userSkills[skillName] !== undefined ? this.normalizeLevel(userSkills[skillName]) : 0);

            if (userVal >= 2) {
                totalPoints += (userVal / 4.0);
                matchingSkills.push({ id: skId, name: skillName, level: userVal });
            } else {
                missingSkills.push({ id: skId, name: skillName, level: userVal });
            }
        });

        const rawMatch = Math.round((totalPoints / vacancy.skills.length) * 100);
        const matchScore = Math.min(100, Math.max(15, rawMatch));

        return {
            matchScore,
            matchingSkills,
            missingSkills
        };
    }

    /**
     * Bütün digər vəzifələr üzrə alternativ uyğunluq faizlərini hesablayır
     */
    getRankedCareerRecommendations(userSkills, excludeRoleId = "") {
        const roles = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark : [];
        const results = [];

        roles.forEach(role => {
            if (role.id === excludeRoleId) return;

            let totalAchieved = 0;
            let totalRequired = 0;
            const bSkills = role.skills_benchmark || Object.entries(role.requiredSkills || {}).map(([s, l]) => ({ skill_id: s, market_level: this.normalizeLevel(l) }));

            bSkills.forEach(item => {
                const sId = item.skill_id || item.id;
                const reqL = this.normalizeLevel(item.market_level || 3);
                const uL = (userSkills[sId] !== undefined) ? this.normalizeLevel(userSkills[sId]) : (userSkills[item.canonical_name] !== undefined ? this.normalizeLevel(userSkills[item.canonical_name]) : 0);
                totalAchieved += Math.min(uL, reqL);
                totalRequired += reqL;
            });

            const skScore = totalRequired > 0 ? (totalAchieved / totalRequired) * 100 : 0;
            const matchScore = Math.round(0.70 * skScore + 0.15 * 60 + 0.10 * 80 + 0.05 * 80);

            results.push({
                id: role.id,
                title: role.title,
                sector: role.sector,
                avgSalary: role.avgSalary || `${role.base_salary || 1200} AZN`,
                matchScore,
                description: role.description || `${role.title} üzrə real bazar tələbləri.`
            });
        });

        return results.sort((a, b) => b.matchScore - a.matchScore);
    }

    generateActionRecommendations(topGaps) {
        const learningResources = {
            sql: {
                title: "SQL & Verilənlər Bazası",
                advice: "PostgreSQL üzərində JOIN, GROUP BY, Window Functions və CTE sorğularını real praktiki layihələrdə tətbiq edin.",
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
            },
            digital_marketing: {
                title: "Rəqəmsal Marketinq & Performance Ads",
                advice: "Google Ads, Meta Pixel quraşdırılması, A/B testlər və ROAS optimallaşdırmasını praktika edin.",
                link: "Google Skillshop & Meta Blueprint"
            },
            hr_management: {
                title: "AR Əmək Qanunvericiliyi və Kadr Uçotu",
                advice: "Əmək Məcəlləsinin əsas maddələri, sənədləşmə və müasir ATS (Applicant Tracking System) alətlərini araşdırın.",
                link: "DMA Təlimləri və HR Assosiasiyası"
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
        const found = all.find(s => s.id === skillId || (s.canonical_name && s.canonical_name.toLowerCase() === skillId.toLowerCase()));
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

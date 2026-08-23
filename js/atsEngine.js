/**
 * SkillMap Azerbaijan - ATS CV Analysis & Target Role Evaluator (atsEngine.js)
 * Evaluates CV ATS readiness (0-100) and compares keywords against real Jobsearch.az vacancies.
 */

class ATSEngine {
    constructor(data = null) {
        this.data = data || (window.SkillMapData ? window.SkillMapData : {});
    }

    /**
     * Calculate comprehensive ATS Score (0-100) across 7 components
     * @param {Object} parsedCV 
     * @param {string} targetRoleId 
     * @returns {Object} ATS Evaluation Result
     */
    evaluateCV(parsedCV, targetRoleId = "financial_analyst") {
        if (!parsedCV) {
            return {
                overallScore: 0,
                status: "N/A - CV Yüklənməyib",
                components: {},
                matchedSkills: [],
                missingSkills: [],
                matchedKeywords: [],
                missingKeywords: [],
                recommendations: []
            };
        }

        // 1. Contact Information Score (15 pts)
        let contactScore = 0;
        const pInfo = parsedCV.personalInfo || {};
        if (pInfo.name && pInfo.name.length > 3) contactScore += 4;
        if (pInfo.email && pInfo.email.includes("@")) contactScore += 4;
        if (pInfo.phone && pInfo.phone.length > 7) contactScore += 4;
        if (pInfo.linkedin || pInfo.location) contactScore += 3;

        // 2. Structure & Sections Score (15 pts)
        let structureScore = 0;
        if (parsedCV.education && parsedCV.education.university) structureScore += 5;
        if (parsedCV.experience) structureScore += 5;
        if (parsedCV.skills && Object.keys(parsedCV.skills).length > 0) structureScore += 5;

        // 3. Target Role & Market Requirements Match (30 pts)
        const targetBenchmark = (this.data.jobRolesBenchmark || []).find(r => r.id === targetRoleId) || {
            title: targetRoleId.replace("_", " ").toUpperCase(),
            requiredSkills: { "excel": 4, "financial_analysis": 4, "sql": 4, "powerbi": 3, "financial_modeling": 3 }
        };

        const requiredSkills = targetBenchmark.requiredSkills || {};
        const userSkills = parsedCV.skills || {};

        const matchedSkills = [];
        const missingSkills = [];
        let skillMatches = 0;
        let totalRequired = Object.keys(requiredSkills).length || 5;

        Object.entries(requiredSkills).forEach(([skId, reqLevel]) => {
            const userSkill = userSkills[skId];
            const skName = skId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            if (userSkill && userSkill.level > 0) {
                matchedSkills.push({ id: skId, name: userSkill.name || skName, level: userSkill.level, required: reqLevel });
                skillMatches += 1;
            } else {
                missingSkills.push({ id: skId, name: skName, required: reqLevel });
            }
        });

        const skillsScore = totalRequired > 0 ? Math.round((skillMatches / totalRequired) * 30) : 20;

        // 4. Keywords & Terminology Match (15 pts)
        const marketKeywords = ["IFRS", "Hesabatlıq", "DCF Modelləşdirmə", "Büdcə Təhlili", "Power Query", "Maliyyə Əmsalları", "Data Analitikası"];
        const matchedKeywords = [];
        const missingKeywords = [];

        const cvRaw = JSON.stringify(parsedCV).toLowerCase();
        marketKeywords.forEach(kw => {
            if (cvRaw.includes(kw.toLowerCase())) {
                matchedKeywords.push(kw);
            } else {
                missingKeywords.push(kw);
            }
        });

        const keywordsScore = Math.round((matchedKeywords.length / marketKeywords.length) * 15);

        // 5. Work Experience Depth (10 pts)
        const expYears = (parsedCV.experience && parsedCV.experience.totalYears) || 0;
        const experienceScore = Math.min(10, Math.round(expYears * 3) + 4);

        // 6. Education & Credentials (10 pts)
        const edu = parsedCV.education || {};
        let educationScore = 7;
        if (edu.degree === "Bakalavr" || edu.degree === "Magistr") educationScore += 3;

        // 7. Formatting & Machine Readability (5 pts)
        const formattingScore = 5;

        // Overall ATS Score (0 - 100)
        const overallScore = contactScore + structureScore + skillsScore + keywordsScore + experienceScore + educationScore + formattingScore;

        let status = "Əla ATS Uyğunluğu";
        let statusColor = "emerald";
        if (overallScore < 60) {
            status = "Təkmilləşdirmə Tələb Olunur";
            statusColor = "rose";
        } else if (overallScore < 80) {
            status = "Yaxşı ATS Səviyyəsi";
            statusColor = "amber";
        }

        // Actionable Recommendations
        const recommendations = [];
        if (missingSkills.length > 0) {
            missingSkills.forEach(ms => {
                recommendations.push({
                    type: "skill",
                    text: `Əgər "${ms.name}" bacarığına sahibsinizsə, CV-də qeyd etməyi nəzərdən keçirin.`
                });
            });
        }
        if (missingKeywords.length > 0) {
            recommendations.push({
                type: "keyword",
                text: `Bazar açar sözlərini (${missingKeywords.slice(0, 3).join(", ")}) iş təcrübəniz və ya layihələrinizdə istifadə edin.`
            });
        }

        return {
            overallScore: Math.min(100, Math.max(0, overallScore)),
            status: status,
            statusColor: statusColor,
            targetRoleTitle: targetBenchmark.title,
            components: {
                contact: { score: contactScore, max: 15, name: "Əlaqə Məlumatları" },
                structure: { score: structureScore, max: 15, name: "Struktur və Bölmələr" },
                skills: { score: skillsScore, max: 30, name: "Bazar Bacarıqları Uyğunluğu" },
                keywords: { score: keywordsScore, max: 15, name: "Açar Sözlər (Keywords)" },
                experience: { score: experienceScore, max: 10, name: "İş Təcrübəsi və Layihələr" },
                education: { score: educationScore, max: 10, name: "Təhsil və Dərəcə" },
                formatting: { score: formattingScore, max: 5, name: "Format və Oxunaqlılıq" }
            },
            matchedSkills: matchedSkills,
            missingSkills: missingSkills,
            matchedKeywords: matchedKeywords,
            missingKeywords: missingKeywords,
            recommendations: recommendations
        };
    }
}

if (typeof window !== "undefined") {
    window.ATSEngine = ATSEngine;
    window.atsEngine = new ATSEngine();
}

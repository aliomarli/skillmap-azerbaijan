/**
 * SkillMap Azerbaijan - NLP & Bacarıq Çıxarışı Simulyatoru (nlpSimulator.js)
 * Vakansiya mətnlərindən avtomatik açar bacarıqların, dillərin və tələblərin çıxarılmasını nümayiş etdirir.
 */

class NLPSimulator {
    constructor(data) {
        this.data = data || window.SkillMapData;
    }

    /**
     * Mətni analiz edir və aşkar olunmuş bacarıqları taksonomiya ilə uyğunlaşdırır
     */
    extractSkillsFromText(text) {
        if (!text || text.trim() === "") {
            return {
                detectedTechnical: [],
                detectedSoft: [],
                detectedLanguages: [],
                extractedExperience: null,
                normalizedSkillsJson: []
            };
        }

        const lowerText = text.toLowerCase();

        // 1. Texniki və Biznes Bacarıqlarının Axtarışı
        const detectedTechnical = [];
        const techAndBiz = [
            ...(this.data.skillsTaxonomy.technical || []),
            ...(this.data.skillsTaxonomy.business || [])
        ];
        techAndBiz.forEach(skill => {
            const aliases = skill.aliases || [];
            const matched = aliases.some(alias => {
                const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                return regex.test(lowerText);
            });
            if (matched) {
                detectedTechnical.push({
                    id: skill.id,
                    standardName: skill.canonical_name || skill.name,
                    category: skill.category
                });
            }
        });

        // 2. Soft Skills Axtarışı
        const detectedSoft = [];
        (this.data.skillsTaxonomy.soft || []).forEach(skill => {
            const aliases = skill.aliases || [];
            const matched = aliases.some(alias => lowerText.includes(alias.toLowerCase()));
            if (matched) {
                detectedSoft.push({
                    id: skill.id,
                    standardName: skill.canonical_name || skill.name
                });
            }
        });

        // 3. Dil Tələbləri Axtarışı
        const detectedLanguages = [];
        (this.data.skillsTaxonomy.languages || []).forEach(lang => {
            const aliases = lang.aliases || [];
            const matched = aliases.some(alias => lowerText.includes(alias.toLowerCase()));
            if (matched) {
                detectedLanguages.push({
                    id: lang.id,
                    standardName: lang.canonical_name || lang.name
                });
            }
        });

        // 4. Təcrübə tələbinin Regex ilə təyini (məs. "2 il iş təcrübəsi", "1-3 il təcrübə")
        let extractedExperience = "Qeyd edilməyib";
        const expRegex = /(\d+(?:\s*-\s*\d+)?)\s*(?:il|ilə qədər|ildən artıq)?\s*(?:iş\s*)?təcrübə/i;
        const expMatch = text.match(expRegex);
        if (expMatch) {
            extractedExperience = expMatch[0];
        }

        // 5. Standartlaşdırılmış JSON çıxışı (API & Data Storage üçün)
        const normalizedSkillsJson = [
            ...detectedTechnical.map(s => ({ type: "technical", id: s.id, name: s.standardName, category: s.category })),
            ...detectedSoft.map(s => ({ type: "soft", id: s.id, name: s.standardName })),
            ...detectedLanguages.map(s => ({ type: "language", id: s.id, name: s.standardName }))
        ];

        return {
            detectedTechnical,
            detectedSoft,
            detectedLanguages,
            extractedExperience,
            normalizedSkillsJson
        };
    }

    /**
     * Nümunə vakansiya mətnləri
     */
    getSampleVacancies() {
        return [
            {
                title: "Data Analyst – Bank Respublika (Nümunə Vakansiya)",
                text: `Tələblər:
- Ali təhsil (İqtisadiyyat, Riyaziyyat və ya Kompüter Elmləri sahəsində);
- Müvafiq sahədə minimum 2 il iş təcrübəsi;
- Mükəmməl SQL (PostgreSQL və ya T-SQL) və mürəkkəb sorğuların yazılması bacarığı;
- Microsoft Excel (Pivot tables, XLOOKUP, Nested IF) üzrə qabaqcıl biliklər;
- Power BI və ya Tableau vasitəsilə interaktiv hesabatların (dashboard) qurulması;
- Python (Pandas, NumPy) bilikləri arzuolunandır;
- Yüksək analitik düşüncə, problem həlli və komandada işləmək qabiliyyəti;
- İngilis dili (minimum B2 səviyyəsində texniki sənədləri oxumaq üçün).`
            },
            {
                title: "Maliyyə Təhlilçisi – Paşa Holdinq (Nümunə Vakansiya)",
                text: `Namizədə tələblər:
- Maliyyə, İqtisadiyyat və ya Mühasibat sahəsində ali təhsil;
- 1-3 il maliyyə modelləşdirilməsi və büdcələmə təcrübəsi;
- MS Excel qabaqcıl səviyyədə, 1C və ERP sistemləri ilə işləmək bacarığı;
- Tənqidi düşüncə, analitik qabiliyyət və vaxtın idarə edilməsi;
- Rus və İngilis dilləri arzuolunandır.`
            },
            {
                title: "Frontend Developer – Rəqəmsal İnnovasiyalar Mərkəzi",
                text: `Tələblər:
- JavaScript (ES6+), TypeScript və React.js üzrə ən azı 1 il praktiki təcrübə;
- Next.js, Redux Toolkit və REST API inteqrasiyaları;
- Git, Jira və Agile/Scrum komandasında iş vərdişləri;
- İngilis dili (B1/B2 səviyyəsi) və güclü komanda ünsiyyəti.`
            }
        ];
    }
}

if (typeof window !== "undefined") {
    window.NLPSimulator = NLPSimulator;
}

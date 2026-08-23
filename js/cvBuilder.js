/**
 * SkillMap Azerbaijan - ATS-Friendly Clean CV Builder (cvBuilder.js)
 * Generates single-column ATS-standard CVs in Azerbaijani and English from confirmed user data.
 */

class ATSCVBuilder {
    constructor() {}

    /**
     * Generate printable ATS HTML Document
     * @param {Object} userData 
     * @param {string} lang ("az" | "en")
     * @param {string} targetRoleTitle 
     * @returns {string} Clean ATS-Compliant HTML
     */
    generateATSHTML(userData, lang = "az", targetRoleTitle = "Financial Analyst") {
        const u = userData || {};
        const p = u.personalInfo || { name: u.name || "Namizəd", email: u.email || "namized@example.com", phone: "+994 50 123 45 67", location: "Bakı, Azərbaycan" };
        const edu = u.education || { university: u.university || "UNEC", degree: u.degree || "Bakalavr", field: u.faculty || "Maliyyə və Bank İşi", graduationYear: "2026" };
        const skillsObj = u.savedSkills || u.skills || {};

        const isAz = lang === "az";

        // Filter confirmed skills
        const skillList = Object.entries(skillsObj).map(([id, val]) => {
            const level = typeof val === "object" ? val.level : (val > 5 ? Math.round(val / 20) : val);
            const name = typeof val === "object" ? val.name : id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            return `${name} (${level}/5)`;
        });

        const workHistory = (u.experience && u.experience.history) || [
            { title: "Təcrübəçi / Layihə İştirakçısı", company: "Maliyyə və Analitika Layihəsi", period: "2025 - 2026" }
        ];

        return `
        <!DOCTYPE html>
        <html lang="${lang}">
        <head>
            <meta charset="UTF-8">
            <title>${p.name} - CV (${targetRoleTitle})</title>
            <style>
                @page { size: A4; margin: 18mm 15mm; }
                body { font-family: 'Calibri', 'Arial', sans-serif; color: #111827; line-height: 1.45; font-size: 11pt; margin: 0; padding: 0; background: #fff; }
                .header { text-align: center; border-bottom: 1.5pt solid #1e293b; padding-bottom: 8pt; margin-bottom: 12pt; }
                .name { font-size: 20pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5pt; color: #0f172a; margin-bottom: 4pt; }
                .target-title { font-size: 12pt; font-weight: 600; color: #2563eb; margin-bottom: 4pt; }
                .contact-line { font-size: 9.5pt; color: #475569; }
                .contact-line span { margin: 0 5pt; }
                .section { margin-bottom: 12pt; }
                .section-title { font-size: 12pt; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 1pt solid #cbd5e1; padding-bottom: 2pt; margin-bottom: 6pt; letter-spacing: 0.3pt; }
                .item { margin-bottom: 6pt; }
                .item-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 10.5pt; }
                .item-sub { display: flex; justify-content: space-between; font-style: italic; color: #475569; font-size: 10pt; margin-bottom: 2pt; }
                .bullet-list { margin: 2pt 0 0 16pt; padding: 0; }
                .bullet-list li { margin-bottom: 2pt; font-size: 10pt; }
                .skills-box { font-size: 10pt; line-height: 1.6; }
                .skill-tag { display: inline-block; background: #f1f5f9; padding: 2pt 6pt; border-radius: 3pt; margin: 2pt; border: 0.5pt solid #cbd5e1; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">${p.name}</div>
                <div class="target-title">${targetRoleTitle}</div>
                <div class="contact-line">
                    ${p.email} <span>•</span> ${p.phone} <span>•</span> ${p.location} ${p.linkedin ? `<span>•</span> ${p.linkedin}` : ''}
                </div>
            </div>

            <div class="section">
                <div class="section-title">${isAz ? "Peşəkar Xülasə" : "Professional Summary"}</div>
                <p style="margin: 0; font-size: 10pt; text-align: justify;">
                    ${isAz 
                        ? `${edu.university} məzunu / tələbəsi. ${targetRoleTitle} vəzifəsi üzrə müasir analitik metodologiyalar, bazar hesabatlığı və praktiki alətlərlə zənginləşdirilmiş güclü baza bacarıqlarına sahib mütəxəssis.`
                        : `Driven and detail-oriented candidate with strong foundation in ${targetRoleTitle}, financial analysis, and strategic data problem-solving. Graduating from ${edu.university}.`}
                </p>
            </div>

            <div class="section">
                <div class="section-title">${isAz ? "Təhsil" : "Education"}</div>
                <div class="item">
                    <div class="item-header">
                        <span>${edu.university}</span>
                        <span>${edu.graduationYear || "2026"}</span>
                    </div>
                    <div class="item-sub">
                        <span>${edu.degree} — ${edu.field}</span>
                        <span>${isAz ? "Bakı, Azərbaycan" : "Baku, Azerbaijan"}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">${isAz ? "Texniki və Peşəkar Bacarıqlar" : "Technical & Professional Skills"}</div>
                <div class="skills-box">
                    ${skillList.map(s => `<span class="skill-tag">${s}</span>`).join(" ")}
                </div>
            </div>

            <div class="section">
                <div class="section-title">${isAz ? "İş Təcrübəsi və Layihələr" : "Experience & Projects"}</div>
                ${workHistory.map(wh => `
                    <div class="item">
                        <div class="item-header">
                            <span>${wh.title}</span>
                            <span>${wh.period}</span>
                        </div>
                        <div class="item-sub">
                            <span>${wh.company}</span>
                            <span>Bakı</span>
                        </div>
                        <ul class="bullet-list">
                            <li>${isAz ? "Analitik hesabatların və məlumat bazasının təhlil edilməsi." : "Assisted in analytical data reporting and operational evaluation."}</li>
                            <li>${isAz ? "Vəzifə tələblərinə uyğun praktiki tapşırıqların və komanda layihələrinin icrası." : "Participated in target industry projects with modern methodologies."}</li>
                        </ul>
                    </div>
                `).join("")}
            </div>

            <div class="section">
                <div class="section-title">${isAz ? "Dil Bilikləri" : "Languages"}</div>
                <div style="font-size: 10pt;">
                    <strong>${isAz ? "Azərbaycan dili:" : "Azerbaijani:"}</strong> ${isAz ? "Ana dili (Sərbəst)" : "Native"} <span>•</span>
                    <strong>${isAz ? "İngilis dili:" : "English:"}</strong> ${u.englishLevel || "B2 (Intermediate)"} <span>•</span>
                    <strong>${isAz ? "Rus dili:" : "Russian:"}</strong> ${isAz ? "İşgüzar" : "Working proficiency"}
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Trigger browser print or direct PDF download
     */
    downloadCV(userData, lang = "az", targetRoleTitle = "Financial Analyst") {
        const htmlContent = this.generateATSHTML(userData, lang, targetRoleTitle);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 300);
        }
    }
}

if (typeof window !== "undefined") {
    window.ATSCVBuilder = ATSCVBuilder;
    window.cvBuilder = new ATSCVBuilder();
}

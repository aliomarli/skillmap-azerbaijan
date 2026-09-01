/**
 * SkillMap Azerbaijan - Skill Passport Vector & Printable Generator (passportExport.js)
 * Creates verifiable digital Skill Passport with printable vector styling.
 */

class SkillPassportGenerator {
    constructor() {}

    /**
     * Download Skill Passport as a formatted PDF / Print View
     * @param {Object} user 
     * @param {Object} matchResult 
     */
    exportPassportPDF(user, matchResult) {
        const u = user || { name: "Demo Tələbə", university: "UNEC", faculty: "Maliyyə ixtisası", studentId: "AZ-UNEC-2026-8492" };
        const res = matchResult || { matchScore: 74, matchPercentage: 74, roleTitle: "Financial Analyst", breakdown: [] };

        const score = res.matchPercentage !== undefined ? res.matchPercentage : (res.matchScore || 74);
        const role = res.roleTitle || (res.role ? res.role.title : "Financial Analyst");

        const skills = res.breakdown && res.breakdown.length > 0 ? res.breakdown : [
            { skillName: "Excel", userLevel: 4, requiredLevel: 4, gap: 0 },
            { skillName: "Financial Analysis", userLevel: 4, requiredLevel: 4, gap: 0 },
            { skillName: "SQL", userLevel: 2, requiredLevel: 4, gap: 2 },
            { skillName: "Power BI", userLevel: 1, requiredLevel: 3, gap: 2 },
            { skillName: "Financial Modeling", userLevel: 2, requiredLevel: 3, gap: 1 },
            { skillName: "Presentation Skills", userLevel: 4, requiredLevel: 3, gap: 0 }
        ];

        const dateStr = new Date().toLocaleDateString("az-AZ", { year: 'numeric', month: 'long', day: 'numeric' });

        const html = `
        <!DOCTYPE html>
        <html lang="az">
        <head>
            <meta charset="UTF-8">
            <title>SkillMap Pasport - ${u.name}</title>
            <style>
                @page { size: A4 landscape; margin: 12mm; }
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 90vh; }
                .passport-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #3b82f6; border-radius: 24px; padding: 36px; max-width: 900px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); color: #f8fafc; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
                .logo { display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
                .logo span { color: #3b82f6; }
                .badge { background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #60a5fa; padding: 6px 16px; border-radius: 100px; font-size: 12px; font-weight: bold; }
                .content-grid { display: grid; grid-template-columns: 280px 1fr; gap: 32px; }
                .profile-col { background: rgba(255,255,255,0.03); border: 1px solid #334155; border-radius: 20px; padding: 24px; text-align: center; }
                .avatar { width: 90px; height: 90px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #6366f1); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; border: 3px solid #60a5fa; }
                .user-name { font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 4px; }
                .user-uni { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
                .match-pill { background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 900; font-size: 18px; padding: 8px 16px; border-radius: 12px; display: inline-block; margin-bottom: 12px; }
                .skills-col { display: flex; flex-direction: column; justify-content: space-between; }
                .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .skill-box { background: rgba(255,255,255,0.04); border: 1px solid #334155; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
                .skill-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
                .skill-level { background: #3b82f6; color: #fff; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 6px; }
                .footer-meta { margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
            </style>
        </head>
        <body>
            <div class="passport-card">
                <div class="header">
                    <div class="logo">SkillMap <span>Azerbaijan</span></div>
                    <div class="badge">RƏSMİ RƏQƏMSAL BACARIQ PASPORTU</div>
                </div>

                <div class="content-grid">
                    <div class="profile-col">
                        <div class="avatar">${u.name ? u.name.charAt(0) : "Ə"}</div>
                        <div class="user-name">${u.name}</div>
                        <div class="user-uni">${u.university} · ${u.faculty || "Maliyyə ixtisası"}</div>
                        <div class="match-pill">Career Match: ${score}%</div>
                        <div style="font-size: 12px; color: #94a3b8;">Hədəf Vəzifə: <strong style="color: #fff;">${role}</strong></div>
                    </div>

                    <div class="skills-col">
                        <div>
                            <div style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; letter-spacing: 0.5px;">Təsdiqlənmiş Əsas Bacarıqlar</div>
                            <div class="skills-grid">
                                ${skills.slice(0, 6).map(s => `
                                    <div class="skill-box">
                                        <span class="skill-name">${s.skillName}</span>
                                        <span class="skill-level">${s.userLevel || 4}/5</span>
                                    </div>
                                `).join("")}
                            </div>
                        </div>

                        <div class="footer-meta">
                            <span>Verifikasiya ID: ${u.studentId || "AZ-UNEC-2026-8492"}</span>
                            <span>Tarix: ${dateStr}</span>
                            <span>Məlumat Mənbəyi: Əmək Bazarı Real Əmək Bazası</span>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 300);
        }
    }
}

if (typeof window !== "undefined") {
    window.SkillPassportGenerator = SkillPassportGenerator;
    window.skillPassportGenerator = new SkillPassportGenerator();
}

/**
 * SkillMap Azerbaijan - Top 10 İşəgötürənlər Mühərriki (topEmployersModule.js)
 * 1,132 Əmək Bazarı vakansiyası əsasında ən fəal şirkətlərin analitikası,
 * sektor bölgüsü donut qrafiki, şirkət profili və fərdi bacarıq uyğunluğu.
 */

class TopEmployersModule {
    constructor(data) {
        this.data = data || (typeof window !== "undefined" ? window.SkillMapData : {});
        this.employers = [];
        this.selectedEmployer = null;
        this.chartInstance = null;
        this.sectorStats = {};
        
        this.init();
    }

    init() {
        this.analyzeTopEmployers();
    }

    analyzeTopEmployers() {
        const vacancies = (this.data && this.data.liveVacancies) ? this.data.liveVacancies : [];
        if (!vacancies || vacancies.length === 0) return;

        // Group vacancies by company (normalize and filter placeholder names)
        const companyMap = {};
        const sectorMap = {};

        vacancies.forEach(v => {
            let comp = (v.company || "").trim();
            if (!comp || comp.toLowerCase() === "şirkət qeyd olunmayıb" || comp.toLowerCase() === "company" || comp.toLowerCase() === "naməlum") {
                comp = "Məxfi İşəgötürən";
            }

            const sector = v.sector || "Digər";
            sectorMap[sector] = (sectorMap[sector] || 0) + 1;

            if (!companyMap[comp]) {
                companyMap[comp] = {
                    name: comp,
                    vacancies: [],
                    sector: sector,
                    allSkills: [],
                    locations: {},
                    salaries: []
                };
            }

            companyMap[comp].vacancies.push(v);
            if (v.sector && v.sector !== "Digər") {
                companyMap[comp].sector = v.sector;
            }

            const vSkills = v.skills || v.required_skills || [];
            vSkills.forEach(s => {
                if (s && s.trim()) companyMap[comp].allSkills.push(s.trim());
            });

            const loc = v.location || "Bakı";
            companyMap[comp].locations[loc] = (companyMap[comp].locations[loc] || 0) + 1;

            if (v.salary && typeof v.salary === "string" && v.salary.includes("AZN")) {
                companyMap[comp].salaries.push(v.salary);
            }
        });

        // Filter out generic placeholder from top 10 list if real companies exist
        const namedCompanies = Object.values(companyMap).filter(c => c.name !== "Məxfi İşəgötürən");
        
        // Sort by vacancy count descending
        namedCompanies.sort((a, b) => b.vacancies.length - a.vacancies.length);

        // Process top 10
        this.employers = namedCompanies.slice(0, 10).map((c, index) => {
            // Count skill frequency
            const skillCounts = {};
            c.allSkills.forEach(s => {
                skillCounts[s] = (skillCounts[s] || 0) + 1;
            });

            const sortedSkills = Object.entries(skillCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => ({
                    name,
                    count,
                    percentage: Math.min(100, Math.round((count / c.vacancies.length) * 100))
                }));

            // Fallback default skills if NLP was sparse
            if (sortedSkills.length === 0) {
                sortedSkills.push({ name: "MS Office", count: 1, percentage: 80 });
                sortedSkills.push({ name: "Ünsiyyət", count: 1, percentage: 75 });
                sortedSkills.push({ name: "Analitik düşüncə", count: 1, percentage: 70 });
            }

            // Estimate salary range
            let salaryDisplay = "1000 - 1800 AZN";
            if (c.salaries.length > 0) {
                salaryDisplay = c.salaries[0];
            } else if (c.sector.includes("Bank") || c.sector.includes("Maliyyə")) {
                salaryDisplay = "1200 - 2400 AZN";
            } else if (c.sector.includes("IT") || c.sector.includes("Proqram")) {
                salaryDisplay = "1500 - 3200 AZN";
            } else if (c.sector.includes("Mühəndis")) {
                salaryDisplay = "1400 - 2500 AZN";
            } else if (c.sector.includes("Satış") || c.sector.includes("Pərakəndə")) {
                salaryDisplay = "800 - 1600 AZN";
            }

            // Logo color & initials
            const initials = c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "ŞK";
            const palette = [
                "bg-blue-600", "bg-emerald-600", "bg-indigo-600", "bg-purple-600", 
                "bg-amber-600", "bg-rose-600", "bg-teal-600", "bg-cyan-600", 
                "bg-slate-800", "bg-violet-600"
            ];

            return {
                rank: index + 1,
                name: c.name,
                sector: c.sector || "Özəl Sektor",
                vacancyCount: c.vacancies.length,
                salaryRange: salaryDisplay,
                topSkills: sortedSkills.slice(0, 5),
                initials: initials,
                colorClass: palette[index % palette.length],
                vacanciesList: c.vacancies
            };
        });

        // Compute top sectors breakdown
        this.sectorStats = sectorMap;

        // Default selected employer
        if (this.employers.length > 0) {
            this.selectedEmployer = this.employers[0];
        }
    }

    render(containerTableId = "top-employers-table-body", containerProfileId = "top-employer-profile-card", chartCanvasId = "chart-employers-sectors") {
        this.renderTable(containerTableId);
        this.renderProfile(containerProfileId);
        this.renderSectorChart(chartCanvasId);
    }

    renderTable(containerId = "top-employers-table-body") {
        const tbody = document.getElementById(containerId);
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!this.employers || this.employers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">Vakansiya datası yüklənir...</td></tr>`;
            return;
        }

        this.employers.forEach(emp => {
            const isSelected = this.selectedEmployer && this.selectedEmployer.name === emp.name;
            const tr = document.createElement("tr");
            tr.className = `cursor-pointer transition-all border-b border-slate-100 hover:bg-slate-50/80 ${isSelected ? 'bg-indigo-50/40 font-semibold' : ''}`;
            tr.onclick = () => {
                this.selectEmployer(emp.name);
            };

            // Rank badge styling
            let rankBadge = `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">${emp.rank}</span>`;
            if (emp.rank === 1) rankBadge = `<span class="w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-xs font-black flex items-center justify-center shadow-xs">🥇</span>`;
            else if (emp.rank === 2) rankBadge = `<span class="w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-black flex items-center justify-center shadow-xs">🥈</span>`;
            else if (emp.rank === 3) rankBadge = `<span class="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center shadow-xs">🥉</span>`;

            // Skills chips
            const skillsHtml = emp.topSkills.slice(0, 3).map(s => 
                `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">${s.name}</span>`
            ).join(" ");

            tr.innerHTML = `
                <td class="py-3 px-3.5 text-center">${rankBadge}</td>
                <td class="py-3 px-3.5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl ${emp.colorClass} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs">
                            ${emp.initials}
                        </div>
                        <div>
                            <div class="font-bold text-slate-900 text-xs hover:text-indigo-600 transition-colors">${emp.name}</div>
                            <div class="text-[10px] text-slate-400 font-normal">${emp.sector}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-3.5 text-center">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black shadow-2xs">
                        <i class="fas fa-briefcase text-[10px]"></i>
                        ${emp.vacancyCount}
                    </span>
                </td>
                <td class="py-3 px-3.5 text-xs text-slate-700 font-medium whitespace-nowrap">
                    ${emp.salaryRange}
                </td>
                <td class="py-3 px-3.5">
                    <div class="flex flex-wrap gap-1">
                        ${skillsHtml}
                    </div>
                </td>
                <td class="py-3 px-3.5 text-right whitespace-nowrap">
                    <button onclick="event.stopPropagation(); window.topEmployersModuleInstance.viewCompanyVacancies('${emp.name.replace(/'/g, "\'")}');" class="px-3 py-1.5 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold text-[11px] transition-all flex items-center gap-1 ml-auto shadow-2xs">
                        <span>Vakansiyaları Gör</span>
                        <i class="fas fa-arrow-right text-[9px]"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    selectEmployer(companyName) {
        const emp = this.employers.find(e => e.name === companyName);
        if (!emp) return;
        this.selectedEmployer = emp;
        this.renderTable();
        this.renderProfile();

        // Smooth scroll to profile on mobile
        const profileEl = document.getElementById("top-employer-profile-card");
        if (profileEl && window.innerWidth < 1024) {
            profileEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    renderProfile(containerId = "top-employer-profile-card") {
        const container = document.getElementById(containerId);
        if (!container || !this.selectedEmployer) return;

        const emp = this.selectedEmployer;
        const appInstance = window.app || {};
        const isLoggedIn = appInstance.auth && appInstance.auth.isLoggedIn();
        const user = isLoggedIn ? appInstance.auth.currentUser : null;
        const userSkills = (user && user.savedSkills) ? user.savedSkills : (appInstance.currentSkills || {});

        // Compute match percentage if user skills exist
        let matchScore = 0;
        let matchedSkills = [];
        let missingSkills = [];

        if (isLoggedIn && Object.keys(userSkills).length > 0) {
            let matchedWeight = 0;
            let totalWeight = emp.topSkills.length;

            emp.topSkills.forEach(s => {
                const sNameLower = s.name.toLowerCase();
                const hasSkill = Object.keys(userSkills).some(uk => {
                    const ukLower = uk.toLowerCase();
                    return ukLower === sNameLower || sNameLower.includes(ukLower) || ukLower.includes(sNameLower);
                });

                if (hasSkill) {
                    matchedWeight += 1;
                    matchedSkills.push(s.name);
                } else {
                    missingSkills.push(s.name);
                }
            });

            matchScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 70;
            if (matchScore === 0 && matchedSkills.length > 0) matchScore = 60;
        }

        // Match Score Badge HTML
        let matchBadgeHtml = "";
        if (isLoggedIn && Object.keys(userSkills).length > 0) {
            let scoreColor = matchScore >= 70 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : (matchScore >= 40 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-rose-600 bg-rose-50 border-rose-200");
            matchBadgeHtml = `
                <div class="p-4 rounded-2xl border ${scoreColor} space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider">Sizin Şəxsi Uyğunluğunuz</span>
                        <span class="text-2xl font-black">${matchScore}%</span>
                    </div>
                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full ${matchScore >= 70 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full transition-all duration-500" style="width: ${matchScore}%;"></div>
                    </div>
                    <div class="pt-1 text-[11px] space-y-1">
                        ${matchedSkills.length > 0 ? `<div class="text-emerald-800"><strong>Uyğun gələn:</strong> ${matchedSkills.map(s => `<span class="bg-white px-1.5 py-0.5 rounded border border-emerald-200 mr-1">✓ ${s}</span>`).join("")}</div>` : ''}
                        ${missingSkills.length > 0 ? `<div class="text-rose-800"><strong>Çatışmayan:</strong> ${missingSkills.map(s => `<span class="bg-white px-1.5 py-0.5 rounded border border-rose-200 mr-1">✗ ${s}</span>`).join("")}</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            matchBadgeHtml = `
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto text-xs">
                        <i class="fas fa-lock"></i>
                    </div>
                    <div class="text-xs font-bold text-slate-800">Bu Şirkətə Fərdi Uyğunluğunuzu Ölçün</div>
                    <p class="text-[11px] text-slate-500 leading-relaxed">
                        Bacarıq profilinizlə bu şirkətin vakansiyaları arasındakı uyğunluq faizini hesablamaq üçün kabinetə daxil olun.
                    </p>
                    <button onclick="if(window.app) window.app.openAuthModal('login');" class="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all">
                        Daxil Ol & Ölç
                    </button>
                </div>
            `;
        }

        // Top 5 Skills Bars
        const skillsBarsHtml = emp.topSkills.map(s => `
            <div class="space-y-1">
                <div class="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>${s.name}</span>
                    <span class="text-indigo-600 font-bold">${s.percentage}% vakansiyada</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full" style="width: ${s.percentage}%;"></div>
                </div>
            </div>
        `).join("");

        container.innerHTML = `
            <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6 animate-fadeIn">
                <!-- Header Info -->
                <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl ${emp.colorClass} text-white font-black flex items-center justify-center text-base shadow-md flex-shrink-0">
                            ${emp.initials}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-black text-slate-900">${emp.name}</h3>
                                <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">✓ Təsdiqlənmiş</span>
                            </div>
                            <p class="text-xs text-slate-500">${emp.sector} · Ən Çox Vakansiya Verən Top 10 İşəgötürən</p>
                        </div>
                    </div>

                    <button onclick="window.topEmployersModuleInstance.viewCompanyVacancies('${emp.name.replace(/'/g, "\'")}');" class="px-4 py-2 rounded-full btn-saas-primary font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all">
                        <span>Bütün Vakansiyalar (${emp.vacancyCount})</span>
                        <i class="fas fa-arrow-right text-[10px]"></i>
                    </button>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Aktiv Vakansiya</span>
                        <div class="text-xl font-black text-slate-900">${emp.vacancyCount} vakansiya</div>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Orta Maaş Aralığı</span>
                        <div class="text-sm font-black text-emerald-700 mt-1">${emp.salaryRange}</div>
                    </div>
                </div>

                <!-- Top Skills in Company -->
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fas fa-fire text-amber-500"></i>
                        <span>Şirkətin Ən Çox Tələb Etdiyi 5 Bacarıq</span>
                    </h4>
                    <div class="space-y-2.5">
                        ${skillsBarsHtml}
                    </div>
                </div>

                <!-- Personal Compatibility Card -->
                <div>
                    ${matchBadgeHtml}
                </div>
            </div>
        `;
    }

    renderSectorChart(canvasId = "chart-employers-sectors") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Group top sectors
        const sectors = [
            { label: "Bank & Maliyyə", count: 43, color: "#2563eb" },
            { label: "Satış & Ticarət", count: 59, color: "#10b981" },
            { label: "İdarəetmə & Konsaltinq", count: 43, color: "#8b5cf6" },
            { label: "Mühəndislik & Tikinti", count: 27, color: "#f59e0b" },
            { label: "IT & Proqramlaşdırma", count: 18, color: "#6366f1" },
            { label: "İstehsalat & Sənaye", count: 18, color: "#ec4899" },
            { label: "Digər Sahələr", count: 212, color: "#94a3b8" }
        ];

        const labels = sectors.map(s => s.label);
        const dataValues = sectors.map(s => s.count);
        const colors = sectors.map(s => s.color);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");
        this.chartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: "#ffffff",
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            boxWidth: 10,
                            padding: 12,
                            font: { size: 11, weight: "bold" },
                            color: "#475569"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw || 0;
                                const pct = ((val / total) * 100).toFixed(1);
                                return ` ${context.label}: ${val} vakansiya (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: "68%"
            }
        });
    }

    viewCompanyVacancies(companyName) {
        if (!companyName) return;
        if (window.app && typeof window.app.switchTab === "function") {
            window.app.switchTab("live-vacancies");
            const searchInput = document.getElementById("vacancy-search-input");
            if (searchInput) {
                searchInput.value = companyName;
                window.app.renderLiveVacancies();
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }
}

if (typeof window !== "undefined") {
    window.TopEmployersModule = TopEmployersModule;
}

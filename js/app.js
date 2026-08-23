/**
 * SkillMap Azerbaijan - Əsas Tətbiq Mühərriki (app.js)
 * Enterprise Versiya: Radar Qrafiki, Maaş Proqnozlaşdırıcısı, Metodologiya və Mənbələr Modulu.
 */

class SkillMapApp {
    constructor() {
        this.data = (typeof window !== "undefined" && window.SkillMapData) 
            ? window.SkillMapData 
            : (typeof SkillMapData !== "undefined" ? SkillMapData : {});
        this.auth = new AuthManager();
        this.engine = new SkillGapEngine(this.data);
        this.mapModule = new MapModule(this.data);
        window.mapModuleInstance = this.mapModule;
        this.nlpSim = new NLPSimulator(this.data);

        this.currentLang = "az";
        this.currentSkills = {};
        this.charts = {};

        this.init();
    }

    init() {
        try { this.renderOverviewStats(); } catch (e) { console.error("Error in renderOverviewStats:", e); }
        try { this.populateRolesDropdown(); } catch (e) { console.error("Error in populateRolesDropdown:", e); }
        try { this.handleRoleChange(); } catch (e) { console.error("Error in handleRoleChange:", e); }
        try { this.updateAuthUI(); } catch (e) { console.error("Error in updateAuthUI:", e); }

        try {
            if (this.mapModule) {
                this.mapModule.renderMapGrid("map-regions-grid");
                this.mapModule.renderRegionDetails("map-region-detail-card", "nerimanov");
            }
        } catch (e) { console.error("Error in mapModule:", e); }

        try { this.renderVacancyAnalytics(); } catch (e) { console.error("Error in renderVacancyAnalytics:", e); }
        try { this.renderUniversityView(); } catch (e) { console.error("Error in renderUniversityView:", e); }
        try { this.renderLiveVacancies(); } catch (e) { console.error("Error in renderLiveVacancies:", e); }
        try { this.renderMethodologyView(); } catch (e) { console.error("Error in renderMethodologyView:", e); }

        try { this.loadSampleNLP(0); } catch (e) { console.error("Error in loadSampleNLP:", e); }
        try { this.runSkillGapCalculation(); } catch (e) { console.error("Error in runSkillGapCalculation:", e); }
        try { this.initRouter(); } catch (e) { console.error("Error in initRouter:", e); }
    }

    renderOverviewStats() {
        const stats = (this.data && this.data.macroMarketStats) ? this.data.macroMarketStats : {};
        const totalVacs = stats.totalAnalyzed || (this.data.liveVacancies ? this.data.liveVacancies.length : 420);

        // 1. Total Vacancies
        const totalElem = document.getElementById("stat-total-vacancies");
        if (totalElem) totalElem.textContent = `${totalVacs}`;
        const trustTotalElem = document.getElementById("trust-total-vacancies");
        if (trustTotalElem) trustTotalElem.textContent = `${totalVacs} Real Vakansiya (Jobsearch.az)`;

        // 2. Top Demanded Skill (Overall Top Skill)
        const topSkills = stats.topSkillsAnalytics || stats.topDemandedSkillsOverall || [];
        const topSkillNameElem = document.getElementById("stat-top-skill-name");
        const topSkillDescElem = document.getElementById("stat-top-skill-desc");
        if (topSkills.length > 0) {
            const firstSkill = topSkills[0];
            const sName = firstSkill.skill || firstSkill.name || "Communication";
            const sPct = firstSkill.demand_percentage !== undefined ? firstSkill.demand_percentage : (firstSkill.percentage || 19.3);
            const sCount = firstSkill.demand_count !== undefined ? firstSkill.demand_count : Math.round((sPct / 100) * totalVacs);
            
            if (topSkillNameElem) topSkillNameElem.textContent = sName;
            if (topSkillDescElem) topSkillDescElem.textContent = `${sCount} vakansiyada zəruri (${sPct}%)`;
        }

        // 3. Rising Skill (Real Xal from macroMarketStats.risingSkills2026[0])
        const risingList = stats.risingSkills2026 || [];
        const risingValElem = document.getElementById("stat-rising-skill-val");
        const risingNameElem = document.getElementById("stat-rising-skill-name");
        if (risingList.length > 0) {
            const firstRising = risingList[0];
            if (risingValElem) risingValElem.textContent = firstRising.growth || "+5.3 xal";
            if (risingNameElem) risingNameElem.textContent = `${firstRising.name} (2026 Trend)`;
        }
    }

    updateAuthUI() {
        const authContainer = document.getElementById("header-auth-container");
        const studentNameBanner = document.getElementById("student-profile-name-display");
        const studentMetaBanner = document.getElementById("student-profile-meta-display");
        const studentAvatarBadge = document.getElementById("student-avatar-badge");
        const studentIdDisplay = document.getElementById("student-id-display");

        if (this.auth.isLoggedIn()) {
            const user = this.auth.currentUser;
            const initials = user.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2) || "TL";

            if (authContainer) {
                authContainer.innerHTML = `
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 cursor-pointer shadow-2xs hover:bg-indigo-100/60 transition-all" onclick="app.switchTab('student-gap')">
                            <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                ${initials}
                            </div>
                            <div class="text-left hidden sm:block">
                                <div class="text-xs font-bold text-slate-900 leading-tight">${user.name}</div>
                                <div class="text-[10px] text-indigo-700 font-semibold">${user.university} (${user.degree})</div>
                            </div>
                        </div>
                        <button onclick="app.handleLogout()" class="p-2 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors" title="Çıxış Et">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                `;
            }

            if (studentAvatarBadge) {
                studentAvatarBadge.textContent = initials;
            }
            if (studentIdDisplay) {
                studentIdDisplay.textContent = `ID: ${user.studentId || 'AZ-STD-2026'}`;
            }
            if (studentNameBanner) {
                studentNameBanner.textContent = `${user.name} 👋`;
            }
            if (studentMetaBanner) {
                studentMetaBanner.innerHTML = `
                    <span class="bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-700 shadow-2xs"><i class="fas fa-university text-indigo-600 mr-1.5"></i>${user.university} – ${user.faculty}</span>
                    <span class="bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-700 shadow-2xs"><i class="fas fa-star text-amber-500 mr-1.5"></i>ÜOMG: ${user.gpa || '88.4'}</span>
                    <span class="bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-700 shadow-2xs"><i class="fas fa-language text-indigo-600 mr-1.5"></i>İngilis dili: ${user.englishLevel}</span>
                `;
            }

            if (user.targetRole) {
                const targetRoleSelect = document.getElementById("student-target-role");
                if (targetRoleSelect && targetRoleSelect.value !== user.targetRole) {
                    targetRoleSelect.value = user.targetRole;
                }
            }

            if (user.savedSkills) {
                this.currentSkills = { ...user.savedSkills };
            }
        } else {
            if (authContainer) {
                authContainer.innerHTML = `
                    <button onclick="app.openAuthModal('login')" class="btn-saas-outline px-3.5 py-2 rounded-full text-slate-800 hover:text-indigo-600 font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all">
                        <i class="fas fa-user-lock text-indigo-600"></i>
                        <span>Kabinetə Daxil Ol</span>
                    </button>
                `;
            }
            if (studentNameBanner) {
                studentNameBanner.textContent = `Tələbə və Məzun Karyera Kabineti 👋`;
            }
        }
    }

    openAuthModal(mode = 'login') {
        const modal = document.getElementById("auth-modal");
        if (modal) {
            modal.classList.remove("hidden");
            modal.style.display = "flex";
            this.switchAuthMode(mode);
            this.hideAuthError();
        }
    }

    closeAuthModal() {
        const modal = document.getElementById("auth-modal");
        if (modal) {
            modal.classList.add("hidden");
            modal.style.display = "none";
            this.hideAuthError();
        }
    }

    switchAuthMode(mode) {
        const loginBtn = document.getElementById("auth-tab-login-btn");
        const regBtn = document.getElementById("auth-tab-reg-btn");
        const loginForm = document.getElementById("form-login");
        const regForm = document.getElementById("form-register");

        this.hideAuthError();

        if (mode === 'register') {
            regBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-900 bg-white shadow-sm transition-all";
            loginBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 transition-all";
            loginForm.classList.add("hidden");
            regForm.classList.remove("hidden");
        } else {
            loginBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-900 bg-white shadow-sm transition-all";
            regBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 transition-all";
            loginForm.classList.remove("hidden");
            regForm.classList.add("hidden");
        }
    }

    showAuthError(msg) {
        const banner = document.getElementById("auth-error-banner");
        const text = document.getElementById("auth-error-text");
        if (banner && text) {
            text.textContent = msg;
            banner.classList.remove("hidden");
        }
    }

    hideAuthError() {
        const banner = document.getElementById("auth-error-banner");
        if (banner) {
            banner.classList.add("hidden");
        }
    }

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.type = input.type === "password" ? "text" : "password";
        }
    }

    fillDemoCredentials() {
        document.getElementById("login-email").value = "demo@unec.edu.az";
        document.getElementById("login-password").value = "password123";
    }

    handleLoginSubmit(event) {
        if (event) event.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            this.auth.login(email, password);
            this.updateAuthUI();
            this.handleRoleChange();
            this.runSkillGapCalculation();
            this.closeAuthModal();
            this.switchTab("student-gap");
        } catch (err) {
            this.showAuthError(err.message);
        }
    }

    handleRegisterSubmit(event) {
        if (event) event.preventDefault();
        const name = document.getElementById("reg-name").value.trim() || "Tələbə";
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const uni = document.getElementById("reg-university").value;
        const faculty = document.getElementById("reg-faculty").value.trim() || "İqtisadiyyat";
        const targetRole = document.getElementById("reg-target-role").value;
        const degree = document.getElementById("reg-degree").value;
        const english = document.getElementById("reg-english").value;

        try {
            this.auth.register(email, password, name, uni, faculty, targetRole, degree, english);
            
            document.getElementById("student-target-role").value = targetRole;
            this.updateAuthUI();
            this.handleRoleChange();
            this.runSkillGapCalculation();
            this.closeAuthModal();
            this.switchTab("student-gap");
        } catch (err) {
            this.showAuthError(err.message);
        }
    }

    handleLogout() {
        this.auth.logout();
        this.updateAuthUI();
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === "az" ? "en" : "az";
        this.applyLanguage();
    }

    applyLanguage() {
        const langDict = this.data.i18n[this.currentLang];
        const langBtn = document.getElementById("lang-toggle-btn");
        if (langBtn) {
            langBtn.innerHTML = this.currentLang === "az" 
                ? `<span class="text-sm">🇦🇿</span> <span class="font-bold">AZ</span>` 
                : `<span class="text-sm">🇬🇧</span> <span class="font-bold">EN</span>`;
        }

        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (langDict[key]) {
                el.textContent = langDict[key];
            }
        });

        this.runSkillGapCalculation();
        this.renderLiveVacancies();
    }

    initRouter() {
        // Handle Browser Back / Forward buttons (popstate & hashchange)
        window.addEventListener("popstate", (event) => {
            const tabFromState = event.state && event.state.tab;
            const tabFromHash = window.location.hash.replace(/^#/, "");
            const targetTab = tabFromState || tabFromHash || "overview";
            this.switchTab(targetTab, false);
        });

        window.addEventListener("hashchange", () => {
            const targetTab = window.location.hash.replace(/^#/, "") || "overview";
            if (targetTab !== this.currentActiveTab) {
                this.switchTab(targetTab, false);
            }
        });

        // Close open modals when pressing Escape key
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.closeAuthModal();
                this.closeDataModal();
                this.closeSurveyImportModal();
            }
        });

        // Initial Route Resolution on page load
        const initialHash = window.location.hash.replace(/^#/, "");
        const validTabs = [
            "overview",
            "student-gap",
            "live-vacancies",
            "interactive-map",
            "vacancy-analytics",
            "university-dash",
            "policy-gov",
            "nlp-sandbox",
            "methodology"
        ];

        if (initialHash && validTabs.includes(initialHash)) {
            this.switchTab(initialHash, false);
            try {
                history.replaceState({ tab: initialHash }, "", `#${initialHash}`);
            } catch (e) {}
        } else {
            this.switchTab("overview", false);
            try {
                history.replaceState({ tab: "overview" }, "", window.location.pathname + window.location.search);
            } catch (e) {}
        }
    }

    switchTab(tabId, updateHistory = true) {
        if (!tabId) tabId = "overview";

        document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
        document.querySelectorAll("[data-tab-btn]").forEach(btn => {
            btn.classList.remove("text-indigo-600", "bg-indigo-50", "text-orange-700", "bg-orange-50", "font-bold", "text-primary-600", "bg-primary-50");
            btn.classList.add("text-slate-600");
        });

        const activeContent = document.getElementById(`tab-${tabId}`);
        if (activeContent) {
            activeContent.classList.add("active");
            this.currentActiveTab = tabId;
        } else {
            const defaultContent = document.getElementById("tab-overview");
            if (defaultContent) defaultContent.classList.add("active");
            this.currentActiveTab = "overview";
            tabId = "overview";
        }

        const activeBtns = document.querySelectorAll(`[data-tab-btn="${tabId}"]`);
        activeBtns.forEach(activeBtn => {
            activeBtn.classList.remove("text-slate-600", "text-slate-700");
            activeBtn.classList.add("text-indigo-600", "bg-indigo-50", "font-bold");
        });

        // Update Browser History Stack
        if (updateHistory) {
            const targetHash = `#${tabId}`;
            if (window.location.hash !== targetHash) {
                try {
                    history.pushState({ tab: tabId }, "", targetHash);
                } catch (e) {
                    window.location.hash = tabId;
                }
            }
        }

        if (tabId === "vacancy-analytics") {
            setTimeout(() => {
                if (this.charts.topSkills) this.charts.topSkills.resize();
                if (this.charts.sectors) this.charts.sectors.resize();
            }, 100);
        } else if (tabId === "student-gap") {
            setTimeout(() => {
                if (this.charts.studentRadar) this.charts.studentRadar.resize();
            }, 100);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    populateRolesDropdown() {
        const select = document.getElementById("student-target-role");
        if (!select) return;

        select.innerHTML = "";
        this.data.jobRolesBenchmark.forEach(role => {
            const opt = document.createElement("option");
            opt.value = role.id;
            opt.textContent = `${role.title} (${role.sector})`;
            select.appendChild(opt);
        });
    }

    handleRoleChange() {
        const select = document.getElementById("student-target-role");
        if (!select) return;
        const roleId = select.value;
        const role = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === roleId) : null;
        if (!role) return;

        const container = document.getElementById("skills-slider-container");
        if (!container) return;
        container.innerHTML = "";

        const benchmarkSkills = role.skills_benchmark || Object.entries(role.requiredSkills || {}).map(([sId, reqVal]) => ({
            skill_id: sId,
            canonical_name: this.engine.findSkillInfo(sId)?.name || sId,
            market_level: this.engine.normalizeLevel(reqVal),
            importance: reqVal >= 75 ? "required" : "preferred"
        }));

        const levelNames = { 1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced", 5: "Expert" };

        benchmarkSkills.forEach(item => {
            const skillId = item.skill_id || item.id;
            const skillName = item.canonical_name || item.name || skillId;
            const reqLevel = this.engine.normalizeLevel(item.market_level || 3);
            const reqName = levelNames[reqLevel] || `${reqLevel}/5`;
            const isReq = item.importance === "required";

            if (this.currentSkills[skillId] === undefined) {
                this.currentSkills[skillId] = 2; // Default to Basic (2)
            }

            const currentVal = this.engine.normalizeLevel(this.currentSkills[skillId]);
            const currentName = levelNames[currentVal] || `${currentVal}/5`;

            const div = document.createElement("div");
            div.className = "bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 hover:border-orange-200 transition-colors";
            div.innerHTML = `
                <div class="flex justify-between items-center text-xs font-semibold">
                    <div class="flex items-center gap-1.5">
                        <span class="text-slate-900 font-bold">${skillName}</span>
                        ${isReq ? '<span class="text-[9px] font-black uppercase text-orange-600 bg-orange-100/70 px-1.5 py-0.5 rounded">Zəruri</span>' : '<span class="text-[9px] font-semibold text-purple-600 bg-purple-100/70 px-1.5 py-0.5 rounded">+Üstünlük</span>'}
                    </div>
                    <span class="text-orange-700 font-black text-xs bg-orange-100/80 px-2 py-0.5 rounded-lg" id="val-badge-${skillId}">
                        ${currentName} (${currentVal}/5)
                    </span>
                </div>
                <input type="range" min="1" max="5" step="1" value="${currentVal}" class="w-full accent-orange-600 cursor-pointer"
                    oninput="app.updateSkillValue('${skillId}', this.value)">
                <div class="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>1: Beginner</span>
                    <span class="text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">Bazar Tələbi: <strong class="text-orange-600">${reqName} (${reqLevel}/5)</strong></span>
                    <span>5: Expert</span>
                </div>
            `;
            container.appendChild(div);
        });

        this.runSkillGapCalculation();
    }

    updateSkillValue(skillId, value) {
        const val = this.engine.normalizeLevel(value);
        this.currentSkills[skillId] = val;
        const levelNames = { 1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced", 5: "Expert" };
        const badge = document.getElementById(`val-badge-${skillId}`);
        if (badge) badge.textContent = `${levelNames[val]} (${val}/5)`;
        this.runSkillGapCalculation();
        this.renderLiveVacancies();
    }

    loadPreset(presetType) {
        if (presetType === 'beginner') {
            Object.keys(this.currentSkills).forEach(k => this.currentSkills[k] = 1);
        } else if (presetType === 'finance') {
            this.currentSkills['excel'] = 4;
            this.currentSkills['financial_analysis'] = 4;
            this.currentSkills['accounting_1c'] = 3;
            this.currentSkills['accounting'] = 3;
            this.currentSkills['sql'] = 2;
            this.currentSkills['powerbi'] = 2;
            this.currentSkills['english'] = 4;
            this.currentSkills['analytical_thinking'] = 4;
        } else if (presetType === 'data') {
            this.currentSkills['sql'] = 4;
            this.currentSkills['excel'] = 4;
            this.currentSkills['powerbi'] = 3;
            this.currentSkills['python'] = 3;
            this.currentSkills['analytical_thinking'] = 4;
            this.currentSkills['english'] = 4;
        }

        this.handleRoleChange();
        this.renderLiveVacancies();
    }

    runSkillGapCalculation() {
        const roleIdSelect = document.getElementById("student-target-role");
        if (!roleIdSelect) return;
        const roleId = roleIdSelect.value;

        const user = (this.auth && this.auth.isLoggedIn()) ? this.auth.currentUser : {
            degree: "Bakalavr",
            faculty: "Maliyyə və İqtisadiyyat",
            field: "Maliyyə & İqtisadiyyat",
            experience: 0,
            experience_years: 0,
            englishLevel: "B2",
            english_level: "B2"
        };

        const result = this.engine.calculateGap(roleId, this.currentSkills, user);
        if (!result || !result.role) return;

        if (this.auth && this.auth.isLoggedIn()) {
            this.auth.updateSkills(this.currentSkills);
        }

        // 1. Başlıq və Təsvir
        const titleElem = document.getElementById("result-role-title");
        const descElem = document.getElementById("result-role-desc");
        if (titleElem) titleElem.textContent = result.role.title;
        if (descElem) descElem.textContent = result.role.description || `${result.role.title} üzrə Jobsearch.az real vakansiya tələbləri.`;
        
        // 2. Match Score
        const scoreElem = document.getElementById("result-match-score");
        if (scoreElem) {
            scoreElem.textContent = `${result.matchPercentage}%`;
            if (result.matchPercentage >= 75) {
                scoreElem.className = "text-3xl font-black text-emerald-600";
            } else if (result.matchPercentage >= 50) {
                scoreElem.className = "text-3xl font-black text-indigo-600";
            } else {
                scoreElem.className = "text-3xl font-black text-rose-600";
            }
        }

        // 3. Əməkhaqqı Dəyəri / Potensial Qazanc Paneli
        const salaryText = document.getElementById("result-salary-text");
        const salaryGrowth = document.getElementById("result-salary-growth");
        if (salaryText && salaryGrowth && result.salaryEstimate) {
            salaryText.textContent = `${result.salaryEstimate.currentSalaryAZN} ➔ ${result.salaryEstimate.potentialSalaryAZN} AZN`;
            salaryGrowth.textContent = `+${result.salaryEstimate.growthPercentage}% Gəlir Artımı Potensialı`;
        }

        const salaryBox = document.getElementById("result-salary-estimate");
        if (salaryBox && result.salaryEstimate) {
            salaryBox.innerHTML = `
                <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-100 mb-2">
                    <span class="text-slate-500 font-semibold">Təxmini Cari Bazar Dəyəriniz:</span>
                    <span class="font-black text-slate-900 text-sm">${result.salaryEstimate.currentSalaryAZN} AZN / ay</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                    <span class="text-emerald-700 font-semibold">Boşluqları bağladıqdan sonra:</span>
                    <span class="font-black text-emerald-600 text-sm">${result.salaryEstimate.potentialSalaryAZN} AZN (+${result.salaryEstimate.growthPercentage}%)</span>
                </div>
                ${result.componentScores ? `
                <div class="pt-2.5 mt-2 border-t border-slate-100 text-[10px] text-slate-500 grid grid-cols-2 gap-1.5">
                    <span>⚡ Bacarıqlar (70%): <strong class="text-slate-800">${result.componentScores.skillsScore}%</strong></span>
                    <span>💼 Təcrübə (15%): <strong class="text-slate-800">${result.componentScores.experienceScore}%</strong></span>
                    <span>🎓 Təhsil (10%): <strong class="text-slate-800">${result.componentScores.educationScore}%</strong></span>
                    <span>🌐 Dil (5%): <strong class="text-slate-800">${result.componentScores.languageScore}%</strong></span>
                </div>
                ` : ''}
            `;
        }

        // 4. Spider (Radar) Qrafiki
        this.renderStudentRadarChart(result);

        // 5. Gap Cədvəli
        const tableBody = document.getElementById("gap-table-body");
        if (tableBody) {
            tableBody.innerHTML = "";
            const levelNames = { 1: "Beginner", 2: "Elementary", 3: "Intermediate", 4: "Upper-Inter", 5: "Advanced" };

            (result.breakdown || []).forEach(item => {
                const tr = document.createElement("tr");
                tr.className = "hover:bg-slate-50/80 transition-colors";
                
                let statusBadge = "";
                if (item.gap <= 0) {
                    statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">🟢 Standarta Uyğundur</span>`;
                } else if (item.gap === 1) {
                    statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">🟡 Low Gap (-1)</span>`;
                } else if (item.gap === 2) {
                    statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">🔵 Medium Gap (-2)</span>`;
                } else {
                    statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">🔴 High Gap (-${item.gap})</span>`;
                }

                let priorityBadge = "";
                if (item.priority === "Very High") {
                    priorityBadge = `<span class="text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Təcili</span>`;
                } else if (item.priority === "High") {
                    priorityBadge = `<span class="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Yüksək</span>`;
                } else if (item.priority === "Medium") {
                    priorityBadge = `<span class="text-[9px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Orta</span>`;
                } else {
                    priorityBadge = `<span class="text-[9px] text-slate-400">-</span>`;
                }

                tr.innerHTML = `
                    <td class="py-2.5 font-semibold text-slate-800">
                        ${item.skillName}
                        <span class="block text-[10px] text-slate-400 font-normal">${item.importance === 'required' ? 'Zəruri Tələb' : 'Üstünlük'} • Tələbat: ${item.demandPercentage || 70}%</span>
                    </td>
                    <td class="py-2.5 text-center font-bold text-slate-700">${levelNames[item.userLevel] || item.userLevel}</td>
                    <td class="py-2.5 text-center font-bold text-slate-700">${levelNames[item.requiredLevel] || item.requiredLevel}</td>
                    <td class="py-2.5 text-center font-bold ${item.gap > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                        ${item.gap > 0 ? `-${item.gap} səviyyə` : '✓ Tamdır'}
                        <div class="mt-0.5">${priorityBadge}</div>
                    </td>
                    <td class="py-2.5 text-right">${statusBadge}</td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // 6. Ən vacib İnkişaf Tövsiyələri
        const recList = document.getElementById("top-recommendations-list");
        if (recList) {
            recList.innerHTML = "";
            const priorities = result.topPriorities || [];
            if (priorities.length === 0) {
                recList.innerHTML = `<div class="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium">Təbriklər! Seçdiyiniz vəzifə üçün bütün zəruri bacarıqları tam ödəyirsiniz.</div>`;
            } else {
                priorities.forEach((rec, idx) => {
                    const div = document.createElement("div");
                    div.className = "p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs";
                    div.innerHTML = `
                        <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                            ${idx + 1}
                        </div>
                        <div class="flex-grow space-y-1">
                            <div class="font-bold text-slate-900 flex items-center justify-between">
                                <span>${rec.skillName} (Boşluq: -${rec.gap})</span>
                                <span class="text-indigo-600 text-[11px] font-bold">Prioritet: ${rec.priorityAz || 'Yüksək'}</span>
                            </div>
                            <p class="text-slate-600 leading-relaxed">${rec.actionPlan || 'Bazar tələbini ödəmək üçün bu bacarığı artırın.'}</p>
                            <div class="pt-1 text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                                <i class="fas fa-graduation-cap"></i>Resurs: <span>${rec.resource || 'SkillMap Pulsuz Təlimlər'}</span>
                            </div>
                        </div>
                    `;
                    recList.appendChild(div);
                });
            }
        }

        // 7. Alternativ Karyera Tövsiyələri
        const altList = document.getElementById("career-alternatives-list");
        if (altList) {
            altList.innerHTML = "";
            const alternatives = result.alternativeCareers || [];
            const medals = ["🥇", "🥈", "🥉"];
            alternatives.forEach((alt, idx) => {
                const card = document.createElement("div");
                card.className = "p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-all cursor-pointer shadow-2xs";
                card.onclick = () => {
                    const sel = document.getElementById("student-target-role");
                    if (sel) {
                        sel.value = alt.roleId;
                        this.handleRoleChange();
                    }
                };
                card.innerHTML = `
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-base">${medals[idx] || "🎯"}</span>
                        <span class="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">${alt.matchPercentage}% Uyğun</span>
                    </div>
                    <div class="font-bold text-slate-900 text-xs mb-1">${alt.roleTitle}</div>
                    <div class="text-[11px] text-slate-500 line-clamp-1">${alt.sector} • ${alt.salaryBenchmark} AZN</div>
                `;
                altList.appendChild(card);
            });
        }

        // 8. Dinamik Karyera İnkişaf Trayektoriyası (Roadmap Stepper)
        this.renderCareerTrajectory(result);
    }

    renderCareerTrajectory(result) {
        const badge = document.getElementById("traj-status-badge");
        const stage1Title = document.getElementById("traj-stage1-title");
        const stage1Desc = document.getElementById("traj-stage1-desc");
        const stage2Title = document.getElementById("traj-stage2-title");
        const stage2Desc = document.getElementById("traj-stage2-desc");
        const stage3Title = document.getElementById("traj-stage3-title");
        const stage3Desc = document.getElementById("traj-stage3-desc");
        const stage4Title = document.getElementById("traj-stage4-title");
        const stage4Desc = document.getElementById("traj-stage4-desc");

        if (!badge || !stage2Title) return;

        const role = result.role;
        const user = (this.auth && this.auth.isLoggedIn()) ? this.auth.currentUser : null;
        const uniName = user ? user.university : "Ali Təhsil";
        const facultyName = user ? user.faculty : "Maliyyə və İqtisadiyyat";

        // Stage 1: Təhsil
        if (stage1Desc) stage1Desc.textContent = `${facultyName} üzrə baza təhsili (${uniName}).`;

        // Stage 2: Skill Gap (Dinamik)
        const criticalGaps = result.breakdown.filter(b => b.gap > 0).slice(0, 2);
        if (criticalGaps.length > 0) {
            const gapNames = criticalGaps.map(g => g.skillName).join(" & ");
            if (stage2Title) stage2Title.textContent = `2. ${gapNames} Gap`;
            if (stage2Desc) stage2Desc.textContent = `Bazarın tələb etdiyi ${criticalGaps.length} kritik bacarığı artırmaq.`;
            if (badge) badge.textContent = `2-ci Mərhələdəsiniz (Skill Gap: -${criticalGaps[0].gap}%)`;
        } else {
            if (stage2Title) stage2Title.textContent = `2. Bacarıqlar Hazırdır ✓`;
            if (stage2Desc) stage2Desc.textContent = `Bütün zəruri texniki tələblər 100% ödənilib.`;
            if (badge) badge.textContent = `4-cü Mərhələdəsiniz (İşə Hazırsınız)`;
        }

        // Stage 3: Portfel
        if (stage3Title) stage3Title.textContent = `3. Real Portfel Layihəsi`;
        if (stage3Desc) stage3Desc.textContent = `${role.title} üzrə ən azı 2 praktiki case study və ya GitHub portfeli.`;

        // Stage 4: Hədəf vəzifə və maaş
        if (stage4Title) stage4Title.textContent = `4. İş Təklifi (Job Offer)`;
        if (stage4Desc) stage4Desc.textContent = `Aparıcı şirkətlərdə ${role.title} vəzifəsi (${role.avgSalary}).`;
    }

    renderStudentRadarChart(result) {
        const ctxRadar = document.getElementById("chart-student-radar");
        if (!ctxRadar) return;

        const labels = result.breakdown.map(b => b.skillName.split("/")[0].trim());
        const userScores = result.breakdown.map(b => b.userLevel);
        const marketScores = result.breakdown.map(b => b.requiredLevel);

        if (this.charts.studentRadar) {
            this.charts.studentRadar.destroy();
        }

        this.charts.studentRadar = new Chart(ctxRadar, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Sənin Mövcud Səviyyən (1-5)',
                        data: userScores,
                        backgroundColor: 'rgba(234, 88, 12, 0.25)',
                        borderColor: '#ea580c',
                        borderWidth: 2,
                        pointBackgroundColor: '#ea580c'
                    },
                    {
                        label: 'Bazar Tələbi (1-5)',
                        data: marketScores,
                        backgroundColor: 'rgba(100, 116, 139, 0.15)',
                        borderColor: '#64748b',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointBackgroundColor: '#64748b'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: v => ['0', '1', '2', '3', '4', '5'][v] || v,
                            font: { size: 9 }
                        },
                        pointLabels: { font: { size: 10, weight: 'bold' } }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
                }
            }
        });
    }

    renderLiveVacancies() {
        const container = document.getElementById("live-vacancies-grid");
        if (!container) return;

        const searchInput = document.getElementById("vacancy-search-input");
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const vacancies = this.data.liveVacancies || [];
        const filtered = vacancies.filter(v => {
            return v.title.toLowerCase().includes(query) ||
                   v.company.toLowerCase().includes(query) ||
                   v.sector.toLowerCase().includes(query) ||
                   v.skills.some(s => s.toLowerCase().includes(query));
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    <i class="fas fa-search text-2xl text-slate-300 mb-2 block"></i>
                    Axtarışınıza uyğun heç bir vakansiya tapılmadı.
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(vac => {
            const matchInfo = this.engine.calculateVacancyMatch(vac, this.currentSkills);
            
            let badgeBg = "bg-amber-100 text-amber-800 border-amber-200";
            if (matchInfo.matchScore >= 75) badgeBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
            else if (matchInfo.matchScore < 45) badgeBg = "bg-rose-100 text-rose-800 border-rose-200";

            // Required vs Preferred skills
            const reqSkills = vac.required_skills || [];
            const prefSkills = vac.preferred_skills || [];
            const allSkills = vac.skills || [];

            let tagsHtml = "";
            if (allSkills.length > 0) {
                tagsHtml = allSkills.map(s => {
                    const isReq = reqSkills.includes(s);
                    const isPref = prefSkills.includes(s);
                    const isMatching = matchInfo.matchingSkills && matchInfo.matchingSkills.some(ms => ms.id === s || ms.name === s);

                    let pillClass = "bg-slate-100 text-slate-700 border-slate-200";
                    let labelPrefix = "";
                    if (isReq) {
                        pillClass = "bg-orange-50 text-orange-700 border-orange-200";
                        labelPrefix = "<span class='text-[9px] font-black uppercase mr-0.5 text-orange-600'>Tələb:</span>";
                    } else if (isPref) {
                        pillClass = "bg-purple-50 text-purple-700 border-purple-200";
                        labelPrefix = "<span class='text-[9px] font-bold uppercase mr-0.5 text-purple-500'>+Üstünlük:</span>";
                    }

                    if (isMatching) {
                        pillClass = "bg-emerald-50 text-emerald-800 border-emerald-300 font-black";
                    }

                    return `
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pillClass}" title="NLP ilə çıxarılıb">
                            ${isMatching ? '✓ ' : ''}${labelPrefix}${s}
                        </span>
                    `;
                }).join(" ");
            } else {
                tagsHtml = `<span class="text-[11px] text-slate-400 italic">Vakansiya mətnində xüsusi bacarıq tələbi qeyd olunmayıb</span>`;
            }

            // Quality score badge
            const qScore = vac.data_quality_score !== undefined ? vac.data_quality_score : 50;
            let qBadgeColor = "bg-slate-100 text-slate-600";
            if (qScore >= 70) qBadgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
            else if (qScore < 40) qBadgeColor = "bg-amber-50 text-amber-700 border border-amber-200";

            // Extracted meta pills (Languages, Experience, Education)
            const expText = vac.extracted_experience ? vac.extracted_experience.raw : (vac.experience || "Qeyd olunmayıb");
            const eduText = vac.extracted_education ? vac.extracted_education.display : (vac.education || "Qeyd olunmayıb");
            const langs = vac.extracted_languages || [];
            const langPills = langs.map(l => `<span class="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-medium"><i class="fas fa-language mr-1"></i>${l.language_az || l.language} (${l.level})</span>`).join(" ");

            // Company initials or icon
            const compName = vac.company || "Açıq Vakansiya";
            const compInitials = compName.split(" ").map(w => w.charAt(0)).join("").toUpperCase().slice(0, 2) || "VK";

            return `
                <div class="job-card flex flex-col justify-between space-y-3.5 group">
                    <div>
                        <!-- Card Header: Company Logo, Title, Match Score -->
                        <div class="flex items-start justify-between gap-3 mb-2.5">
                            <div class="flex items-start gap-3">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-indigo-50 border border-slate-200/80 flex items-center justify-center font-black text-slate-700 text-xs shadow-2xs group-hover:border-indigo-300 group-hover:bg-indigo-50/50 transition-all flex-shrink-0">
                                    ${compInitials}
                                </div>
                                <div>
                                    <span class="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">${compName}</span>
                                    <h4 class="font-bold text-slate-900 text-sm mt-0.5 leading-snug group-hover:text-indigo-900 transition-colors line-clamp-1">${vac.title}</h4>
                                </div>
                            </div>
                            <div class="flex flex-col items-end gap-1 flex-shrink-0">
                                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${badgeBg} shadow-2xs">
                                    <i class="fas fa-bolt mr-1 text-[10px]"></i>${matchInfo.matchScore}% Uyğun
                                </span>
                                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${qBadgeColor}" title="Data Tamlığı və Keyfiyyət İndeksi">
                                    Keyfiyyət: ${qScore}/100
                                </span>
                            </div>
                        </div>

                        <!-- Meta: Sektor, Məkan, Təcrübə -->
                        <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                            <span class="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                                <i class="fas fa-folder text-slate-400 text-[10px]"></i>${vac.sector || "Digər"}
                            </span>
                            <span class="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg">
                                <i class="fas fa-location-dot text-slate-400 text-[10px]"></i>${vac.district || vac.location || "Bakı"}
                            </span>
                            ${expText !== 'Qeyd olunmayıb' ? `<span class="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg"><i class="fas fa-clock text-slate-400 text-[10px]"></i>${expText}</span>` : ''}
                        </div>

                        <p class="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed">${vac.description || "Təsvir qeyd olunmayıb."}</p>

                        <!-- NLP Skills Section -->
                        <div class="space-y-1.5 mb-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                            <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                                <span class="flex items-center gap-1"><i class="fas fa-microchip text-indigo-500"></i>NLP Çıxarılmış Bacarıqlar:</span>
                                <span class="text-emerald-600 font-bold">✓ Standartlaşdırılıb</span>
                            </div>
                            <div class="flex flex-wrap gap-1">
                                ${tagsHtml}
                            </div>
                        </div>

                        <!-- Dil və Təhsil Metadatası -->
                        ${(langPills || eduText !== 'Qeyd olunmayıb') ? `
                        <div class="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            ${eduText !== 'Qeyd olunmayıb' ? `<span class="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-medium"><i class="fas fa-graduation-cap mr-1 text-slate-400"></i>${eduText}</span>` : ''}
                            ${langPills}
                        </div>` : ''}
                    </div>

                    <!-- Card Footer: Salary & Apply Button -->
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                            <span class="text-slate-400 block text-[10px] font-medium">Maaş (Net/Gross):</span>
                            <span class="font-bold text-slate-900 text-sm">${vac.salary || "Razılaşma yolu ilə"}</span>
                        </div>
                        <a href="${vac.applyUrl || '#'}" target="_blank" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm group-hover:shadow-md">
                            <span>Elana Bax</span>
                            <i class="fas fa-arrow-up-right-from-square text-[10px] opacity-70 group-hover:opacity-100"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join("");
    }

    renderVacancyAnalytics() {
        const stats = this.data.macroMarketStats || {};
        const topSkillsData = stats.topSkillsAnalytics || [
            { skill: "Excel", demand_percentage: 68 },
            { skill: "English", demand_percentage: 62 },
            { skill: "SQL", demand_percentage: 48 },
            { skill: "1C", demand_percentage: 38 },
            { skill: "Communication", demand_percentage: 75 }
        ];

        const ctxTop = document.getElementById("chart-top-skills");
        if (ctxTop) {
            if (this.charts.topSkills) this.charts.topSkills.destroy();
            this.charts.topSkills = new Chart(ctxTop, {
                type: 'bar',
                data: {
                    labels: topSkillsData.slice(0, 10).map(s => s.skill),
                    datasets: [{
                        label: 'Vakansiyalarda Tələbat Faizi (%)',
                        data: topSkillsData.slice(0, 10).map(s => s.demand_percentage),
                        backgroundColor: '#ea580c',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.raw}% (${topSkillsData[ctx.dataIndex]?.demand_count || 0} vakansiya)`
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
                    }
                }
            });
        }

        const ctxSectors = document.getElementById("chart-sectors");
        if (ctxSectors) {
            const sectors = (stats && stats.sectorDistribution && stats.sectorDistribution.length > 0)
                ? stats.sectorDistribution
                : [
                    { sector: "Maliyyə & Bankçılıq", share: 31.4 },
                    { sector: "IT & Rəqəmsal", share: 20.5 },
                    { sector: "Satış & Müştəri Xidmətləri", share: 18.6 },
                    { sector: "Təhsil & Elm", share: 10.0 },
                    { sector: "Mühəndislik & Tikinti", share: 8.1 },
                    { sector: "Logistika & Təchizat", share: 5.2 },
                    { sector: "İnzibati & HR", share: 3.8 }
                ];

            if (this.charts.sectors) this.charts.sectors.destroy();
            this.charts.sectors = new Chart(ctxSectors, {
                type: 'doughnut',
                data: {
                    labels: sectors.map(s => s.sector),
                    datasets: [{
                        data: sectors.map(s => s.share || s.count),
                        backgroundColor: ['#ea580c', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                    }
                }
            });
        }

        const risingContainer = document.getElementById("rising-skills-list");
        if (risingContainer) {
            const risingList = (stats && stats.risingSkills2026 && stats.risingSkills2026.length > 0)
                ? stats.risingSkills2026
                : topSkillsData.slice(0, 5).map(item => ({ name: item.skill, growth: `+${item.demand_percentage}%` }));

            risingContainer.innerHTML = risingList.map(item => `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-orange-50/60 border border-orange-100 text-xs font-semibold">
                    <span class="text-slate-800"><i class="fas fa-arrow-up text-orange-600 mr-2"></i>${item.name || item.skill}</span>
                    <span class="text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded-full">${item.growth}</span>
                </div>
            `).join("");
        }

        const decliningContainer = document.getElementById("declining-skills-list");
        if (decliningContainer) {
            const decliningList = (stats && stats.decliningSkills2026 && stats.decliningSkills2026.length > 0)
                ? stats.decliningSkills2026
                : [
                    { name: "Əl ilə Sənədləşmə", growth: "-35%" },
                    { name: "Klassik Kadr Uçotu (Offline)", growth: "-28%" },
                    { name: "Kompüter Operatorluğu (Baza)", growth: "-22%" },
                    { name: "Statik Cədvəl İdarəçiliyi", growth: "-18%" }
                ];

            decliningContainer.innerHTML = decliningList.map(item => `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs font-semibold">
                    <span class="text-slate-800"><i class="fas fa-arrow-down text-rose-600 mr-2"></i>${item.name}</span>
                    <span class="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">${item.growth}</span>
                </div>
            `).join("");
        }
    }

    // ----------------------------------------------------
    // GOOGLE FORMS STUDENT SURVEY & MARKET VS STUDENT
    // ----------------------------------------------------

    getSurveyData(universityId = "all") {
        if (!this.surveyResponses) {
            // Default pilot survey sample (144 respondents across major universities)
            this.surveyResponses = [
                // UNEC (48 respondents)
                ...Array.from({ length: 48 }, (_, i) => ({
                    respondent_id: `RESP-UNEC-${   String(i+1).padStart(3,'0')}`,
                    university: "UNEC",
                    field_of_study: i % 2 === 0 ? "Maliyyə" : "Mühasibat və Audit",
                    field_normalized: "Economics & Finance",
                    education_level: "Bakalavr",
                    work_experience: i % 3 === 0 ? "1 - 3 il" : "Təcrübəsiz (0 il)",
                    work_experience_years: i % 3 === 0 ? 1.5 : 0.0,
                    job_search_status: i % 4 === 0 ? "Hazırda işləyir" : "Aktiv iş axtarır",
                    english_level: i % 2 === 0 ? "B2" : "B1",
                    digital_skill_level: "Orta",
                    target_sector: "Maliyyə & Bankçılıq",
                    target_role: i % 2 === 0 ? "Financial Analyst" : "Accountant",
                    skills: { excel: 4, financial_analysis: 4, accounting: 4, accounting_1c: 3, english: 4, communication: 4, analytical_thinking: 3, sql: 2, powerbi: 2 },
                    is_demo: 1
                })),
                // BDU (36 respondents)
                ...Array.from({ length: 36 }, (_, i) => ({
                    respondent_id: `RESP-BDU-${   String(i+1).padStart(3,'0')}`,
                    university: "BDU",
                    field_of_study: i % 2 === 0 ? "Tətbiqi Riyaziyyat və Kibernetika" : "Kompüter Elmləri",
                    field_normalized: "IT & Computer Science",
                    education_level: "Bakalavr",
                    work_experience: i % 2 === 0 ? "0 - 1 il" : "Təcrübəsiz (0 il)",
                    work_experience_years: i % 2 === 0 ? 0.5 : 0.0,
                    job_search_status: "Aktiv iş axtarır",
                    english_level: i % 3 === 0 ? "B2" : "B1",
                    digital_skill_level: "Qabaqcıl",
                    target_sector: "IT & Rəqəmsal",
                    target_role: i % 2 === 0 ? "Data Analyst" : "Frontend Developer",
                    skills: { python: 4, sql: 3, javascript: 3, excel: 3, analytical_thinking: 4, communication: 3, english: 3, powerbi: 2 },
                    is_demo: 1
                })),
                // ADNSU (32 respondents)
                ...Array.from({ length: 32 }, (_, i) => ({
                    respondent_id: `RESP-ADNSU-${   String(i+1).padStart(3,'0')}`,
                    university: "ADNSU",
                    field_of_study: i % 2 === 0 ? "İnformasiya Texnologiyaları" : "Neft-qaz Mühəndisliyi",
                    field_normalized: i % 2 === 0 ? "IT & Computer Science" : "Engineering",
                    education_level: "Bakalavr",
                    work_experience: "Təcrübəsiz (0 il)",
                    work_experience_years: 0.0,
                    job_search_status: "Aktiv iş axtarır",
                    english_level: "B1",
                    digital_skill_level: "Orta",
                    target_sector: "Mühəndislik & IT",
                    target_role: i % 2 === 0 ? "Software Developer" : "Mühəndis",
                    skills: { autocad: 4, excel: 3, sql: 3, communication: 3, english: 3, analytical_thinking: 3, python: 2 },
                    is_demo: 1
                })),
                // BANM (16 respondents - below threshold < 30)
                ...Array.from({ length: 16 }, (_, i) => ({
                    respondent_id: `RESP-BANM-${   String(i+1).padStart(3,'0')}`,
                    university: "BANM",
                    field_of_study: "Proseslərin Avtomatlaşdırılması Mühəndisliyi",
                    field_normalized: "Engineering",
                    education_level: "Bakalavr",
                    work_experience: "1 - 3 il",
                    work_experience_years: 1.5,
                    job_search_status: "Aktiv iş axtarır",
                    english_level: "C1",
                    digital_skill_level: "Qabaqcıl",
                    target_sector: "Mühəndislik & Neft-Qaz",
                    target_role: "Process Automation Engineer",
                    skills: { english: 5, python: 4, autocad: 4, excel: 4, communication: 4, analytical_thinking: 5, sql: 3 },
                    is_demo: 1
                })),
                // ADA (12 respondents - below threshold < 30)
                ...Array.from({ length: 12 }, (_, i) => ({
                    respondent_id: `RESP-ADA-${   String(i+1).padStart(3,'0')}`,
                    university: "ADA",
                    field_of_study: "Biznes İdarəçiliyi və IT",
                    field_normalized: "IT & Computer Science",
                    education_level: "Bakalavr",
                    work_experience: "0 - 1 il",
                    work_experience_years: 0.5,
                    job_search_status: "Aktiv iş axtarır",
                    english_level: "C1",
                    digital_skill_level: "Qabaqcıl",
                    target_sector: "IT & Biznes",
                    target_role: "Business Analyst",
                    skills: { english: 5, communication: 5, analytical_thinking: 4, excel: 4, powerbi: 3, sql: 3, python: 3 },
                    is_demo: 1
                }))
            ];
        }

        if (universityId === "all" || !universityId) {
            return this.surveyResponses;
        }

        const mapName = {
            "unec": "UNEC",
            "bdu": "BDU",
            "azii": "ADNSU",
            "banm": "BANM",
            "ada": "ADA"
        };
        const targetName = (mapName[universityId.toLowerCase()] || universityId).toLowerCase();
        return this.surveyResponses.filter(r => (r.university || "").toLowerCase().includes(targetName));
    }

    renderUniversityView() {
        const select = document.getElementById("university-selector");
        const uniId = select ? select.value : "all";
        const responses = this.getSurveyData(uniId);
        const respCount = responses.length;

        // 1. Threshold Yoxlanışı (Threshold = 30)
        const thresholdAlert = document.getElementById("uni-threshold-alert");
        const thresholdCountElem = document.getElementById("threshold-curr-count");
        if (thresholdAlert && thresholdCountElem) {
            thresholdCountElem.textContent = respCount;
            if (uniId !== "all" && respCount < 30) {
                thresholdAlert.classList.remove("hidden");
            } else {
                thresholdAlert.classList.add("hidden");
            }
        }

        // 2. Tələbə Sorğu Xülasə Kartları
        const totalRespElem = document.getElementById("survey-total-respondents");
        const jobSearchElem = document.getElementById("survey-job-search-pct");
        const englishElem = document.getElementById("survey-english-pct");
        const topSectorElem = document.getElementById("survey-top-sector");

        if (totalRespElem) {
            totalRespElem.textContent = `${respCount} respondent`;
        }

        const realCount = responses.filter(r => !r.is_demo).length;
        const badgeIds = ["survey-data-badge-1", "survey-data-badge-2", "survey-data-badge-3", "survey-data-badge-4", "survey-data-badge"];
        badgeIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (realCount > 0) {
                    el.textContent = "REAL FORMS DATA";
                    el.className = "px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800";
                } else {
                    el.textContent = "PİLOT DEMO DATA";
                    el.className = "px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-700";
                }
            }
        });

        if (respCount > 0) {
            const jobSeekers = responses.filter(r => (r.job_search_status || "").includes("Aktiv")).length;
            if (jobSearchElem) jobSearchElem.textContent = `${Math.round((jobSeekers / respCount) * 100)}%`;

            const b2Eng = responses.filter(r => ["B2", "C1", "C2"].includes((r.english_level || "").toUpperCase())).length;
            if (englishElem) englishElem.textContent = `${Math.round((b2Eng / respCount) * 100)}%`;

            const sectorCounts = {};
            responses.forEach(r => {
                const s = r.target_sector || "Digər";
                sectorCounts[s] = (sectorCounts[s] || 0) + 1;
            });
            const topSec = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
            if (topSectorElem) topSectorElem.textContent = topSec ? topSec[0] : "IT & Maliyyə";
        }

        // 3. Market Demand vs Student Skills Müqayisəsi
        this.renderMarketVsStudentComparison(responses, uniId);

        // 4. Universitet Profili & Kurrikulum Tövsiyəsi
        const container = document.getElementById("university-details-container");
        if (!container) return;

        const uniInfo = (this.data && this.data.universitiesData) ? this.data.universitiesData.find(u => u.id === (uniId === "all" ? "unec" : uniId)) : null;
        if (!uniInfo) return;

        let strengthsHtml = (uniInfo.topStrengths || []).map(s => `
            <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 font-semibold">
                <span class="text-emerald-950">${s.name}</span>
                <span class="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">${s.score}% səviyyə</span>
            </div>
        `).join("");

        let gapsHtml = (uniInfo.criticalSkillGaps || []).map(g => `
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div class="flex justify-between font-bold text-slate-900">
                    <span>${g.name}</span>
                    <span class="text-rose-600 font-black">-${g.gap}% Boşluq</span>
                </div>
                <div class="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Bazar Tələbi: <strong>${g.marketDemand}%</strong></span>
                    <span>Tələbə Səviyyəsi: <strong>${g.studentLevel}%</strong></span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-rose-500 h-1.5 rounded-full" style="width: ${g.gap}%"></div>
                </div>
            </div>
        `).join("");

        container.innerHTML = `
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                        <span class="text-xs font-bold text-orange-600 uppercase tracking-wider">Təhsil Müəssisəsi və Fakültə Profili</span>
                        <h3 class="text-xl font-black text-slate-900 mt-0.5">${uniId === 'all' ? 'Azərbaycan Ali Təhsil Müəssisələri (Ümumi İcmal)' : uniInfo.name}</h3>
                        <p class="text-xs text-slate-500 mt-0.5">${uniId === 'all' ? 'Bütün tərəfdaş universitetlərin aqreqasiya edilmiş göstəriciləri' : 'Əhatə olunan fakültə: ' + uniInfo.faculty}</p>
                    </div>
                    <div class="px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-2xl text-center">
                        <div class="text-[11px] text-orange-700 font-bold">Sorğuda İştirak Edən</div>
                        <div class="text-lg font-black text-orange-950">${respCount} Tələbə / Məzun</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <i class="fas fa-check-circle text-emerald-600"></i>Tələbələrin Əsas Üstünlükləri
                        </h4>
                        <div class="space-y-2">
                            ${strengthsHtml}
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <i class="fas fa-triangle-exclamation text-rose-600"></i>Əmək Bazarında Kritik Skill Gap-lər
                        </h4>
                        <div class="space-y-2.5">
                            ${gapsHtml}
                        </div>
                    </div>
                </div>

                <div class="p-4.5 bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-orange-50/70 rounded-2xl border border-orange-200/80">
                    <div class="flex items-center gap-2 text-xs font-bold text-orange-950 mb-1.5">
                        <i class="fas fa-robot text-orange-600"></i>
                        <span>Süni İntellekt Kurrikulum və Qərar Dəstək Tövsiyəsi:</span>
                    </div>
                    <p class="text-xs text-slate-800 leading-relaxed font-medium">
                        "${uniInfo.aiRecommendation || 'Tədris proqramına bazarın ən çox tələb etdiyi data savadlılığı və praktiki laboratoriya dərslərinin artırılması tövsiyə olunur.'}"
                    </p>
                </div>
            </div>
        `;
    }

    renderMarketVsStudentComparison(responses, universityId) {
        const topMarketSkills = [
            { id: "communication", name: "Communication", marketDemand: 19.3 },
            { id: "time_management", name: "Time Management", marketDemand: 17.4 },
            { id: "analytical_thinking", name: "Analytical Thinking", marketDemand: 14.0 },
            { id: "excel", name: "Excel", marketDemand: 13.1 },
            { id: "sales", name: "Sales", marketDemand: 13.1 },
            { id: "russian", name: "Russian", marketDemand: 10.5 },
            { id: "english", name: "English", marketDemand: 8.8 },
            { id: "1c", name: "1C 8.3", marketDemand: 7.1 },
            { id: "procurement", name: "Procurement", marketDemand: 5.7 },
            { id: "accounting", name: "Accounting", marketDemand: 5.2 },
            { id: "autocad", name: "AutoCAD", marketDemand: 2.1 },
            { id: "sql", name: "SQL", marketDemand: 1.7 },
            { id: "powerbi", name: "Power BI", marketDemand: 1.5 },
            { id: "python", name: "Python", marketDemand: 1.4 }
        ];

        const realCount = responses.filter(r => !r.is_demo).length;
        const realCountElem = document.getElementById("market-real-respondents-count");
        if (realCountElem) realCountElem.textContent = realCount;

        const isSufficientRealData = (realCount >= 30);
        const totalResp = Math.max(1, responses.length);

        const comparisonRows = topMarketSkills.map(sk => {
            let compCount = 0;
            let totalLevel = 0;
            responses.forEach(r => {
                const sVal = (r.skills && r.skills[sk.id] !== undefined) ? r.skills[sk.id] : 2;
                if (sVal >= 3) compCount++;
                totalLevel += sVal;
            });

            const studentAvail = parseFloat(((compCount / totalResp) * 100).toFixed(1));
            const avgLevel = parseFloat((totalLevel / totalResp).toFixed(1));
            const gap = parseFloat((sk.marketDemand - studentAvail).toFixed(1));

            let statusText = "Kifayət qədər data yoxdur";
            let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Kifayət qədər data yoxdur</span>`;

            if (isSufficientRealData) {
                if (gap > 5.0) {
                    statusText = "Kritik Çatışmazlıq";
                    statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Undersupplied</span>`;
                } else if (gap < -15.0) {
                    statusText = "Təklif Üstündür";
                    statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Oversupplied</span>`;
                } else {
                    statusText = "Balanslaşdırılmış";
                    statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Balanced</span>`;
                }
            }

            return {
                ...sk,
                studentAvail,
                avgLevel,
                gap,
                statusText,
                statusBadge
            };
        });

        // 1. Render Table
        const tbody = document.getElementById("market-vs-student-tbody");
        if (tbody) {
            tbody.innerHTML = comparisonRows.map(row => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-2.5 font-bold text-slate-900">
                        ${row.name}
                        <span class="block text-[10px] text-slate-400 font-normal">Orta səviyyə: ${row.avgLevel}/5</span>
                    </td>
                    <td class="py-2.5 text-center font-bold text-orange-600">${row.marketDemand}%</td>
                    <td class="py-2.5 text-center font-bold text-slate-700">${row.studentAvail}%</td>
                    <td class="py-2.5 text-center font-bold ${row.gap > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                        ${row.gap > 0 ? `-${row.gap}%` : `+${Math.abs(row.gap)}%`}
                    </td>
                    <td class="py-2.5 text-right">${row.statusBadge}</td>
                </tr>
            `).join("");
        }

        // 2. Render Comparison Chart
        const ctx = document.getElementById("chart-market-vs-student");
        if (ctx) {
            if (this.charts.marketVsStudent) this.charts.marketVsStudent.destroy();
            const top8 = comparisonRows.slice(0, 8);
            this.charts.marketVsStudent = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: top8.map(s => s.name),
                    datasets: [
                        {
                            label: 'Bazar Tələbi (%)',
                            data: top8.map(s => s.marketDemand),
                            backgroundColor: '#ea580c',
                            borderRadius: 4
                        },
                        {
                            label: 'Tələbə Təklifi (Intermediate+ %)',
                            data: top8.map(s => s.studentAvail),
                            backgroundColor: '#64748b',
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }
                    },
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
                    }
                }
            });
        }
    }

    // ----------------------------------------------------
    // SURVEY IMPORT / EXPORT UI MODAL HANDLERS
    // ----------------------------------------------------

    openSurveyImportModal() {
        const modal = document.getElementById("modal-survey-import");
        if (modal) {
            modal.style.display = "flex";
            this.previewSurveyMapping();
        }
    }

    closeSurveyImportModal() {
        const modal = document.getElementById("modal-survey-import");
        if (modal) {
            modal.style.display = "none";
        }
    }

    fillSampleSurveyCSV() {
        const sampleCSV = `Universitet,İxtisas,Təhsil səviyyəsi,İş təcrübəsi,İngilis dili,Rəqəmsal bacarıq,Excel səviyyəsi,SQL səviyyəsi,Python səviyyəsi,Power BI səviyyəsi,Hədəf sektor,Hədəf vəzifə
UNEC,Maliyyə və Mühasibat,Bakalavr,Təcrübəsiz,B2,Orta,4,2,1,2,Maliyyə & Bankçılıq,Data Analyst
UNEC,Rəqəmsal İqtisadiyyat,Bakalavr,0-1 il,B2,Qabaqcıl,4,4,3,3,IT & Maliyyə,Business Analyst
BDU,Kompüter Elmləri,Bakalavr,1-3 il,B2,Qabaqcıl,3,4,4,3,IT & Rəqəmsal,Data Analyst
BDU,Tətbiqi Riyaziyyat,Bakalavr,Təcrübəsiz,B1,Orta,3,3,3,2,IT & Rəqəmsal,Python Developer
ADNSU,İnformasiya Texnologiyaları,Bakalavr,0-1 il,B1,Orta,3,3,2,2,Mühəndislik & IT,Software Developer
BANM,Proseslərin Avtomatlaşdırılması,Bakalavr,1-3 il,C1,Qabaqcıl,5,4,4,3,Mühəndislik,Automation Engineer
ADA,Biznes İdarəçiliyi,Bakalavr,Təcrübəsiz,C1,Qabaqcıl,4,3,2,3,Biznes & Konsaltinq,Financial Analyst`;
        
        const txtArea = document.getElementById("survey-csv-text");
        if (txtArea) {
            txtArea.value = sampleCSV;
            this.previewSurveyMapping();
        }
    }

    handleSurveyFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const txtArea = document.getElementById("survey-csv-text");
            if (txtArea) {
                txtArea.value = content;
                this.previewSurveyMapping();
            }
        };
        reader.readAsText(file, "UTF-8");
    }

    previewSurveyMapping() {
        const txtArea = document.getElementById("survey-csv-text");
        const container = document.getElementById("mapping-tags-container");
        const countElem = document.getElementById("mapping-detected-count");
        if (!txtArea || !container) return;

        const text = txtArea.value.trim();
        if (!text) {
            container.innerHTML = `<span class="text-slate-400 italic">CSV məlumatı daxil edildikdən sonra sütunlar avtomatik map olunacaq.</span>`;
            if (countElem) countElem.textContent = "0 sütun";
            return;
        }

        const firstLine = text.split("\n")[0];
        const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
        const cols = firstLine.split(delimiter).map(c => c.replace(/["']/g, "").trim());

        if (countElem) countElem.textContent = `${cols.length} sütun aşkarlandı`;

        container.innerHTML = cols.map(col => {
            const colLow = col.toLowerCase();
            let badgeColor = "bg-orange-50 text-orange-700 border-orange-200";
            let targetField = "custom_field";

            if (colLow.includes("ad") || colLow.includes("soyad") || colLow.includes("email") || colLow.includes("telefon")) {
                badgeColor = "bg-rose-50 text-rose-700 border-rose-200 line-through";
                targetField = "DROP_PII (Məxfilik)";
            } else if (colLow.includes("universitet") || colLow.includes("ali təhsil")) {
                targetField = "➔ university";
            } else if (colLow.includes("ixtisas") || colLow.includes("fakültə")) {
                targetField = "➔ field_of_study";
            } else if (colLow.includes("təcrübə")) {
                targetField = "➔ work_experience";
            } else if (colLow.includes("ingilis")) {
                targetField = "➔ english_level";
            } else if (colLow.includes("excel")) {
                targetField = "➔ skill:excel";
            } else if (colLow.includes("sql")) {
                targetField = "➔ skill:sql";
            } else if (colLow.includes("python")) {
                targetField = "➔ skill:python";
            } else if (colLow.includes("power")) {
                targetField = "➔ skill:powerbi";
            } else if (colLow.includes("sektor")) {
                targetField = "➔ target_sector";
            } else if (colLow.includes("vəzifə")) {
                targetField = "➔ target_role";
            }

            return `
                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${badgeColor}">
                    <span>${col}</span>
                    <span class="text-[10px] font-mono opacity-80">${targetField}</span>
                </div>
            `;
        }).join("");
    }

    executeSurveyImport() {
        const txtArea = document.getElementById("survey-csv-text");
        if (!txtArea || !txtArea.value.trim()) {
            alert("Zəhmət olmasa CSV mətni daxil edin və ya fayl seçin.");
            return;
        }

        const lines = txtArea.value.trim().split("\n");
        if (lines.length < 2) {
            alert("CSV ən azı başlıq və 1 sətir məlumatdan ibarət olmalıdır.");
            return;
        }

        const firstLine = lines[0];
        const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
        const headers = firstLine.split(delimiter).map(h => h.replace(/["']/g, "").trim());

        const newRecords = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = line.split(delimiter).map(v => v.replace(/["']/g, "").trim());
            
            const rec = {
                respondent_id: `RESP-IMPORT-${Date.now()}-${   String(i).padStart(3,'0')}`,
                university: "UNEC",
                field_of_study: "Maliyyə",
                field_normalized: "Economics & Finance",
                education_level: "Bakalavr",
                work_experience: "Təcrübəsiz (0 il)",
                work_experience_years: 0.0,
                job_search_status: "Aktiv iş axtarır",
                english_level: "B2",
                target_sector: "Maliyyə & Bankçılıq",
                target_role: "Data Analyst",
                skills: {},
                is_demo: 0
            };

            headers.forEach((h, idx) => {
                const val = values[idx] || "";
                const hLow = h.toLowerCase();
                if (hLow.includes("ad") || hLow.includes("email") || hLow.includes("telefon")) return;

                if (hLow.includes("universitet")) rec.university = val;
                else if (hLow.includes("ixtisas")) {
                    rec.field_of_study = val;
                    if (val.toLowerCase().includes("it") || val.toLowerCase().includes("kompüter")) rec.field_normalized = "IT & Computer Science";
                    else if (val.toLowerCase().includes("mühəndis")) rec.field_normalized = "Engineering";
                }
                else if (hLow.includes("təcrübə")) rec.work_experience = val;
                else if (hLow.includes("ingilis")) rec.english_level = val;
                else if (hLow.includes("excel")) rec.skills.excel = parseInt(val) || 3;
                else if (hLow.includes("sql")) rec.skills.sql = parseInt(val) || 2;
                else if (hLow.includes("python")) rec.skills.python = parseInt(val) || 2;
                else if (hLow.includes("power")) rec.skills.powerbi = parseInt(val) || 2;
                else if (hLow.includes("sektor")) rec.target_sector = val;
                else if (hLow.includes("vəzifə")) rec.target_role = val;
            });

            newRecords.push(rec);
        }

        if (!this.surveyResponses) this.getSurveyData("all");
        this.surveyResponses = [...newRecords, ...this.surveyResponses];

        this.closeSurveyImportModal();
        this.renderUniversityView();

        alert(`✅ Uğurlu İdxal: ${newRecords.length} respondent məlumatı sistemə əlavə edildi və anonimləşdirildi!`);
    }

    exportSurveyAnalyticsCSV() {
        const select = document.getElementById("university-selector");
        const uniId = select ? select.value : "all";
        const responses = this.getSurveyData(uniId);

        let csvContent = "Respondent_ID,Universitet,Ixtisas_Qrupu,Tehsil_Seviyyesi,Tecrube,Ingilis_Dili,Hedef_Sektor,Hedef_Vezife,Demo_Status\n";
        responses.forEach(r => {
            csvContent += `"${r.respondent_id}","${r.university}","${r.field_normalized}","${r.education_level}","${r.work_experience}","${r.english_level}","${r.target_sector}","${r.target_role}","${r.is_demo ? 'DEMO' : 'REAL'}"\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `skillmap_student_survey_export_${uniId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Rəsmi Metodologiya və Mənbələr Bölməsi
     */
    renderMethodologyView() {
        const container = document.getElementById("methodology-sources-list");
        if (!container) return;

        const meta = this.data.methodologySources;
        container.innerHTML = meta.primarySources.map((src, i) => `
            <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">${src.type}</span>
                    <span class="text-slate-400 text-xs font-bold">#0${i + 1}</span>
                </div>
                <h4 class="font-bold text-slate-900 text-sm">${src.name}</h4>
                <p class="text-xs text-slate-600 leading-relaxed">${src.description}</p>
            </div>
        `).join("");
    }

    loadSampleNLP(index) {
        const samples = this.nlpSim.getSampleVacancies();
        if (samples[index]) {
            document.getElementById("nlp-input-text").value = samples[index].text;
            this.runNLPAnalysis();
        }
    }

    runNLPAnalysis() {
        const text = document.getElementById("nlp-input-text").value;
        const res = this.nlpSim.extractSkillsFromText(text);

        const techContainer = document.getElementById("nlp-tech-tags");
        if (res.detectedTechnical.length > 0) {
            techContainer.innerHTML = res.detectedTechnical.map(t => 
                `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <i class="fas fa-code mr-1 text-[10px]"></i>${t.standardName}
                </span>`
            ).join(" ");
        } else {
            techContainer.innerHTML = `<span class="text-xs text-slate-400">Texniki bacarıq tapılmadı</span>`;
        }

        const softContainer = document.getElementById("nlp-soft-tags");
        if (res.detectedSoft.length > 0) {
            softContainer.innerHTML = res.detectedSoft.map(s => 
                `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <i class="fas fa-users mr-1 text-[10px]"></i>${s.standardName}
                </span>`
            ).join(" ");
        } else {
            softContainer.innerHTML = `<span class="text-xs text-slate-400">Soft skill tapılmadı</span>`;
        }

        const langContainer = document.getElementById("nlp-lang-tags");
        let langHtml = res.detectedLanguages.map(l => 
            `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <i class="fas fa-language mr-1 text-[10px]"></i>${l.standardName}
            </span>`
        ).join(" ");

        if (res.extractedExperience) {
            langHtml += ` <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                <i class="fas fa-clock mr-1 text-[10px]"></i>${res.extractedExperience}
            </span>`;
        }
        langContainer.innerHTML = langHtml || `<span class="text-xs text-slate-400">Tələb tapılmadı</span>`;

        const totalFound = res.detectedTechnical.length + res.detectedSoft.length + res.detectedLanguages.length;
        document.getElementById("nlp-detection-count").textContent = `${totalFound} strukturlaşdırılmış meyar çıxarıldı`;
        document.getElementById("nlp-json-output").textContent = JSON.stringify(res.normalizedSkillsJson, null, 2);
    }

    openDataModal() {
        const modal = document.getElementById("data-modal");
        if (modal) {
            modal.classList.remove("hidden");
            modal.style.display = "flex";
        }
    }

    closeDataModal() {
        const modal = document.getElementById("data-modal");
        if (modal) {
            modal.classList.add("hidden");
            modal.style.display = "none";
        }
    }

    exportCurrentData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "skillmap_azerbaijan_data.json");
        dlAnchor.click();
    }

    importCustomData() {
        const text = document.getElementById("import-json-text").value;
        try {
            const parsed = JSON.parse(text);
            this.data = Object.assign(this.data, parsed);
            this.engine = new SkillGapEngine(this.data);
            this.mapModule = new MapModule(this.data);
            window.mapModuleInstance = this.mapModule;
            this.nlpSim = new NLPSimulator(this.data);

            this.init();
            this.closeDataModal();
            alert("Yeni vakansiya və əmək bazarı məlumatları uğurla tətbiq edildi!");
               } catch (e) {
            alert("JSON formatı yanlışdır. Zəhmət olmasa düzgün JSON daxil edin: " + e.message);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    try {
        window.app = new SkillMapApp();
    } catch (err) {
        console.error("Critical error instantiating SkillMapApp:", err);
    }
});

window.switchTab = function(tabId) {
    if (window.app && typeof window.app.switchTab === "function") {
        window.app.switchTab(tabId);
    }
};

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

            if (studentAvatarBadge) studentAvatarBadge.textContent = initials;
            if (studentIdDisplay) studentIdDisplay.textContent = `ID: ${user.studentId || 'AZ-STD-2026'}`;
            if (studentNameBanner) studentNameBanner.textContent = `${user.name} 👋`;
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
            if (studentNameBanner) studentNameBanner.textContent = `Tələbə və Məzun Karyera Kabineti 👋`;
            if (studentAvatarBadge) studentAvatarBadge.textContent = "👤";
            if (studentIdDisplay) studentIdDisplay.textContent = "Giriş Tələb Olunur";
            if (studentMetaBanner) {
                studentMetaBanner.innerHTML = `
                    <span class="bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-500 shadow-2xs"><i class="fas fa-lock text-slate-400 mr-1.5"></i>Şəxsi profilinizi görmək üçün daxil olun</span>
                `;
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
        this.isDemoMode = false;
        this.currentSkills = {};
        this.updateAuthUI();
        this.renderStudentCabinet();
        this.renderLiveVacancies();
        alert("Kabinetdən uğurla çıxış edildi. Şəxsi məlumatlar təmizləndi.");
    }

    toggleCabinetDarkMode(isDark) {
        const root = document.getElementById("student-cabinet-root");
        if (root) {
            if (isDark) root.classList.add("student-cabinet-dark");
            else root.classList.remove("student-cabinet-dark");
        }
    }


    // ========================================================
    // STUDENT CABINET 2.0 METHODS (AUTH-AWARE & SECURE)
    // ========================================================

    renderStudentCabinet() {
        const isLoggedIn = this.auth && this.auth.isLoggedIn();
        const user = isLoggedIn ? this.auth.currentUser : (this.isDemoMode ? this.getDemoUserData() : null);

        const topName = document.getElementById("cab-top-username");
        const topAvatar = document.getElementById("cab-top-avatar");
        const welcomeTitle = document.getElementById("cab-welcome-title");

        if (!user) {
            // ====================================================
            // LOGGED-OUT STATE (GUEST / ANONYMOUS)
            // ====================================================
            if (topName) topName.textContent = "Qonaq";
            if (topAvatar) topAvatar.textContent = "👤";

            if (welcomeTitle) {
                welcomeTitle.textContent = "Xoş Gəlmisiniz! 👋";
            }

            const welcomeDesc = document.querySelector("#cab-view-overview p.text-slate-600");
            if (welcomeDesc) {
                welcomeDesc.textContent = "Fərdi Career Match, Skill Gap analizi və sizə uyğun vakansiyaların uyğunluq dərəcəsini görmək üçün zəhmət olmasa şəxsi kabinetinizə daxil olun və ya qeydiyyatdan keçin.";
            }

            const welcomeBtns = document.querySelector("#cab-view-overview .pt-2.flex.flex-wrap");
            if (welcomeBtns) {
                welcomeBtns.innerHTML = `
                    <button onclick="app.openAuthModal('login')" class="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all">
                        <i class="fas fa-right-to-bracket"></i>
                        <span>Kabinetə Daxil Ol</span>
                    </button>
                    <button onclick="app.openAuthModal('register')" class="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all">
                        <i class="fas fa-user-plus mr-1"></i>Qeydiyyatdan Keç
                    </button>
                    <button onclick="app.loadDemoProfile()" class="px-4 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all">
                        <i class="fas fa-eye mr-1"></i>Demo Rejimini Sına
                    </button>
                `;
            }

            // 5 Top Stat Cards (Logged Out)
            const matchElem = document.getElementById("cab-stat-match");
            if (matchElem) matchElem.textContent = "— %";

            const roleElem = document.getElementById("cab-stat-role");
            if (roleElem) roleElem.textContent = "Seçilməyib";

            const sectorElem = document.getElementById("cab-stat-sector");
            if (sectorElem) sectorElem.textContent = "Giriş tələb olunur";

            const topGapNameElem = document.getElementById("cab-stat-top-gap-name");
            if (topGapNameElem) topGapNameElem.textContent = "—";

            const topGapDescElem = document.getElementById("cab-stat-top-gap-desc");
            if (topGapDescElem) topGapDescElem.textContent = "Profil daxil edilməyib";

            const vacCountElem = document.getElementById("cab-stat-vacancies-count");
            if (vacCountElem) vacCountElem.textContent = `${this.data && this.data.liveVacancies ? this.data.liveVacancies.length : 420}`;

            const altCountElem = document.getElementById("cab-stat-alts-count");
            if (altCountElem) altCountElem.textContent = "—";

            // Row 1: Skill Gap Table (Locked state)
            const tbody = document.getElementById("cab-gap-table-body");
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-10 text-slate-500">
                            <i class="fas fa-lock text-2xl text-slate-300 mb-2 block"></i>
                            <span class="font-bold text-slate-700 block mb-1">Şəxsi Skill Gap Analizi Giriş Tələb Edir</span>
                            <span class="text-xs text-slate-500 block mb-3">Bacarıqlarınızın əmək bazarı ilə müqayisəsini görmək üçün daxil olun.</span>
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="app.openAuthModal('login')" class="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">Daxil Ol</button>
                                <button onclick="app.loadDemoProfile()" class="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">Demo Nümunə</button>
                            </div>
                        </td>
                    </tr>
                `;
            }

            // Row 1: Career Alternatives (Locked state)
            const altsList = document.getElementById("cab-career-alts-list");
            if (altsList) {
                altsList.innerHTML = `
                    <div class="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                        <i class="fas fa-lock text-slate-300 text-xl mb-1.5 block"></i>
                        Fərdi karyera uyğunluq faizləriniz daxil olduqdan sonra hesablanacaq.
                    </div>
                `;
            }

            // Row 2: Matching Vacancies (General list without fake personal match percentages)
            this.renderCabinetGeneralVacancies();

            // Row 2: Development Plan (Locked state)
            const devPlan = document.getElementById("cab-dev-plan-steps");
            if (devPlan) {
                devPlan.innerHTML = `
                    <div class="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                        <i class="fas fa-route text-slate-300 text-xl mb-1.5 block"></i>
                        Fərdi 4 addımlıq inkişaf planı üçün bacarıqlarınızı daxil edin.
                    </div>
                `;
            }

            // Row 3: Skill Passport (Locked state)
            this.renderCabinetPassportCard(null, null, {});

            // Sub-views
            this.populateProfileSubView({ name: "", email: "", university: "UNEC", faculty: "", degree: "Bakalavr", experience_years: 0, englishLevel: "B2" });
            this.renderSkillsSubView({});
            return;
        }

        // ====================================================
        // LOGGED-IN OR DEMO MODE STATE (FULL PERSONALIZED ANALYSIS)
        // ====================================================
        const targetRoleId = user.targetRole || "financial_analyst";
        const currentSkills = user.savedSkills || this.currentSkills || {};

        // Calculate Gap & Career Match
        const matchResult = this.engine.calculateGap(targetRoleId, currentSkills, user);
        this.lastMatchResult = matchResult;

        // 1. Header & Welcome Banner
        if (topName) topName.textContent = user.name || "İstifadəçi";
        
        if (topAvatar) {
            const initials = user.name ? user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "TL";
            topAvatar.textContent = initials;
        }

        if (welcomeTitle) {
            const firstName = user.name ? user.name.split(" ")[0] : "İstifadəçi";
            const demoBadge = this.isDemoMode ? ` <span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">DEMO REJİMİ</span>` : "";
            welcomeTitle.innerHTML = `Salam, ${firstName}! 👋${demoBadge}`;
        }

        const welcomeDesc = document.querySelector("#cab-view-overview p.text-slate-600");
        if (welcomeDesc) {
            welcomeDesc.textContent = "Karyera hədəflərinizə çatmaq üçün bacarıqlarınızı analiz edirik və ən uyğun iş imkanlarını sizin üçün tapırıq.";
        }

        const welcomeBtns = document.querySelector("#cab-view-overview .pt-2.flex.flex-wrap");
        if (welcomeBtns) {
            welcomeBtns.innerHTML = `
                <button onclick="app.openCVUploadModal()" class="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all">
                    <i class="fas fa-file-arrow-up"></i>
                    <span>CV-ni yüklə & ATS Analizi</span>
                </button>
                <button onclick="app.switchCabinetView('profile')" class="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                    <i class="fas fa-sliders mr-1"></i>Hədəfi Dəyiş
                </button>
            `;
        }

        // 2. 5 Top Stat Cards
        const matchElem = document.getElementById("cab-stat-match");
        if (matchElem) matchElem.textContent = `${matchResult.matchPercentage || 74}%`;

        const roleElem = document.getElementById("cab-stat-role");
        if (roleElem) roleElem.textContent = matchResult.role ? matchResult.role.title : "Financial Analyst";

        const sectorElem = document.getElementById("cab-stat-sector");
        if (sectorElem) sectorElem.textContent = matchResult.role ? (matchResult.role.sector + " sektoru") : "Maliyyə və Bank sektoru";

        // Top Skill Gap
        const topGap = (matchResult.topPriorities && matchResult.topPriorities.length > 0) ? matchResult.topPriorities[0] : { skillName: "Power BI", gap: 2 };
        const topGapNameElem = document.getElementById("cab-stat-top-gap-name");
        if (topGapNameElem) topGapNameElem.textContent = topGap.skillName || "Power BI";

        const topGapDescElem = document.getElementById("cab-stat-top-gap-desc");
        if (topGapDescElem) topGapDescElem.textContent = `${topGap.gap || 2} səviyyə fərq var`;

        // Uyğun vakansiyalar count
        const matchingJobs = this.getMatchingVacanciesForUser(currentSkills, targetRoleId);
        const vacCountElem = document.getElementById("cab-stat-vacancies-count");
        if (vacCountElem) vacCountElem.textContent = `${matchingJobs.length || 12}`;

        // Alternativ karyeralar count
        const alts = matchResult.alternativeCareers || [];
        const altCountElem = document.getElementById("cab-stat-alts-count");
        if (altCountElem) altCountElem.textContent = `${alts.length || 3}`;

        // 3. Row 1 Left: Skill Gap Analizi Table (Exact Dual Bars)
        this.renderCabinetGapTable(matchResult, currentSkills);

        // 4. Row 1 Right: Mənə Uyğun Karyera İstiqamətləri (Progress Bars)
        this.renderCabinetCareerAlternatives(matchResult, targetRoleId);

        // 5. Row 2 Left: Mənə Uyğun Vakansiyalar (Cards with Real Logos)
        this.renderCabinetMatchingVacancies(matchingJobs);

        // 6. Row 2 Right: İnkişaf Planım (Numbered Timeline Steps)
        this.renderCabinetDevelopmentPlan(matchResult);

        // 7. Row 3: Skill Passport Card
        this.renderCabinetPassportCard(user, matchResult, currentSkills);

        // Render Sub-views as well
        this.populateProfileSubView(user);
        this.renderSkillsSubView(currentSkills);
        this.renderATSAnalysisSubView(user, targetRoleId);
        this.renderCVBuilderSubView(user, targetRoleId);
    }

    getDemoUserData() {
        return {
            name: "Əli Ömərli (Demo)",
            email: "ali.demo@unec.edu.az",
            university: "UNEC",
            faculty: "Maliyyə və İqtisadiyyat",
            degree: "Bakalavr",
            experience_years: 1,
            employmentStatus: "Tələbə / Təcrübəçi",
            englishLevel: "B2",
            targetRole: "financial_analyst",
            studentId: "AZ-DEMO-2026-8492",
            savedSkills: {
                "excel": 4,
                "financial_analysis": 4,
                "sql": 2,
                "powerbi": 1,
                "financial_modeling": 2,
                "presentation_skills": 4
            }
        };
    }

    loadDemoProfile() {
        this.isDemoMode = true;
        this.currentSkills = {
            "excel": 4,
            "financial_analysis": 4,
            "sql": 2,
            "powerbi": 1,
            "financial_modeling": 2,
            "presentation_skills": 4
        };
        this.renderStudentCabinet();
        this.renderLiveVacancies();
        alert("Demo Rejimi aktivləşdirildi. Siz nümunə tələbə profilinin analitikasını görürsünüz.");
    }

    renderCabinetGeneralVacancies() {
        const container = document.getElementById("cab-matching-vacancies-list");
        if (!container) return;
        container.innerHTML = "";

        const vacancies = (this.data && this.data.liveVacancies) ? this.data.liveVacancies.slice(0, 4) : [];
        vacancies.forEach(job => {
            const div = document.createElement("div");
            div.className = "p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all";
            
            const compInitials = (job.company || "PB").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "VK";
            const skillsList = job.skills ? job.skills.slice(0, 3) : ["Excel", "Analitika"];

            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                        ${compInitials}
                    </div>
                    <div class="space-y-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-slate-900 text-xs">${job.title}</h4>
                            <span class="text-[10px] text-slate-400 font-normal">📍 ${job.location || "Bakı"}</span>
                        </div>
                        <div class="text-[11px] text-slate-500">${job.company}</div>
                        <div class="flex flex-wrap gap-1 pt-0.5">
                            ${skillsList.map(s => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">${s}</span>`).join("")}
                        </div>
                    </div>
                </div>

                <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                    <button onclick="app.openAuthModal('login')" class="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[11px] font-bold transition-all">
                        <i class="fas fa-lock text-[9px] text-slate-400 mr-1"></i>Uyğunluq üçün daxil olun
                    </button>
                    <a href="${job.source_url || job.url || 'https://jobsearch.az'}" target="_blank" class="px-3.5 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-[11px] transition-all">
                        Vakansiyaya bax
                    </a>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderCabinetGapTable(result, currentSkills) {
        const tbody = document.getElementById("cab-gap-table-body");
        if (!tbody) return;
        tbody.innerHTML = "";

        const breakdown = (result.breakdown && result.breakdown.length > 0) ? result.breakdown : [
            { skillName: "Excel", userLevel: 4, requiredLevel: 4, gap: 0, status: "good" },
            { skillName: "Financial Analysis", userLevel: 4, requiredLevel: 4, gap: 0, status: "good" },
            { skillName: "SQL", userLevel: 2, requiredLevel: 4, gap: 2, status: "high" },
            { skillName: "Power BI", userLevel: 1, requiredLevel: 3, gap: 2, status: "high" },
            { skillName: "Financial Modeling", userLevel: 2, requiredLevel: 3, gap: 1, status: "medium" },
            { skillName: "Presentation Skills", userLevel: 4, requiredLevel: 3, gap: 0, status: "good" }
        ];

        breakdown.slice(0, 6).forEach(item => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50/80 transition-colors";

            let userBarColor = "#10b981"; // green
            if (item.gap === 1) userBarColor = "#f59e0b"; // orange
            else if (item.gap >= 2) userBarColor = "#ef4444"; // red

            let statusBadge = "";
            if (item.gap <= 0) {
                statusBadge = `<span class="inline-flex items-center gap-1 font-bold text-emerald-700"><i class="fas fa-circle-check text-emerald-500"></i> Güclü</span>`;
            } else if (item.gap === 1) {
                statusBadge = `<span class="inline-flex items-center gap-1 font-bold text-amber-700"><i class="fas fa-circle-exclamation text-amber-500"></i> Orta</span>`;
            } else {
                statusBadge = `<span class="inline-flex items-center gap-1 font-bold text-rose-700"><i class="fas fa-circle-xmark text-rose-500"></i> Yüksək</span>`;
            }

            const userPct = Math.min(100, Math.round((item.userLevel / 5) * 100));
            const marketPct = Math.min(100, Math.round((item.requiredLevel / 5) * 100));

            tr.innerHTML = `
                <td class="py-2.5 font-bold text-slate-800">${item.skillName}</td>
                <td class="py-2.5">
                    <div class="dual-bar-container">
                        <span class="text-[11px] font-bold text-slate-700">${item.userLevel}/5</span>
                        <div class="dual-bar-track">
                            <div class="dual-bar-fill" style="width: ${userPct}%; background-color: ${userBarColor};"></div>
                        </div>
                    </div>
                </td>
                <td class="py-2.5">
                    <div class="dual-bar-container">
                        <span class="text-[11px] font-bold text-slate-700">${item.requiredLevel}/5</span>
                        <div class="dual-bar-track">
                            <div class="dual-bar-fill" style="width: ${marketPct}%; background-color: #2563eb;"></div>
                        </div>
                    </div>
                </td>
                <td class="py-2.5 text-center font-bold ${item.gap > 0 ? 'text-slate-800' : 'text-slate-500'}">
                    ${item.gap}
                </td>
                <td class="py-2.5 text-right text-[11px]">
                    ${statusBadge}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderCabinetCareerAlternatives(result, currentRoleId) {
        const container = document.getElementById("cab-career-alts-list");
        if (!container) return;
        container.innerHTML = "";

        const defaultAlts = [
            { title: "Financial Analyst", matchScore: 81, color: "bg-emerald-500" },
            { title: "Business Analyst", matchScore: 76, color: "bg-emerald-500" },
            { title: "Accountant", matchScore: 73, color: "bg-emerald-500" },
            { title: "Data Analyst", matchScore: 61, color: "bg-amber-500" },
            { title: "Investment Analyst", matchScore: 58, color: "bg-amber-500" }
        ];

        const alts = (result && result.alternativeCareers && result.alternativeCareers.length > 0)
            ? result.alternativeCareers.map(a => ({
                title: a.roleTitle || a.title,
                matchScore: a.matchPercentage || a.matchScore || 70,
                color: (a.matchPercentage || a.matchScore) >= 70 ? "bg-emerald-500" : "bg-amber-500"
            }))
            : defaultAlts;

        alts.slice(0, 5).forEach(alt => {
            const div = document.createElement("div");
            div.className = "space-y-1.5";
            div.innerHTML = `
                <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>${alt.title}</span>
                    <span class="text-slate-900 font-black">${alt.matchScore}%</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${alt.color} rounded-full" style="width: ${alt.matchScore}%;"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    getMatchingVacanciesForUser(userSkills, targetRoleId) {
        const vacancies = (this.data && this.data.liveVacancies) ? this.data.liveVacancies : [];
        const roleBenchmark = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === targetRoleId) : null;
        const targetTitle = roleBenchmark ? roleBenchmark.title.toLowerCase() : "financial";

        return vacancies.filter(v => {
            const t = (v.title || "").toLowerCase();
            const s = (v.sector || "").toLowerCase();
            return t.includes("analyst") || t.includes("financial") || t.includes("maliyyə") || s.includes("maliyyə") || s.includes("bank");
        }).slice(0, 4);
    }

    renderCabinetMatchingVacancies(matchingJobs) {
        const container = document.getElementById("cab-matching-vacancies-list");
        if (!container) return;
        container.innerHTML = "";

        const mockDefaults = [
            { title: "Financial Analyst", company: "PAŞA Bank", location: "Bakı", matchScore: 87, skills: ["Excel", "Financial Analysis", "English"], logoBg: "bg-emerald-700", logoText: "PB", url: "https://jobsearch.az" },
            { title: "Junior Financial Analyst", company: "ABB", location: "Bakı", matchScore: 82, skills: ["Excel", "Financial Analysis", "Power BI"], logoBg: "bg-blue-800", logoText: "ABB", url: "https://jobsearch.az" },
            { title: "Financial Analyst", company: "Kapital Bank", location: "Bakı", matchScore: 78, skills: ["Excel", "SQL", "Financial Analysis"], logoBg: "bg-rose-700", logoText: "KB", url: "https://jobsearch.az" },
            { title: "Business Analyst", company: "Azər Türk Bank", location: "Bakı", matchScore: 74, skills: ["Excel", "SQL", "Power BI"], logoBg: "bg-amber-700", logoText: "ATB", url: "https://jobsearch.az" }
        ];

        const jobsToRender = (matchingJobs && matchingJobs.length >= 4) ? matchingJobs.map((j, i) => ({
            title: j.title || "Financial Analyst",
            company: j.company || "PAŞA Bank",
            location: j.location || "Bakı",
            matchScore: Math.max(70, 88 - i * 4),
            skills: j.required_skills ? j.required_skills.slice(0, 3) : ["Excel", "SQL", "Analitika"],
            logoBg: i % 2 === 0 ? "bg-blue-900" : "bg-emerald-800",
            logoText: (j.company || "PB").slice(0, 3).toUpperCase(),
            url: j.source_url || j.url || "https://jobsearch.az"
        })) : mockDefaults;

        jobsToRender.forEach(job => {
            const div = document.createElement("div");
            div.className = "p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all";
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${job.logoBg} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                        ${job.logoText}
                    </div>
                    <div class="space-y-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-slate-900 text-xs">${job.title}</h4>
                            <span class="text-[10px] text-slate-400 font-normal">📍 ${job.location}</span>
                        </div>
                        <div class="text-[11px] text-slate-500">${job.company}</div>
                        <div class="flex flex-wrap gap-1 pt-0.5">
                            ${job.skills.map(s => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">${s}</span>`).join("")}
                            <span class="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px]">+2</span>
                        </div>
                    </div>
                </div>

                <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                    <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                        ${job.matchScore}% uyğunluq
                    </span>
                    <a href="${job.url}" target="_blank" class="px-3.5 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-[11px] transition-all">
                        Vakansiyaya bax
                    </a>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderCabinetDevelopmentPlan(result) {
        const container = document.getElementById("cab-dev-plan-steps");
        if (!container) return;
        container.innerHTML = "";

        const steps = [
            { num: 1, title: "SQL (Basic ➔ Intermediate)", desc: "Təxmini müddət: 4 həftə", priority: "Yüksək prioritet", circleColor: "bg-rose-500", tagColor: "bg-rose-50 text-rose-700 border-rose-200" },
            { num: 2, title: "Power BI", desc: "Təxmini müddət: 4-6 həftə", priority: "Yüksək prioritet", circleColor: "bg-rose-500", tagColor: "bg-rose-50 text-rose-700 border-rose-200" },
            { num: 3, title: "Financial Modeling", desc: "Təxmini müddət: 6-8 həftə", priority: "Orta prioritet", circleColor: "bg-amber-500", tagColor: "bg-amber-50 text-amber-700 border-amber-200" },
            { num: 4, title: "Advanced Excel", desc: "Təxmini müddət: 4 həftə", priority: "Aşağı prioritet", circleColor: "bg-blue-500", tagColor: "bg-blue-50 text-blue-700 border-blue-200" }
        ];

        steps.forEach(step => {
            const div = document.createElement("div");
            div.className = "flex items-start gap-3 text-xs";
            div.innerHTML = `
                <div class="w-6 h-6 rounded-full ${step.circleColor} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    ${step.num}
                </div>
                <div class="flex-grow space-y-0.5">
                    <div class="flex items-center justify-between">
                        <div class="font-bold text-slate-900">${step.title}</div>
                        <span class="px-2 py-0.5 rounded-full border ${step.tagColor} text-[10px] font-bold">${step.priority}</span>
                    </div>
                    <p class="text-[11px] text-slate-500">${step.desc}</p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderCabinetPassportCard(user, matchResult, currentSkills) {
        const passAvatar = document.getElementById("cab-pass-avatar");
        const passName = document.getElementById("cab-pass-name");
        const passUni = document.getElementById("cab-pass-uni");
        const passRole = document.getElementById("cab-pass-role");
        const passMatch = document.getElementById("cab-pass-match");
        const grid = document.getElementById("cab-pass-skills-grid");

        if (!user) {
            if (passName) passName.textContent = "Qonaq İstifadəçi";
            if (passAvatar) passAvatar.textContent = "👤";
            if (passUni) passUni.textContent = "Giriş tələb olunur";
            if (passRole) passRole.textContent = "Hədəf vəzifə: Seçilməyib";
            if (passMatch) passMatch.textContent = "Career Match: — %";
            if (grid) grid.innerHTML = `<div class="col-span-2 p-3 text-center text-xs text-slate-400 italic">Skill Pasportu təsdiqlənmiş profil üçün aktivləşir.</div>`;
            return;
        }

        if (passName) passName.textContent = user.name || "Əli Ömərli";
        if (passAvatar) passAvatar.textContent = user.name ? user.name.split(" ").map(p => p[0]).join("").slice(0, 2) : "ƏÖ";
        if (passUni) passUni.textContent = `${user.university || "UNEC"} · ${user.faculty || "Maliyyə ixtisası"}`;
        if (passRole) passRole.textContent = `Hədəf vəzifə: ${matchResult && matchResult.role ? matchResult.role.title : "Financial Analyst"}`;
        if (passMatch) passMatch.textContent = `Career Match: ${matchResult && matchResult.matchPercentage ? matchResult.matchPercentage : 74}%`;

        if (grid) {
            grid.innerHTML = "";
            const sampleSkills = [
                { name: "Excel", level: 4 },
                { name: "Financial Analysis", level: 4 },
                { name: "SQL", level: 2 },
                { name: "Power BI", level: 1 },
                { name: "Financial Modeling", level: 2 },
                { name: "Presentation Skills", level: 4 }
            ];

            sampleSkills.forEach(s => {
                const box = document.createElement("div");
                box.className = "flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs";
                box.innerHTML = `
                    <span class="font-bold text-slate-700 truncate">${s.name}</span>
                    <span class="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">${s.level}/5</span>
                `;
                grid.appendChild(box);
            });
        }
    }

    switchCabinetView(viewName) {
        const viewIds = [
            "overview", "profile", "skills", "skill-gap", "vacancies", 
            "career-directions", "dev-plan", "skill-passport", "cv-ats", "cv-builder", "settings"
        ];

        viewIds.forEach(v => {
            const el = document.getElementById(`cab-view-${v}`);
            if (el) el.classList.add("hidden");

            const btn = document.getElementById(`cab-nav-${v}`);
            if (btn) btn.classList.remove("active");
        });

        const activeEl = document.getElementById(`cab-view-${viewName}`);
        if (activeEl) activeEl.classList.remove("hidden");

        const activeBtn = document.getElementById(`cab-nav-${viewName}`);
        if (activeBtn) activeBtn.classList.add("active");

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    openCVUploadModal() {
        const modal = document.getElementById("modal-cv-upload");
        if (modal) modal.style.display = "flex";
    }

    closeCVUploadModal() {
        const modal = document.getElementById("modal-cv-upload");
        if (modal) modal.style.display = "none";
    }

    async handleCVFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
            const parsed = await window.cvParser.parseFile(file);
            this.pendingParsedCV = parsed;
            this.closeCVUploadModal();
            this.showCVConfirmationModal(parsed);
        } catch (e) {
            alert("CV oxunarkən xəta baş verdi: " + e.message);
        }
    }

    parsePastedCVText() {
        const text = document.getElementById("cv-text-paste").value;
        if (!text || text.trim().length < 20) {
            alert("Zəhmət olmasa ən azı bir neçə cümləlik CV mətni daxil edin.");
            return;
        }

        const parsed = window.cvParser.parseRawText(text, "Pasted_CV_Text");
        this.pendingParsedCV = parsed;
        this.closeCVUploadModal();
        this.showCVConfirmationModal(parsed);
    }

    showCVConfirmationModal(parsed) {
        const modal = document.getElementById("modal-cv-confirm");
        if (!modal) return;

        document.getElementById("confirm-confidence-score").textContent = `${parsed.confidenceScore}%`;
        document.getElementById("confirm-file-name").textContent = parsed.fileName || "CV Faylı";
        document.getElementById("confirm-name").textContent = parsed.personalInfo.name || "Namizəd";
        document.getElementById("confirm-contact").textContent = `${parsed.personalInfo.email} · ${parsed.personalInfo.phone}`;
        document.getElementById("confirm-edu").textContent = `${parsed.education.university} · ${parsed.education.field}`;
        document.getElementById("confirm-exp").textContent = `${parsed.experience.totalYears} il (${parsed.experience.employmentStatus})`;

        const tagsContainer = document.getElementById("confirm-skills-tags");
        if (tagsContainer) {
            tagsContainer.innerHTML = "";
            Object.entries(parsed.skills || {}).forEach(([id, s]) => {
                const tag = document.createElement("span");
                tag.className = "px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center gap-1";
                tag.innerHTML = `<span>${s.name}</span><span class="text-blue-500 font-black">(${s.level}/5)</span>`;
                tagsContainer.appendChild(tag);
            });
        }

        modal.style.display = "flex";
    }

    confirmExtractedCV() {
        if (!this.pendingParsedCV) return;
        this.auth.saveParsedCV(this.pendingParsedCV);
        document.getElementById("modal-cv-confirm").style.display = "none";
        
        alert("CV məlumatlarınız və bacarıqlarınız profilinizə uğurla inteqrasiya edildi!");
        this.renderStudentCabinet();
        this.switchCabinetView("cv-ats");
    }

    populateProfileSubView(user) {
        const nameInput = document.getElementById("prof-input-name");
        const emailInput = document.getElementById("prof-input-email");
        const uniInput = document.getElementById("prof-input-uni");
        const facultyInput = document.getElementById("prof-input-faculty");
        const degreeInput = document.getElementById("prof-input-degree");
        const expInput = document.getElementById("prof-input-exp");
        const englishInput = document.getElementById("prof-input-english");
        const roleInput = document.getElementById("prof-input-role");

        if (nameInput) nameInput.value = user.name || "";
        if (emailInput) emailInput.value = user.email || "";
        if (uniInput) uniInput.value = user.university || "UNEC";
        if (facultyInput) facultyInput.value = user.faculty || "";
        if (degreeInput) degreeInput.value = user.degree || "Bakalavr";
        if (expInput) expInput.value = user.experience_years !== undefined ? user.experience_years : 0;
        if (englishInput) englishInput.value = user.englishLevel || "B2";

        if (roleInput && this.data && this.data.jobRolesBenchmark) {
            roleInput.innerHTML = "";
            this.data.jobRolesBenchmark.forEach(r => {
                const opt = document.createElement("option");
                opt.value = r.id;
                opt.textContent = `${r.title} (${r.sector})`;
                if (r.id === user.targetRole) opt.selected = true;
                roleInput.appendChild(opt);
            });
        }
    }

    saveProfileChanges() {
        const updated = {
            name: document.getElementById("prof-input-name")?.value || "Əli Ömərli",
            email: document.getElementById("prof-input-email")?.value || "ali.omarli@example.com",
            university: document.getElementById("prof-input-uni")?.value || "UNEC",
            faculty: document.getElementById("prof-input-faculty")?.value || "Maliyyə və İqtisadiyyat",
            degree: document.getElementById("prof-input-degree")?.value || "Bakalavr",
            experience_years: parseInt(document.getElementById("prof-input-exp")?.value, 10) || 0,
            englishLevel: document.getElementById("prof-input-english")?.value || "B2",
            targetRole: document.getElementById("prof-input-role")?.value || "financial_analyst"
        };

        this.auth.updateProfile(updated);
        alert("Profil məlumatlarınız yadda saxlanıldı və Karyera Uyğunluğu yenidən hesablandı!");
        this.renderStudentCabinet();
        this.switchCabinetView("overview");
    }

    renderSkillsSubView(skills) {
        const container = document.getElementById("cab-full-skills-list");
        if (!container) return;
        container.innerHTML = "";

        if (!skills || Object.keys(skills).length === 0) {
            container.innerHTML = `<div class="col-span-full p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">Bacarıqlar siyahısı boşdur. Yeni bacarıq əlavə edin və ya CV yükləyin.</div>`;
            return;
        }

        const skillNames = {
            "excel": "Excel",
            "financial_analysis": "Financial Analysis",
            "sql": "SQL",
            "powerbi": "Power BI",
            "financial_modeling": "Financial Modeling",
            "presentation_skills": "Presentation Skills",
            "python": "Python",
            "accounting_1c": "1C Mühasibat 8.3",
            "accounting": "Mühasibat və IFRS",
            "analytical_thinking": "Analytical Thinking",
            "english": "English"
        };

        Object.entries(skills).forEach(([sId, val]) => {
            const level = typeof val === "object" ? val.level : (val > 5 ? Math.round(val / 20) : val);
            const name = skillNames[sId] || sId;
            const source = (this.auth.currentUser && this.auth.currentUser.skillSources && this.auth.currentUser.skillSources[sId]) || "user-added";

            const card = document.createElement("div");
            card.className = "p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3";
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-bold text-slate-900 text-xs">${name}</div>
                        <span class="text-[10px] text-slate-400">Mənbə: ${source === 'cv-derived' ? '📄 CV-dən çıxarılmış' : '👤 İstifadəçi əlavə edib'}</span>
                    </div>
                    <span class="font-bold text-blue-600 text-xs" id="cab-skill-val-${sId}">${level}/5</span>
                </div>
                <input type="range" min="1" max="5" value="${level}" oninput="app.updateUserSkillSlider('${sId}', this.value)" class="w-full">
            `;
            container.appendChild(card);
        });
    }

    updateUserSkillSlider(skillId, val) {
        const v = parseInt(val, 10);
        const badge = document.getElementById(`cab-skill-val-${skillId}`);
        if (badge) badge.textContent = `${v}/5`;

        this.auth.setSkill(skillId, v);
        this.renderStudentCabinet();
    }

    openAddSkillModal() {
        const m = document.getElementById("modal-add-skill");
        if (m) m.style.display = "flex";
    }

    saveNewSkill() {
        const select = document.getElementById("new-skill-select");
        const range = document.getElementById("new-skill-level-range");
        if (!select || !range) return;

        const sId = select.value;
        const level = parseInt(range.value, 10);

        this.auth.setSkill(sId, level, "user-added");
        document.getElementById("modal-add-skill").style.display = "none";
        
        alert("Yeni bacarıq uğurla əlavə olundu!");
        this.renderStudentCabinet();
    }

    renderATSAnalysisSubView(user, targetRoleId) {
        const container = document.getElementById("cab-ats-results-container");
        if (!container) return;

        const parsedCV = (user && user.uploadedCV) || (window.cvParser ? window.cvParser.parseRawText("", "Sample") : null);
        const atsResult = window.atsEngine ? window.atsEngine.evaluateCV(parsedCV, targetRoleId) : { overallScore: 78, targetRoleTitle: "Financial Analyst", status: "Yaxşı", matchedSkills: [], missingSkills: [], recommendations: [] };

        container.innerHTML = `
            <div class="space-y-6">
                <div class="p-6 rounded-3xl bg-gradient-to-tr from-blue-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div class="space-y-1 text-center md:text-left">
                        <span class="text-xs uppercase font-bold text-blue-300">ATS Uyğunluq Göstəricisi</span>
                        <div class="text-3xl font-black">${atsResult.targetRoleTitle} vəzifəsi üzrə</div>
                        <p class="text-xs text-slate-300">${atsResult.status}</p>
                    </div>
                    <div class="w-24 h-24 rounded-full border-4 border-emerald-400 flex items-center justify-center text-3xl font-black text-emerald-300 shadow-inner">
                        ${atsResult.overallScore}%
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                        <div class="font-bold text-emerald-900 text-xs flex items-center gap-2">
                            <i class="fas fa-check-circle text-emerald-600"></i>Uyğun Gələn Açar Sözlər və Bacarıqlar
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                            ${atsResult.matchedSkills.map(s => `<span class="px-2 py-1 rounded bg-white text-emerald-800 text-[11px] font-bold border border-emerald-200">${s.name} ✓</span>`).join("")}
                        </div>
                    </div>

                    <div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                        <div class="font-bold text-rose-900 text-xs flex items-center gap-2">
                            <i class="fas fa-circle-exclamation text-rose-600"></i>Çatışmayan Bazar Bacarıqları
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                            ${atsResult.missingSkills.map(s => `<span class="px-2 py-1 rounded bg-white text-rose-800 text-[11px] font-bold border border-rose-200">${s.name} ✗</span>`).join("")}
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="font-bold text-slate-900 text-xs uppercase tracking-wider">ATS Tövsiyələri:</div>
                    <div class="space-y-2">
                        ${atsResult.recommendations.map(r => `
                            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                                <i class="fas fa-lightbulb text-amber-500 mt-0.5 flex-shrink-0"></i>
                                <span>${r.text}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    renderCVBuilderSubView(user, targetRoleId) {
        const preview = document.getElementById("cab-cv-builder-preview");
        if (!preview) return;

        const roleBenchmark = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === targetRoleId) : null;
        const roleTitle = roleBenchmark ? roleBenchmark.title : "Financial Analyst";

        preview.innerHTML = `
            <div class="space-y-3">
                <div class="text-center pb-3 border-b border-slate-200">
                    <div class="font-bold text-base text-slate-900">${(user && user.name) || "Əli Ömərli"}</div>
                    <div class="text-xs text-blue-600 font-semibold">${roleTitle}</div>
                    <div class="text-[11px] text-slate-500">${(user && user.email) || "ali@example.com"} • +994 50 123 45 67 • Bakı, Azərbaycan</div>
                </div>
                <div>
                    <div class="font-bold text-xs uppercase text-slate-800">Təhsil:</div>
                    <div class="text-xs text-slate-600">${(user && user.university) || "UNEC"} — ${(user && user.degree) || "Bakalavr"}, ${(user && user.faculty) || "Maliyyə"} (2026)</div>
                </div>
                <div>
                    <div class="font-bold text-xs uppercase text-slate-800">Bacarıqlar:</div>
                    <div class="text-xs text-slate-600">${Object.entries((user && user.savedSkills) || {}).map(([k, v]) => `${k} (${v}/5)`).join(" • ")}</div>
                </div>
            </div>
        `;
    }

    downloadBuiltCV(lang = "az") {
        const user = (this.auth && this.auth.isLoggedIn()) ? this.auth.currentUser : (this.isDemoMode ? this.getDemoUserData() : { name: "Əli Ömərli", email: "ali.omarli@example.com" });
        const roleBenchmark = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === user.targetRole) : null;
        const roleTitle = roleBenchmark ? roleBenchmark.title : "Financial Analyst";

        if (window.cvBuilder) {
            window.cvBuilder.downloadCV(user, lang, roleTitle);
        }
    }

    exportSkillPassport() {
        const user = (this.auth && this.auth.isLoggedIn()) ? this.auth.currentUser : (this.isDemoMode ? this.getDemoUserData() : { name: "Əli Ömərli", university: "UNEC", studentId: "AZ-UNEC-2026-8492" });
        if (window.skillPassportGenerator) {
            window.skillPassportGenerator.exportPassportPDF(user, this.lastMatchResult);
        }
    }

    deleteUserCV() {
        if (confirm("CV faylınızı və ona bağlı məlumatları silmək istədiyinizə əminsiniz?")) {
            this.auth.deleteCV();
            alert("CV məlumatlarınız sistemdən uğurla silindi.");
            this.renderStudentCabinet();
        }
    }

    handleLogout() {
        this.auth.logout();
        this.isDemoMode = false;
        this.currentSkills = {};
        this.updateAuthUI();
        this.renderStudentCabinet();
        this.renderLiveVacancies();
        alert("Kabinetdən uğurla çıxış edildi. Şəxsi məlumatlar təmizləndi.");
    }

    toggleCabinetDarkMode(isDark) {
        const root = document.getElementById("student-cabinet-root");
        if (root) {
            if (isDark) root.classList.add("student-cabinet-dark");
            else root.classList.remove("student-cabinet-dark");
        }
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

        const isLoggedIn = (this.auth && this.auth.isLoggedIn()) || this.isDemoMode;
        const userSkills = (this.auth && this.auth.isLoggedIn() && this.auth.currentUser) ? this.auth.currentUser.savedSkills : this.currentSkills;

        container.innerHTML = filtered.map(vac => {
            let matchBadgeHtml = "";
            let matchingSkillIds = [];

            if (isLoggedIn && userSkills && Object.keys(userSkills).length > 0) {
                const matchInfo = this.engine.calculateVacancyMatch(vac, userSkills);
                matchingSkillIds = (matchInfo.matchingSkills || []).map(ms => (ms.id || ms.name || "").toLowerCase());
                
                let badgeBg = "bg-amber-100 text-amber-800 border-amber-200";
                if (matchInfo.matchScore >= 75) badgeBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                else if (matchInfo.matchScore < 45) badgeBg = "bg-rose-100 text-rose-800 border-rose-200";

                matchBadgeHtml = `
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${badgeBg} shadow-2xs">
                        <i class="fas fa-bolt mr-1 text-[10px]"></i>${matchInfo.matchScore}% Uyğun
                    </span>
                `;
            } else {
                matchBadgeHtml = `
                    <button onclick="app.openAuthModal('login')" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 shadow-2xs transition-all" title="Fərdi uyğunluq faizinizi görmək üçün daxil olun">
                        <i class="fas fa-lock text-[9px] text-slate-400"></i>Uyğunluq üçün daxil olun
                    </button>
                `;
            }

            // Required vs Preferred skills
            const reqSkills = vac.required_skills || [];
            const prefSkills = vac.preferred_skills || [];
            const allSkills = vac.skills || [];

            let tagsHtml = "";
            if (allSkills.length > 0) {
                tagsHtml = allSkills.map(s => {
                    const sLower = s.toLowerCase();
                    const isReq = reqSkills.includes(s);
                    const isPref = prefSkills.includes(s);
                    const isMatching = isLoggedIn && matchingSkillIds.some(ms => ms === sLower);

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
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pillClass}">
                            ${isMatching ? '✓ ' : ''}${labelPrefix}${s}
                        </span>
                    `;
                }).join(" ");
            } else {
                tagsHtml = `<span class="text-[11px] text-slate-400 italic">Vakansiya mətnində xüsusi bacarıq tələbi qeyd olunmayıb</span>`;
            }

            const qScore = vac.data_quality_score !== undefined ? vac.data_quality_score : 50;
            let qBadgeColor = "bg-slate-100 text-slate-600";
            if (qScore >= 70) qBadgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
            else if (qScore < 40) qBadgeColor = "bg-amber-50 text-amber-700 border border-amber-200";

            const expText = vac.extracted_experience ? vac.extracted_experience.raw : (vac.experience || "Qeyd olunmayıb");
            const eduText = vac.extracted_education ? vac.extracted_education.display : (vac.education || "Qeyd olunmayıb");
            const langs = vac.extracted_languages || [];
            const langPills = langs.map(l => `<span class="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-medium"><i class="fas fa-language mr-1"></i>${l.language_az || l.language} (${l.level})</span>`).join(" ");

            const compName = vac.company || "Açıq Vakansiya";
            const compInitials = compName.split(" ").map(w => w.charAt(0)).join("").toUpperCase().slice(0, 2) || "VK";

            return `
                <div class="job-card flex flex-col justify-between space-y-3.5 group">
                    <div>
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
                                ${matchBadgeHtml}
                                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${qBadgeColor}" title="Data Tamlığı və Keyfiyyət İndeksi">
                                    Keyfiyyət: ${qScore}/100
                                </span>
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mb-3">
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-building text-slate-400 mr-1"></i>${vac.sector}</span>
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-location-dot text-slate-400 mr-1"></i>${vac.location}</span>
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-briefcase text-slate-400 mr-1"></i>${expText}</span>
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-graduation-cap text-slate-400 mr-1"></i>${eduText}</span>
                            ${langPills}
                        </div>

                        <div class="space-y-1.5">
                            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tələb Olunan Bacarıqlar:</span>
                            <div class="flex flex-wrap gap-1">
                                ${tagsHtml}
                            </div>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span class="text-[10px] text-slate-400"><i class="fas fa-clock mr-1"></i>${vac.posted_date || "Aktiv elan"}</span>
                        <a href="${vac.source_url || 'https://jobsearch.az'}" target="_blank" class="px-4 py-1.5 rounded-full btn-saas-outline text-indigo-600 hover:text-indigo-700 font-bold text-xs shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center gap-1.5">
                            <span>Müraciət Et</span>
                            <i class="fas fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join("");
    }

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

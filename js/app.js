// ========================================================
// 4-STEP REGISTRATION WIZARD (UI STEP SWITCHER)
// ========================================================
function switchRegStep(step) {
    const stepIds = ['reg-step-1', 'reg-step-2', 'reg-step-3', 'reg-step-4', 'reg-step-success'];
    const targetId = (step === 'success' || step === 5) ? 'reg-step-success' : `reg-step-${step}`;
    
    stepIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === targetId) {
                el.style.display = 'block';
                el.classList.remove('hidden');
            } else {
                el.style.display = 'none';
                el.classList.add('hidden');
            }
        }
    });
}
window.switchRegStep = switchRegStep;

class SkillMapApp {
    constructor() {
        this.data = (typeof window !== "undefined" && window.SkillMapData) 
            ? window.SkillMapData 
            : (typeof SkillMapData !== "undefined" ? SkillMapData : {});
        this.auth = new AuthManager();
        this.engine = new SkillGapEngine(this.data);
        this.topEmployersModule = typeof TopEmployersModule !== "undefined" ? new TopEmployersModule(this.data) : null;
        if (this.topEmployersModule) window.topEmployersModuleInstance = this.topEmployersModule;
        this.nlpSim = typeof NLPSimulator !== "undefined" ? new NLPSimulator(this.data) : null;
        this.admin = (typeof AdminModule !== "undefined")
            ? new AdminModule()
            : ((typeof window !== "undefined" && window.AdminModule) ? new window.AdminModule() : null);

        this.currentLang = "az";
        this.currentSkills = {};
        this.vacancyCurrentPage = 1;
        this.vacancyPageSize = 24;
        this.selectedVacancySector = 'all';
        this.charts = {};

        this.init();
    }

    init() {
        this.initCabinetNavListeners();
        try { this.renderOverviewStats(); } catch (e) { console.error("Error in renderOverviewStats:", e); }
        try { this.populateRolesDropdown(); } catch (e) { console.error("Error in populateRolesDropdown:", e); }
        try { this.handleRoleChange(); } catch (e) { console.error("Error in handleRoleChange:", e); }
        try { this.updateAuthUI(); } catch (e) { console.error("Error in updateAuthUI:", e); }
        try { this.renderStudentCabinet(); } catch (e) { console.error("Error in renderStudentCabinet:", e); }

        try {
            this.renderTopEmployers();
        } catch (e) { console.error("Error in renderTopEmployers:", e); }

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
            const initials = user.name ? user.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2) : "TL";

            if (authContainer) {
                authContainer.innerHTML = `
                    <div class="flex items-center gap-1.5">
                        <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 cursor-pointer shadow-2xs hover:bg-indigo-100/60 transition-all" onclick="app.switchTab('student-gap')">
                            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                                ${initials}
                            </div>
                            <div class="text-left hidden sm:block">
                                <div class="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">${user.name}</div>
                            </div>
                        </div>
                        <button onclick="app.handleLogout()" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors" title="Çıxış Et">
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
                    <button onclick="app.openAuthModal('login')" class="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap">
                        <i class="fas fa-user-lock text-[10px]"></i>
                        <span>Kabinetə Giriş</span>
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
        const wizard = document.getElementById("wizard-register");

        this.hideAuthError();

        if (mode === 'register') {
            if (regBtn) regBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-900 bg-white shadow-sm transition-all";
            if (loginBtn) loginBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 transition-all";
            if (loginForm) {
                loginForm.classList.add("hidden");
                loginForm.style.display = "none";
            }
            if (regForm) {
                regForm.classList.add("hidden");
                regForm.style.display = "none";
            }
            if (wizard) {
                wizard.classList.remove("hidden");
                wizard.style.display = "block";
                if (typeof window.switchRegStep === "function") {
                    window.switchRegStep(1);
                }
            }
        } else {
            if (loginBtn) loginBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-900 bg-white shadow-sm transition-all";
            if (regBtn) regBtn.className = "flex-1 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 transition-all";
            if (loginForm) {
                loginForm.classList.remove("hidden");
                loginForm.style.display = "block";
            }
            if (regForm) {
                regForm.classList.add("hidden");
                regForm.style.display = "none";
            }
            if (wizard) {
                wizard.classList.add("hidden");
                wizard.style.display = "none";
            }
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

    

    async handleLoginSubmit(event) {
        if (event) event.preventDefault();
        const email = document.getElementById("login-email")?.value?.trim();
        const password = document.getElementById("login-password")?.value;
        const btn = document.querySelector("#form-login button[type='submit']");

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Giriş edilir...';
        }

        try {
            const result = await firebaseLogin(email, password);
            if (result.success) {
                if (this.auth) {
                    await this.auth.loadUserProfile(result.uid, email);
                }
                this.updateAuthUI();
                this.handleRoleChange();
                this.runSkillGapCalculation();
                this.closeAuthModal();
                this.switchTab("student-gap");
                this.showToast("Uğurla daxil oldunuz!");
            } else {
                this.showAuthError(result.error || "Giriş məlumatları yanlışdır.");
            }
        } catch (err) {
            this.showAuthError(err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-right-to-bracket mr-1.5"></i>Kabinetə Daxil Ol';
            }
        }
    }

    async handleRegisterSubmit(event) {
        if (event) event.preventDefault();
        const name = document.getElementById("reg-name")?.value.trim() || "Tələbə";
        const email = document.getElementById("reg-email")?.value.trim();
        const password = document.getElementById("reg-password")?.value;
        const uni = document.getElementById("reg-university")?.value;
        const faculty = document.getElementById("reg-faculty")?.value.trim() || "İqtisadiyyat";
        const targetRole = document.getElementById("reg-target-role")?.value;
        const degree = document.getElementById("reg-degree")?.value;
        const english = document.getElementById("reg-english")?.value;
        const btn = document.querySelector("#form-register button[type='submit']");

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Profil yaradılır...';
        }

        try {
            const result = await firebaseRegister(name, email, password, uni, faculty, targetRole, english, degree);
            if (result.success) {
                if (this.auth) {
                    await this.auth.loadUserProfile(result.uid, email);
                }
                const targetSelect = document.getElementById("student-target-role");
                if (targetSelect) targetSelect.value = targetRole;
                this.updateAuthUI();
                this.handleRoleChange();
                this.runSkillGapCalculation();
                this.closeAuthModal();
                this.switchTab("student-gap");
                this.showToast("Profiliniz uğurla yaradıldı və Firestore-da saxlanıldı!");
            } else {
                this.showAuthError(result.error || "Qeydiyyat xətası baş verdi.");
            }
        } catch (err) {
            this.showAuthError(err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check mr-1.5"></i>Profilimi Yarat & Giriş Et';
            }
        }
    }

    async handleLogout() {
        await firebaseLogout();
        if (this.auth) {
            this.auth.currentUser = null;
        }
        this.currentSkills = {};
        this.vacancyCurrentPage = 1;
        this.vacancyPageSize = 24;
        this.selectedVacancySector = 'all';
        this.updateAuthUI();
        this.renderStudentCabinet();
        this.renderLiveVacancies();
        this.showToast("Sessiya bağlandı.");
    }

    onAuthStatusChanged(user) {
        this.updateAuthUI();
        this.renderStudentCabinet();
        this.renderLiveVacancies();
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

    // ========================================================
    // STUDENT CABINET 2.0 — DYNAMIC SUBVIEWS & DATA BINDINGS
    // ========================================================

    renderStudentCabinet() {
        const user = (this.auth && this.auth.currentUser) ? this.auth.currentUser : null;
        const isLoggedIn = true;

        const welcomeTitle = document.getElementById("cab-welcome-title");
        const topName = document.getElementById("cab-top-username");
        const topAvatar = document.getElementById("cab-top-avatar");

        if (!user) {
            // UNREGISTERED / GUEST STATE
            if (topName) topName.textContent = "Qonaq";
            if (topAvatar) topAvatar.textContent = "👤";
            if (welcomeTitle) welcomeTitle.textContent = "Xoş Gəlmisiniz! 👋";

            const welcomeDesc = document.querySelector("#cab-view-overview p.text-slate-600");
            if (welcomeDesc) {
                welcomeDesc.textContent = "Şəxsi kabinetinizdə real əmək bazarı tələblərinə əsaslanan fərdi Skill Gap analizinizi, karyera uyğunluğunuzu və sizə ən uyğun vakansiyaları görmək üçün daxil olun.";
            }

            const welcomeBtns = document.querySelector("#cab-view-overview .pt-2.flex.flex-wrap");
            if (welcomeBtns) {
                welcomeBtns.innerHTML = `
                    <button onclick="app.openAuthModal('login')" class="px-5 py-2.5 rounded-full btn-saas-primary font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all">
                        <i class="fas fa-right-to-bracket"></i>
                        <span>Kabinetə Daxil Ol</span>
                    </button>
                    <button onclick="app.openAuthModal('register')" class="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5">
                        <i class="fas fa-user-plus text-indigo-600"></i>
                        <span>Qeydiyyatdan Keç</span>
                    </button>
                `;
            }

            const matchElem = document.getElementById("cab-stat-match");
            if (matchElem) matchElem.textContent = "— %";

            const roleElem = document.getElementById("cab-stat-role");
            if (roleElem) roleElem.textContent = "Hədəf vəzifə: Seçilməyib";

            const sectorElem = document.getElementById("cab-stat-sector");
            if (sectorElem) sectorElem.textContent = "Giriş tələb olunur";

            const topGapNameElem = document.getElementById("cab-stat-top-gap-name");
            if (topGapNameElem) topGapNameElem.textContent = "—";

            const topGapDescElem = document.getElementById("cab-stat-top-gap-desc");
            if (topGapDescElem) topGapDescElem.textContent = "Qeydiyyatdan sonra aktivləşir";

            const vacCountElem = document.getElementById("cab-stat-vacancies-count");
            if (vacCountElem) vacCountElem.textContent = "—";

            const altCountElem = document.getElementById("cab-stat-alts-count");
            if (altCountElem) altCountElem.textContent = "—";

            const tbody = document.getElementById("cab-gap-table-body");
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-8 text-center text-slate-500 bg-slate-50/50 rounded-2xl">
                            <div class="max-w-md mx-auto space-y-3">
                                <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto text-sm">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <div class="font-bold text-slate-800 text-sm">Şəxsi Skill Gap Analizi Giriş Tələb Edir</div>
                                <p class="text-xs text-slate-500 leading-relaxed">
                                    Bilik və bacarıqlarınızı bazar tələbləri ilə müqayisə etmək və fərdi boşluqlarınızı aşkar etmək üçün daxil olun və ya qeydiyyatdan keçin.
                                </p>
                                <div class="flex items-center justify-center gap-2 pt-1">
                                    <button onclick="app.openAuthModal('login')" class="px-4 py-2 rounded-full btn-saas-primary text-xs font-bold shadow-sm">
                                        Kabinetə Daxil Ol
                                    </button>
                                    <button onclick="app.openAuthModal('register')" class="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                                        Qeydiyyatdan Keç
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }

            const altsList = document.getElementById("cab-career-alts-list");
            if (altsList) {
                altsList.innerHTML = `
                    <div class="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                        <i class="fas fa-lock text-slate-300 text-xl mb-1.5 block"></i>
                        Fərdi karyera uyğunluq faizləriniz daxil olduqdan sonra hesablanacaq.
                    </div>
                `;
            }

            this.renderCabinetGeneralVacancies();

            const devPlan = document.getElementById("cab-dev-plan-steps");
            if (devPlan) {
                devPlan.innerHTML = `
                    <div class="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                        <i class="fas fa-route text-slate-300 text-xl mb-1.5 block"></i>
                        Fərdi 4 addımlıq inkişaf planı üçün bacarıqlarınızı daxil edin.
                    </div>
                `;
            }

            this.renderCabinetPassportCard(null, null, {});
            this.populateProfileSubView({ name: "", email: "", university: "UNEC", faculty: "", degree: "Bakalavr", experience_years: 0, englishLevel: "B2" });
            this.renderSkillsSubView({});
            return;
        }

        // ====================================================
        // LOGGED-IN REAL USER STATE (FULL PERSONALIZED ENGINE)
        // ====================================================
        const targetRoleId = user.targetRole || "financial_analyst";
        
        // Ensure default skills if newly registered user has none
        if (!user.savedSkills || Object.keys(user.savedSkills).length === 0) {
            const roleBenchmark = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === targetRoleId) : null;
            const initSkills = {};
            if (roleBenchmark && roleBenchmark.skills_benchmark) {
                roleBenchmark.skills_benchmark.forEach((sb, idx) => {
                    initSkills[sb.skill_id] = idx < 3 ? Math.max(1, (sb.market_level || 3) - 1) : 2;
                });
            } else {
                initSkills["excel"] = 3;
                initSkills["sql"] = 2;
                initSkills["analytical_thinking"] = 4;
            }
            user.savedSkills = initSkills;
            this.auth.updateProfile({ savedSkills: initSkills });
        }

        const currentSkills = (this.currentSkills && Object.keys(this.currentSkills).length > 0)
            ? this.currentSkills
            : (user.savedSkills || user.skills || {});
        user.savedSkills = currentSkills;
        user.skills = currentSkills;
        this.currentSkills = currentSkills;

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
            welcomeTitle.textContent = `Salam, ${firstName}! 👋`;
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
        const matchScoreVal = matchResult.matchPercentage || 74;
        const matchElem = document.getElementById("cab-stat-match");
        if (matchElem) {
            matchElem.textContent = `${matchScoreVal}%`;
            matchElem.className = `text-2xl font-black ${matchScoreVal >= 70 ? 'text-emerald-600' : (matchScoreVal >= 40 ? 'text-amber-600' : 'text-rose-600')}`;
        }

        const roleElem = document.getElementById("cab-stat-role");
        if (roleElem) roleElem.textContent = matchResult.role ? matchResult.role.title : "Financial Analyst";

        const sectorElem = document.getElementById("cab-stat-sector");
        if (sectorElem) sectorElem.textContent = matchResult.role ? (matchResult.role.sector + " sektoru") : "Maliyyə və Bank sektoru";

        const topGap = (matchResult.topPriorities && matchResult.topPriorities.length > 0) ? matchResult.topPriorities[0] : { skillName: "Power BI", gap: 2 };
        const topGapNameElem = document.getElementById("cab-stat-top-gap-name");
        if (topGapNameElem) topGapNameElem.textContent = topGap.skillName || "Power BI";

        const topGapDescElem = document.getElementById("cab-stat-top-gap-desc");
        if (topGapDescElem) topGapDescElem.textContent = `${topGap.gap || 2} səviyyə fərq var`;

        const matchingJobs = this.getMatchingVacanciesForUser(currentSkills, targetRoleId);
        const vacCountElem = document.getElementById("cab-stat-vacancies-count");
        if (vacCountElem) vacCountElem.textContent = `${matchingJobs.length}`;

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

        // 8. Render All Full Sub-views
        this.populateProfileSubView(user);
        this.renderSkillsSubView(currentSkills);
        this.renderSkillGapSubView(matchResult, currentSkills);
        this.renderCabinetVacanciesSubView(matchingJobs);
        this.renderCabinetCareerAlternativesSubView(matchResult);
        this.renderCabinetDevelopmentPlanSubView(matchResult);
        this.renderCabinetPassportSubView(user, matchResult, currentSkills);
        this.renderATSAnalysisSubView(user, targetRoleId);
        this.renderCVBuilderSubView(user, targetRoleId);
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
                    <a href="${job.url || job.source_url || `https://jobsearch.az/vacancies/${job.id || 'view'}`}" target="_blank" rel="noopener noreferrer" class="px-3.5 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-[11px] transition-all flex items-center gap-1">
                        <span>Vakansiyaya bax</span>
                        <i class="fas fa-arrow-up-right-from-square text-[9px]"></i>
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

        const breakdown = (result && result.breakdown && result.breakdown.length > 0) ? result.breakdown : [];
        if (breakdown.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-xs text-slate-400">Bacarıq analizi tapılmadı.</td></tr>`;
            return;
        }

        breakdown.slice(0, 6).forEach(item => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-slate-50/80 transition-colors border-b border-slate-50";

            let userBarColor = "#10b981"; // green
            if (item.gap === 1 || item.gap === 2) userBarColor = "#f59e0b"; // orange
            else if (item.gap >= 3) userBarColor = "#ef4444"; // red

            let statusBadge = "";
            if (item.gap <= 0) {
                statusBadge = `<span class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><i class="fas fa-circle-check text-emerald-500"></i> Tam Uyğundur</span>`;
            } else if (item.gap <= 2) {
                statusBadge = `<span class="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><i class="fas fa-circle-exclamation text-amber-500"></i> ${item.gap} səviyyə çatışmazlıq</span>`;
            } else {
                statusBadge = `<span class="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"><i class="fas fa-circle-xmark text-rose-500"></i> ${item.gap} səviyyə kritik kəsir</span>`;
            }

            const userPct = Math.min(100, Math.round((item.userLevel / 5) * 100));
            const marketPct = Math.min(100, Math.round((item.requiredLevel / 5) * 100));

            tr.innerHTML = `
                <td class="py-2.5 font-bold text-slate-800 text-xs">${item.skillName}</td>
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
                <td class="py-2.5 text-center font-black text-xs ${item.gap > 0 ? (item.gap >= 3 ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}">
                    ${item.gap === 0 ? '0 (✓)' : `${item.gap}`}
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

        const alts = (result && result.alternativeCareers && result.alternativeCareers.length > 0)
            ? result.alternativeCareers
            : [
                { roleTitle: "Business Analyst", matchPercentage: 76, salaryRange: "1200 - 2000 AZN" },
                { roleTitle: "Accountant / Mühasib", matchPercentage: 73, salaryRange: "1000 - 1800 AZN" },
                { roleTitle: "Data Analyst", matchPercentage: 65, salaryRange: "1400 - 2500 AZN" }
            ];

        alts.slice(0, 5).forEach(alt => {
            const score = alt.matchPercentage || alt.matchScore || 70;
            const colorClass = score >= 70 ? "bg-emerald-500" : (score >= 40 ? "bg-amber-500" : "bg-rose-500");
            const textClass = score >= 70 ? "text-emerald-700" : (score >= 40 ? "text-amber-700" : "text-rose-700");

            const div = document.createElement("div");
            div.className = "space-y-1.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer";
            div.onclick = () => {
                if (alt.roleId) {
                    this.auth.updateProfile({ targetRole: alt.roleId });
                    this.renderStudentCabinet();
                }
            };

            div.innerHTML = `
                <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span class="hover:text-indigo-600 transition-colors">${alt.roleTitle || alt.title}</span>
                    <span class="${textClass} font-black">${score}%</span>
                </div>
                <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full ${colorClass} rounded-full transition-all duration-500" style="width: ${score}%;"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

        getMatchingVacanciesForUser(userSkills, targetRoleId) {
        const vacancies = (this.data && this.data.liveVacancies) ? this.data.liveVacancies : [];
        if (vacancies.length === 0) return [];

        const userProfile = this.auth.currentUser || {};
        const scored = vacancies.map(v => {
            const matchRes = this.engine.calculateVacancyMatch(v, userSkills, userProfile, targetRoleId);
            return {
                ...v,
                matchScore: matchRes.matchScore,
                matchingSkills: matchRes.matchingSkills,
                missingSkills: matchRes.missingSkills
            };
        });

        // Filter and sort by genuine match score (descending)
        scored.sort((a, b) => b.matchScore - a.matchScore);
        return scored.slice(0, 8);
    }

    renderCabinetMatchingVacancies(matchingJobs) {
        const container = document.getElementById("cab-matching-vacancies-list");
        if (!container) return;
        container.innerHTML = "";

        const jobsToRender = (matchingJobs && matchingJobs.length > 0) ? matchingJobs.slice(0, 4) : [];

        jobsToRender.forEach(job => {
            const div = document.createElement("div");
            div.className = "p-4 rounded-2xl border border-slate-100 hover:border-slate-300 bg-white space-y-2.5 shadow-2xs transition-all";
            
            const initials = (job.company || "PB").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "VK";
            const skillsList = job.skills || job.required_skills || ["Excel", "SQL", "Analitika"];

            const score = job.matchScore || 80;
            const scoreBadgeColor = score >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";
            const createdAt = job.created_at || job.posted_date || "15 Fevral 2026";
            const viewCount = job.view_count || 320;
            const directUrl = job.url || job.source_url || `https://jobsearch.az/vacancies/${job.id || 'view'}`;

            div.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                            ${initials}
                        </div>
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-slate-900 text-xs">${job.title}</h4>
                                <span class="text-[10px] text-slate-400 font-normal">📍 ${job.location || "Bakı"}</span>
                            </div>
                            <div class="text-[11px] text-slate-500 font-medium">${job.company}</div>
                            <div class="flex flex-wrap gap-1 pt-0.5">
                                ${skillsList.slice(0, 3).map(s => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">${s}</span>`).join("")}
                            </div>
                        </div>
                    </div>

                    <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                        <span class="px-2.5 py-1 rounded-full ${scoreBadgeColor} border text-xs font-black">
                            ${score}% uyğunluq
                        </span>
                        <a href="${directUrl}" target="_blank" rel="noopener noreferrer" title="Bu elan Jobsearch.az-dan toplanmışdır. Əgər bağlanıbsa, Jobsearch.az ümumi səhifəyə yönləndirə bilər." class="px-3.5 py-1.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs">
                            <span>Elana bax</span>
                            <i class="fas fa-arrow-up-right-from-square text-[9px]"></i>
                        </a>
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <div class="flex items-center gap-3">
                        <span><i class="far fa-calendar mr-1 text-slate-400"></i>${createdAt}</span>
                        <span><i class="far fa-eye mr-1 text-slate-400"></i>${viewCount} baxış</span>
                    </div>
                    <span class="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
                        <i class="fas fa-circle-info mr-1 text-amber-500"></i>Toplanma: ${job.collected_date || '19 Fevral 2026'} (Bağlanmış ola bilər)
                    </span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderCabinetDevelopmentPlan(result) {
        const container = document.getElementById("cab-dev-plan-steps");
        if (!container) return;
        container.innerHTML = "";

        const topGaps = (result && result.topPriorities && result.topPriorities.length > 0)
            ? result.topPriorities.slice(0, 4)
            : [
                { skillName: "SQL", gap: 2 },
                { skillName: "Power BI", gap: 2 },
                { skillName: "Financial Modeling", gap: 1 },
                { skillName: "Excel Advanced", gap: 1 }
            ];

        topGaps.forEach((g, idx) => {
            const num = idx + 1;
            const isHigh = g.gap >= 2;
            const circleColor = isHigh ? "bg-rose-500" : (g.gap === 1 ? "bg-amber-500" : "bg-blue-500");
            const tagColor = isHigh ? "bg-rose-50 text-rose-700 border-rose-200" : (g.gap === 1 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200");
            const priorityText = isHigh ? "Yüksək prioritet" : (g.gap === 1 ? "Orta prioritet" : "Tövsiyə olunur");

            const div = document.createElement("div");
            div.className = "flex items-start gap-3 text-xs";
            div.innerHTML = `
                <div class="w-6 h-6 rounded-full ${circleColor} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    ${num}
                </div>
                <div class="flex-grow space-y-0.5">
                    <div class="flex items-center justify-between">
                        <div class="font-bold text-slate-900">${g.skillName || "Bacarıq"}</div>
                        <span class="px-2 py-0.5 rounded-full border ${tagColor} text-[10px] font-bold">${priorityText}</span>
                    </div>
                    <p class="text-[11px] text-slate-500">Məqsəd: Boşluğu aradan qaldırmaq (Təxmini: ${2 + num * 2} həftə)</p>
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

        if (passName) passName.textContent = user.name || "İstifadəçi";
        if (passAvatar) passAvatar.textContent = user.name ? user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "TL";
        if (passUni) passUni.textContent = `${user.university || "UNEC"} · ${user.faculty || "Maliyyə ixtisası"}`;
        if (passRole) passRole.textContent = `Hədəf vəzifə: ${matchResult && matchResult.role ? matchResult.role.title : "Financial Analyst"}`;
        
        const mScore = matchResult && matchResult.matchPercentage ? matchResult.matchPercentage : 74;
        if (passMatch) passMatch.textContent = `Career Match: ${mScore}%`;

        if (grid) {
            grid.innerHTML = "";
            const skillsEntries = Object.entries(currentSkills).slice(0, 6);
            if (skillsEntries.length === 0) {
                grid.innerHTML = `<div class="col-span-2 p-3 text-center text-xs text-slate-400 italic">Hələ heç bir bacarıq əlavə edilməyib.</div>`;
            } else {
                skillsEntries.forEach(([sId, sVal]) => {
                    const lvl = typeof sVal === "object" ? sVal.level : sVal;
                    const box = document.createElement("div");
                    box.className = "flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs";
                    box.innerHTML = `
                        <span class="font-bold text-slate-700 truncate capitalize">${sId.replace(/_/g, " ")}</span>
                        <span class="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">${lvl}/5</span>
                    `;
                    grid.appendChild(box);
                });
            }
        }
    }

    // ========================================================
    // FULL SUBVIEWS DETAILED IMPLEMENTATIONS (10 SUB-VIEWS)
    // ========================================================

    renderSkillGapSubView(matchResult, currentSkills) {
        const container = document.getElementById("cab-deep-gap-content");
        if (!container) return;

        const breakdown = (matchResult && matchResult.breakdown) ? matchResult.breakdown : [];
        const top8Skills = breakdown.slice(0, 8);

        // Render Radar Chart + Deep Table
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Top Overview Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Left: Radar Chart (5 Columns) -->
                    <div class="lg:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
                        <div class="flex items-center justify-between pb-2 border-b border-slate-200/80">
                            <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Bacarıqlar Radarı (Radar Chart)</h4>
                            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">8 Əsas Bacarıq</span>
                        </div>
                        <div class="h-64 my-auto relative flex items-center justify-center">
                            <canvas id="cab-radar-chart"></canvas>
                        </div>
                        <div class="flex items-center justify-center gap-4 text-[11px] font-bold pt-2 border-t border-slate-200/80">
                            <span class="flex items-center gap-1.5 text-blue-600">
                                <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>Bazar Tələbi
                            </span>
                            <span class="flex items-center gap-1.5 text-amber-600">
                                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Sizin Səviyyəniz
                            </span>
                        </div>
                    </div>

                    <!-- Right: Key Gap Highlights & Cards (7 Columns) -->
                    <div class="lg:col-span-7 space-y-4">
                        <div class="grid grid-cols-3 gap-3">
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <span class="text-[10px] text-slate-400 font-bold uppercase block mb-1">Career Match</span>
                                <div class="text-2xl font-black text-indigo-600">${matchResult.matchPercentage || 74}%</div>
                            </div>
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <span class="text-[10px] text-slate-400 font-bold uppercase block mb-1">Ən Böyük Boşluq</span>
                                <div class="text-sm font-black text-rose-600 mt-1">${(matchResult.topPriorities && matchResult.topPriorities[0]?.skillName) || 'Power BI'}</div>
                            </div>
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <span class="text-[10px] text-slate-400 font-bold uppercase block mb-1">Güclü Bacarıq</span>
                                <div class="text-sm font-black text-emerald-600 mt-1">${(breakdown.find(b => b.gap === 0)?.skillName) || 'Excel'}</div>
                            </div>
                        </div>

                        <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                            <div class="font-bold flex items-center gap-1.5 text-blue-950">
                                <i class="fas fa-lightbulb text-blue-600"></i>Skill Gap Nəticə Xülasəsi:
                            </div>
                            <p class="text-[11px] leading-relaxed text-blue-800">
                                <strong>${matchResult.role ? matchResult.role.title : 'Hədəf Vəzifə'}</strong> üçün tələb olunan <strong>${breakdown.length}</strong> əsas bacarıqdan <strong>${breakdown.filter(b => b.gap === 0).length}</strong> dənəsi üzrə tam uyğunsunuz. Ən kritik <strong>${matchResult.topPriorities ? matchResult.topPriorities.length : 2}</strong> bacarığı inkişaf etdirməklə uyğunluğunuzu <strong>90%+</strong> səviyyəsinə qaldıra bilərsiniz.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Deep Gap Table -->
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                                <th class="py-2.5 px-3">Bacarıq Adı</th>
                                <th class="py-2.5 px-3">İstifadəçi Səviyyəsi</th>
                                <th class="py-2.5 px-3">Bazar Tələbi</th>
                                <th class="py-2.5 px-3 text-center">Fərq (Gap)</th>
                                <th class="py-2.5 px-3 text-right">Uyğunluq Statusu</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${breakdown.map(item => {
                                const userPct = Math.min(100, Math.round((item.userLevel / 5) * 100));
                                const marketPct = Math.min(100, Math.round((item.requiredLevel / 5) * 100));
                                const userBarColor = item.gap === 0 ? '#10b981' : (item.gap <= 2 ? '#f59e0b' : '#ef4444');
                                const statusBadge = item.gap <= 0 
                                    ? `<span class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><i class="fas fa-circle-check text-emerald-500"></i> Tam Uyğundur</span>`
                                    : (item.gap <= 2 
                                        ? `<span class="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><i class="fas fa-circle-exclamation text-amber-500"></i> İnkişaf Etdirilməli</span>`
                                        : `<span class="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"><i class="fas fa-circle-xmark text-rose-500"></i> Kritik Çatışmazlıq</span>`);

                                return `
                                    <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                        <td class="py-3 px-3 font-bold text-slate-900 text-xs">${item.skillName}</td>
                                        <td class="py-3 px-3">
                                            <div class="dual-bar-container">
                                                <span class="text-[11px] font-bold text-slate-700">${item.userLevel}/5</span>
                                                <div class="dual-bar-track">
                                                    <div class="dual-bar-fill" style="width: ${userPct}%; background-color: ${userBarColor};"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="py-3 px-3">
                                            <div class="dual-bar-container">
                                                <span class="text-[11px] font-bold text-slate-700">${item.requiredLevel}/5</span>
                                                <div class="dual-bar-track">
                                                    <div class="dual-bar-fill" style="width: ${marketPct}%; background-color: #2563eb;"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="py-3 px-3 text-center font-black text-xs ${item.gap > 0 ? (item.gap >= 3 ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-600'}">
                                            ${item.gap === 0 ? '0 (✓)' : `-${item.gap}`}
                                        </td>
                                        <td class="py-3 px-3 text-right">
                                            ${statusBadge}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Render Chart.js Radar Chart
        this.renderCabinetRadarChart(top8Skills);
    }

    renderCabinetRadarChart(top8Skills) {
        const canvas = document.getElementById("cab-radar-chart");
        if (!canvas || typeof Chart === "undefined") return;

        if (this.charts && this.charts.cabRadar) {
            this.charts.cabRadar.destroy();
        }

        const labels = top8Skills.map(s => s.skillName);
        const marketData = top8Skills.map(s => s.requiredLevel || 3);
        const userData = top8Skills.map(s => s.userLevel || 1);

        const ctx = canvas.getContext("2d");
        this.charts = this.charts || {};
        this.charts.cabRadar = new Chart(ctx, {
            type: "radar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Bazar Tələbi",
                        data: marketData,
                        backgroundColor: "rgba(37, 99, 235, 0.18)",
                        borderColor: "rgba(37, 99, 235, 0.9)",
                        borderWidth: 2,
                        pointBackgroundColor: "#2563eb",
                        pointRadius: 3
                    },
                    {
                        label: "Sizin Səviyyəniz",
                        data: userData,
                        backgroundColor: "rgba(245, 158, 11, 0.22)",
                        borderColor: "rgba(245, 158, 11, 0.95)",
                        borderWidth: 2,
                        pointBackgroundColor: "#f59e0b",
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: { stepSize: 1, display: false },
                        grid: { color: "rgba(226, 232, 240, 0.8)" },
                        pointLabels: { font: { size: 10, weight: "bold" }, color: "#475569" }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    renderCabinetVacanciesSubView(matchingJobs) {
        const container = document.getElementById("cab-full-vacancies-grid");
        if (!container) return;
        container.innerHTML = "";

        if (!matchingJobs || matchingJobs.length === 0) {
            container.innerHTML = `<div class="col-span-full p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">Uyğun vakansiya tapılmadı.</div>`;
            return;
        }

        matchingJobs.forEach(job => {
            const div = document.createElement("div");
            div.className = "p-5 rounded-2xl border border-slate-200 hover:border-slate-400 bg-white space-y-3.5 shadow-2xs transition-all flex flex-col justify-between";
            
            const initials = (job.company || "PB").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "VK";
            const skillsList = job.skills || job.required_skills || ["Excel", "SQL", "Analitika"];
            const score = job.matchScore || 80;
            const badgeColor = score >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";
            const createdAt = job.created_at || job.posted_date || "15 Fevral 2026";
            const viewCount = job.view_count || 320;
            const directUrl = job.url || job.source_url || `https://jobsearch.az/vacancies/${job.id || 'view'}`;

            div.innerHTML = `
                <div class="space-y-3">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                                ${initials}
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-900 text-xs">${job.title}</h4>
                                <div class="text-[11px] text-slate-500">${job.company} · 📍 ${job.location || 'Bakı'}</div>
                            </div>
                        </div>
                        <span class="px-2.5 py-1 rounded-full ${badgeColor} border text-xs font-black flex-shrink-0">
                            ${score}% uyğun
                        </span>
                    </div>

                    <div class="flex flex-wrap gap-1 pt-1">
                        ${skillsList.map(s => `<span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">${s}</span>`).join("")}
                    </div>

                    <!-- Archival Note -->
                    <div class="p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-800 flex items-start gap-1.5 leading-tight">
                        <i class="fas fa-circle-info text-amber-500 text-[11px] mt-0.5 flex-shrink-0"></i>
                        <span>Bu elan Jobsearch.az-dan <strong>${createdAt}</strong> tarixində toplanmışdır. Elan bağlanmış ola bilər.</span>
                    </div>
                </div>

                <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div class="text-[10px] text-slate-400 flex items-center gap-2.5">
                        <span><i class="far fa-calendar mr-1"></i>${createdAt}</span>
                        <span><i class="far fa-eye mr-1"></i>${viewCount} baxış</span>
                    </div>
                    <a href="${directUrl}" target="_blank" rel="noopener noreferrer" title="Bu elan Jobsearch.az-dan toplanmışdır. Əgər bağlanıbsa, Jobsearch.az ümumi səhifəyə yönləndirə bilər." class="px-3.5 py-1.5 rounded-full btn-saas-primary font-bold text-[11px] shadow-sm flex items-center gap-1.5">
                        <span>Elana bax</span>
                        <i class="fas fa-arrow-up-right-from-square text-[9px]"></i>
                    </a>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderCabinetCareerAlternativesSubView(matchResult) {
        const container = document.getElementById("cab-full-career-matrix");
        if (!container) return;
        container.innerHTML = "";

        const allRoles = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark : [];
        const currentSkills = (this.auth.currentUser && this.auth.currentUser.savedSkills) || {};

        allRoles.forEach(r => {
            const rRes = this.engine.calculateGap(r.id, currentSkills, this.auth.currentUser || {});
            const score = rRes.matchPercentage || 65;
            const colorClass = score >= 70 ? "bg-emerald-500" : (score >= 40 ? "bg-amber-500" : "bg-rose-500");
            const textClass = score >= 70 ? "text-emerald-700" : (score >= 40 ? "text-amber-700" : "text-rose-700");

            const card = document.createElement("div");
            card.className = "p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs space-y-4 transition-all";
            card.innerHTML = `
                <div class="flex items-start justify-between">
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm">${r.title}</h4>
                        <span class="text-[11px] text-slate-400">${r.sector}</span>
                    </div>
                    <span class="px-2.5 py-1 rounded-full ${score >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} border text-xs font-black">
                        ${score}%
                    </span>
                </div>

                <div class="space-y-1">
                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full ${colorClass} rounded-full" style="width: ${score}%;"></div>
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-600">${r.salaryRange || "1200 - 2400 AZN"}</span>
                    <button onclick="app.setTargetRoleFromCabinet('${r.id}')" class="px-3 py-1.5 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all">
                        Hədəf Seç
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderCabinetDevelopmentPlanSubView(matchResult) {
        const container = document.getElementById("cab-full-dev-plan-list");
        if (!container) return;
        container.innerHTML = "";

        const topGaps = (matchResult && matchResult.topPriorities && matchResult.topPriorities.length > 0)
            ? matchResult.topPriorities
            : [
                { skillName: "SQL", gap: 2 },
                { skillName: "Power BI", gap: 2 },
                { skillName: "Financial Modeling", gap: 1 }
            ];

        const recommendations = [
            {
                step: 1,
                title: `${topGaps[0]?.skillName || 'SQL'} Bacarığının Gücləndirilməsi`,
                duration: "4 həftə",
                type: "Online Kurs & Praktika",
                resources: ["Coursera: Advanced Databases & SQL", "LeetCode Database Exercises", "YouTube: DataCamp Tutorials"],
                desc: "Seçilmiş vəzifə üçün bu bacarıqda ən böyük bazar tələbi mövcuddur. Hər gün 1 saat praktiki sorğular yazmaq tövsiyə olunur."
            },
            {
                step: 2,
                title: `${topGaps[1]?.skillName || 'Power BI'} üzrə Vizual Hesabat Layihəsi`,
                duration: "4-6 həftə",
                type: "Keys Layihəsi (Portfolio)",
                resources: ["Microsoft Learn: Power BI Data Analyst", "Kaggle Maliyyə Datasetləri", "DAX Formulas Guide"],
                desc: "Real bazar datası əsasında interaktiv dashboard qurub GitHub və ya LinkedIn-də paylaşın."
            },
            {
                step: 3,
                title: `${topGaps[2]?.skillName || 'Analitik Düşüncə'} və Sektor Təcrübəsi`,
                duration: "6 həftə",
                type: "Keys Simulyasiyası",
                resources: ["Harvard Business Case Studies", "IFRS & Maliyyə Hesabatları Təhlili"],
                desc: "Real şirkət hesabatlarını təhlil edərək qərarvermə və təqdimat bacarıqlarınızı artırın."
            },
            {
                step: 4,
                title: "Skill Passport və ATS-Uyğun CV ilə İş Müraciətləri",
                duration: "Davamlı",
                type: "Karyera İnteqrasiyası",
                resources: ["SkillMap Digital Passport PDF", "ATS-Friendly CV Builder", "Jobsearch.az Açıq Vakansiyaları"],
                desc: "Tamamladığınız bacarıqları təsdiqləyin, rəsmi pasportunuzu endirin və ən yüksək uyğunluqlu vakansiyalara müraciət edin."
            }
        ];

        recommendations.forEach(r => {
            const div = document.createElement("div");
            div.className = "p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-2xs space-y-3 transition-all";
            div.innerHTML = `
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                            ${r.step}
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-900 text-sm">${r.title}</h4>
                            <span class="text-[11px] text-blue-600 font-semibold">${r.type} · Təxmini Müddət: ${r.duration}</span>
                        </div>
                    </div>
                </div>

                <p class="text-xs text-slate-600 leading-relaxed">${r.desc}</p>

                <div class="pt-2 border-t border-slate-100">
                    <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Tövsiyə Olunan Tədris Resursları:</span>
                    <div class="flex flex-wrap gap-1.5">
                        ${r.resources.map(res => `<span class="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-[11px] font-semibold border border-slate-200">${res}</span>`).join("")}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderCabinetPassportSubView(user, matchResult, currentSkills) {
        const container = document.getElementById("cab-full-passport-preview");
        if (!container || !user) return;

        const roleTitle = matchResult && matchResult.role ? matchResult.role.title : "Financial Analyst";
        const score = matchResult && matchResult.matchPercentage ? matchResult.matchPercentage : 74;

        container.innerHTML = `
            <div class="p-8 rounded-3xl bg-white border-2 border-slate-900/10 shadow-lg space-y-6 max-w-2xl mx-auto">
                <div class="flex items-center justify-between pb-6 border-b border-slate-200">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-md">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <div>
                            <div class="font-black text-slate-900 text-base">SkillMap Azerbaijan</div>
                            <div class="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Rəsmi Rəqəmsal Bacarıq Pasportu</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                            ${score}% Career Match
                        </span>
                        <div class="text-[10px] text-slate-400 font-mono mt-1">ID: ${user.studentId || 'AZ-STUDENT-2026'}</div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <span class="text-slate-400 font-bold uppercase block text-[10px]">Tələbə / Namizəd</span>
                        <div class="font-black text-slate-900 text-sm">${user.name || "İstifadəçi"}</div>
                    </div>
                    <div>
                        <span class="text-slate-400 font-bold uppercase block text-[10px]">Təhsil Müəssisəsi</span>
                        <div class="font-bold text-slate-800">${user.university || "UNEC"} (${user.degree || "Bakalavr"})</div>
                    </div>
                    <div>
                        <span class="text-slate-400 font-bold uppercase block text-[10px]">Hədəf Karyera İstiqaməti</span>
                        <div class="font-bold text-indigo-700">${roleTitle}</div>
                    </div>
                    <div>
                        <span class="text-slate-400 font-bold uppercase block text-[10px]">Verifikasiya Tarixi</span>
                        <div class="font-bold text-slate-800">Avqust 2026 (Jobsearch.az n=420)</div>
                    </div>
                </div>

                <div>
                    <span class="text-slate-400 font-bold uppercase block text-[10px] mb-2">Təsdiqlənmiş Əsas Bacarıqlar Və Qiymətlər:</span>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        ${Object.entries(currentSkills).map(([sId, val]) => {
                            const lvl = typeof val === "object" ? val.level : val;
                            return `
                                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                    <span class="font-bold text-slate-800 capitalize">${sId.replace(/_/g, " ")}</span>
                                    <span class="font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">${lvl}/5</span>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    setTargetRoleFromCabinet(roleId) {
        if (!roleId) return;
        this.auth.updateProfile({ targetRole: roleId });
        alert(`Hədəf vəzifəniz dəyişdirildi! Bütün analizlər yenidən hesablandı.`);
        this.renderStudentCabinet();
        this.switchCabinetView("overview");
    }

    viewVacancyInLiveTab(title, company) {
        this.switchTab("live-vacancies");
        const input = document.getElementById("vacancy-search-input");
        if (input) {
            input.value = title || company || "";
            this.renderLiveVacancies();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    switchCabinetView(view) {
        const viewName = (view || "overview").replace(/^cab-view-/, "").replace(/^cab-nav-/, "");
        
        // 1. Hide all cabinet subviews
        const sections = document.querySelectorAll('[data-cabinet-view]');
        if (sections.length > 0) {
            sections.forEach(s => {
                s.style.display = 'none';
                s.classList.add('hidden');
            });
        }
        
        // Fallback for ID based lookup
        const viewIds = [
            "overview", "profile", "skills", "skill-gap", "vacancies", 
            "career-directions", "dev-plan", "skill-passport", "cv-ats", "cv-builder", "settings"
        ];
        viewIds.forEach(v => {
            const el = document.getElementById(`cab-view-${v}`);
            if (el) {
                el.style.display = 'none';
                el.classList.add('hidden');
            }
        });

        // 2. Show active subview
        const activeSection = document.querySelector(`[data-cabinet-view="${viewName}"]`) || document.getElementById(`cab-view-${viewName}`);
        if (activeSection) {
            activeSection.style.display = 'block';
            activeSection.classList.remove('hidden');
        }

        // 3. Highlight active nav button
        document.querySelectorAll('.cabinet-nav-btn, .sidebar-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-view-btn="${viewName}"]`) || document.getElementById(`cab-nav-${viewName}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Re-render radar chart if switching to skill gap
        if (viewName === 'skill-gap' && this.lastMatchResult) {
            this.renderSkillGapSubView(this.lastMatchResult, this.currentSkills || {});
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    initCabinetNavListeners() {
        document.querySelectorAll('[data-view-btn]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const view = btn.getAttribute('data-view-btn');
                if (view) {
                    this.switchCabinetView(view);
                }
            });
        });
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
        const file = event.target && event.target.files && event.target.files[0];
        if (!file || file.size === 0) {
            console.log("Empty or zero-byte file event ignored");
            return;
        }
        if (this.isParsingCV) {
            console.log("Ignoring duplicate CV upload event trigger");
            return;
        }

        this.isParsingCV = true;
        try {
            const parsed = await parseCV(file);
            if (!parsed) return;
            this.pendingParsedCV = parsed;
            this.closeCVUploadModal();
            this.showCVConfirmationModal(parsed, file.name);
        } catch (e) {
            console.error("CV oxunarkən xəta:", e);
            alert(e.message || "PDF oxunmadı, zəhmət olmasa başqa format yükləyin");
        } finally {
            this.isParsingCV = false;
            if (event.target) event.target.value = '';
        }
    }

    async parsePastedCVText() {
        if (this.isParsingCV) return;
        const text = document.getElementById("cv-text-paste").value;
        if (!text || text.trim().length < 20) {
            alert("Zəhmət olmasa ən azı bir neçə cümləlik CV mətni daxil edin.");
            return;
        }

        this.isParsingCV = true;
        try {
            const blob = new Blob([text], { type: "text/plain" });
            blob.name = "Pasted_CV.txt";
            const parsed = await parseCV(blob);
            if (!parsed) return;
            this.pendingParsedCV = parsed;
            this.closeCVUploadModal();
            this.showCVConfirmationModal(parsed, "Pasted_CV_Text");
        } catch (e) {
            console.error("CV mətni oxunarkən xəta:", e);
            alert(e.message || "CV mətni oxunmadı.");
        } finally {
            this.isParsingCV = false;
        }
    }

    showCVConfirmationModal(parsed, fileName = "CV Faylı") {
        const modal = document.getElementById("modal-cv-confirm");
        if (!modal) return;

        const displayName = parsed.candidateName || (this.auth?.currentUser?.name && this.auth.currentUser.name !== "test" ? this.auth.currentUser.name : "Namizəd");

        const confEl = document.getElementById("confirm-confidence-score");
        if (confEl) confEl.textContent = parsed.confidence || (parsed.skillCount > 3 ? "Yüksək" : "Orta");
        
        const fileEl = document.getElementById("confirm-file-name");
        if (fileEl) fileEl.textContent = fileName || "CV.pdf";

        const nameEl = document.getElementById("confirm-name");
        if (nameEl) nameEl.textContent = displayName;

        const contactEl = document.getElementById("confirm-contact");
        if (contactEl) contactEl.textContent = `${parsed.email || this.auth?.currentUser?.email || 'Məlumat yoxdur'}`;

        const eduEl = document.getElementById("confirm-edu");
        if (eduEl) eduEl.textContent = parsed.university ? `${parsed.university}` : "Təhsil qeyd olunmayıb";

        const expEl = document.getElementById("confirm-exp");
        if (expEl) expEl.textContent = `${parsed.experience || 0} il (İngilis dili: ${parsed.englishLevel || 'B2'})`;

        const tagsContainer = document.getElementById("confirm-skills-tags");
        if (tagsContainer) {
            tagsContainer.innerHTML = "";
            const skillsEntries = Object.entries(parsed.foundSkills || parsed.skills || {});
            if (skillsEntries.length === 0) {
                tagsContainer.innerHTML = '<span class="text-xs text-slate-400 italic">Heç bir açar bacarıq aşkar edilmədi.</span>';
            } else {
                skillsEntries.forEach(([id, s]) => {
                    const lvl = typeof s === "object" ? s.level : s;
                    const tag = document.createElement("span");
                    tag.className = "px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center gap-1";
                    tag.innerHTML = `<span class="capitalize">${id.replace(/_/g, " ")}</span> <span class="text-emerald-600 font-black">✓ (${lvl}/5)</span>`;
                    tagsContainer.appendChild(tag);
                });
            }
        }

        modal.style.display = "flex";
    }

    confirmExtractedCV() {
        if (!this.pendingParsedCV) return;
        const parsed = this.pendingParsedCV;
        
        // 1. Reset currentSkills and populate ONLY with skills found from the CV
        this.currentSkills = {};
        const skillsObj = parsed.foundSkills || parsed.skills || {};
        Object.entries(skillsObj).forEach(([id, s]) => {
            const lvl = typeof s === "object" ? s.level : s;
            this.currentSkills[id] = lvl;
        });

        // 2. Update user profile state
        if (this.auth && this.auth.currentUser) {
            this.auth.currentUser.skills = this.currentSkills;
            this.auth.currentUser.savedSkills = this.currentSkills;
            if (parsed.candidateName) {
                this.auth.currentUser.name = parsed.candidateName;
            }
            if (parsed.email) {
                this.auth.currentUser.email = parsed.email;
            }
            if (parsed.university) this.auth.currentUser.university = parsed.university;
            if (parsed.englishLevel) this.auth.currentUser.englishLevel = parsed.englishLevel;
            if (parsed.experience) this.auth.currentUser.experience_years = parsed.experience;

            if (typeof firebaseSaveSkills === "function") {
                firebaseSaveSkills(this.currentSkills, this.auth.currentUser.targetRole || "data_analyst");
            }
        }

        const modal = document.getElementById("modal-cv-confirm");
        if (modal) modal.style.display = "none";
        
        const skillNames = Object.keys(skillsObj).map(s => s.replace(/_/g, " ").toUpperCase() + " ✓").join(", ");
        this.showToast(`CV-dən tapılan bacarıqlar: ${skillNames || '0 bacarıq'} (${Object.keys(skillsObj).length} bacarıq). Zəhmət olmasa səviyyələri yoxlayın.`, "success");
        
        // Re-calculate & update views
        this.runSkillGapCalculation();
        this.renderStudentCabinet();
        this.switchCabinetView("skills");
    }

    deleteUserCV() {
        this.auth.deleteCV();
        this.showToast("CV faylı silindi və profil yeniləndi.");
        this.renderStudentCabinet();
        this.switchCabinetView("profile");
    }

    // ========================================================
    // PROFİLİM 2.0 — DYNAMIC RENDERING & CALCULATIONS
    // ========================================================

    populateProfileSubView(user) {
        const u = user || {
            name: "Qonaq",
            email: "",
            city: "Bakı",
            university: "UNEC",
            faculty: "Maliyyə və iqtisadiyyat",
            degree: "Bakalavr",
            experience_years: 0,
            englishLevel: "B2",
            otherLanguages: "Rus dili (B1), Türk dili",
            targetSector: "Maliyyə",
            targetRole: "financial_analyst",
            savedSkills: {},
            uploadedCV: null,
            photoUrl: null
        };

        // 1. Calculate Dynamic Completion Score
        const completion = this.auth.calculateCompletion(u);
        this.lastProfileCompletion = completion;

        // 2. Top Profile Header Card
        const headerName = document.getElementById("prof-header-name");
        if (headerName) headerName.textContent = u.name || "İstifadəçi";

        // Green verified checkmark: ONLY visible when completion == 100%
        const checkIcon = document.getElementById("prof-header-check");
        if (checkIcon) {
            if (completion.isComplete) {
                checkIcon.classList.remove("hidden");
                checkIcon.title = "Profil tamamlandı (100%) ✓";
            } else {
                checkIcon.classList.add("hidden");
            }
        }

        const headerUni = document.getElementById("prof-header-uni");
        if (headerUni) headerUni.textContent = u.university || "UNEC";

        const headerFac = document.getElementById("prof-header-faculty");
        if (headerFac) headerFac.textContent = u.faculty || "Maliyyə və iqtisadiyyat";

        const headerRole = document.getElementById("prof-header-target-role");
        const roleBenchmark = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === u.targetRole) : null;
        if (headerRole) headerRole.textContent = roleBenchmark ? roleBenchmark.title : (u.targetRole || "Financial Analyst");

        // Avatar Image / Initials
        const avatarBox = document.getElementById("prof-avatar-box");
        const avatarImg = document.getElementById("prof-avatar-img");
        const avatarInitials = document.getElementById("prof-avatar-initials");
        
        if (u.photoUrl) {
            if (avatarImg) {
                avatarImg.src = u.photoUrl;
                avatarImg.classList.remove("hidden");
            }
            if (avatarInitials) avatarInitials.classList.add("hidden");
        } else {
            if (avatarImg) avatarImg.classList.add("hidden");
            if (avatarInitials) {
                avatarInitials.classList.remove("hidden");
                const inits = u.name ? u.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "TL";
                avatarInitials.textContent = inits;
            }
        }

        // Completion % & Progress Bar
        const pctElem = document.getElementById("prof-completion-percentage");
        if (pctElem) pctElem.textContent = `${completion.percentage}%`;

        const barElem = document.getElementById("prof-completion-progress-bar");
        if (barElem) barElem.style.width = `${completion.percentage}%`;

        const statusTextElem = document.getElementById("prof-completion-status-text");
        if (statusTextElem) {
            if (completion.isComplete) {
                statusTextElem.innerHTML = `<span class="text-emerald-600 font-bold">✓ Profil tamamlandı! Bütün analizlər ən yüksək dəqiqliklə hesablanır.</span>`;
            } else {
                statusTextElem.textContent = `${completion.status}. Profilinizi tamamlayın və daha doğru nəticələr əldə edin.`;
            }
        }

        // CV Card
        const cvTitle = document.getElementById("prof-cv-box-title");
        const cvDesc = document.getElementById("prof-cv-box-desc");
        const cvActionContainer = document.getElementById("prof-cv-action-container");

        if (u.uploadedCV) {
            if (cvTitle) cvTitle.innerHTML = `<span class="text-emerald-700 font-black"><i class="fas fa-circle-check text-emerald-500 mr-1"></i>CV yüklənib ✓</span>`;
            if (cvDesc) cvDesc.textContent = `Aktiv fayl: ${u.uploadedCV.fileName || 'CV.pdf'} (ATS Uyğunluq: ${u.uploadedCV.confidenceScore || 92}%)`;
            if (cvActionContainer) {
                cvActionContainer.innerHTML = `
                    <div class="flex items-center gap-1.5 pt-1">
                        <button onclick="app.openCVUploadModal()" class="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-all flex items-center justify-center gap-1">
                            <i class="fas fa-arrows-rotate"></i>Yenilə
                        </button>
                        <button onclick="app.deleteUserCV()" class="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-all flex items-center justify-center gap-1">
                            <i class="fas fa-trash-can"></i>Sil
                        </button>
                    </div>
                `;
            }
        } else {
            if (cvTitle) cvTitle.textContent = "CV-niz var?";
            if (cvDesc) cvDesc.textContent = "CV-ni yükləyin, məlumatlarınızı avtomatik əlavə edək və ATS uyğunluğunu analiz edək.";
            if (cvActionContainer) {
                cvActionContainer.innerHTML = `
                    <button id="prof-cv-action-btn" onclick="app.openCVUploadModal()" class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all">
                        <i class="fas fa-arrow-up-from-bracket"></i>
                        <span>CV yüklə</span>
                    </button>
                `;
            }
        }

        // 3. Form Inputs
        const nameInput = document.getElementById("prof-input-name");
        const emailInput = document.getElementById("prof-input-email");
        const cityInput = document.getElementById("prof-input-city");
        const uniInput = document.getElementById("prof-input-uni");
        const facultyInput = document.getElementById("prof-input-faculty");
        const degreeInput = document.getElementById("prof-input-degree");
        const expInput = document.getElementById("prof-input-exp");
        const englishInput = document.getElementById("prof-input-english");
        const langInput = document.getElementById("prof-input-languages");
        const sectorInput = document.getElementById("prof-input-sector");
        const roleInput = document.getElementById("prof-input-role");

        if (nameInput) nameInput.value = u.name || "";
        if (emailInput) emailInput.value = u.email || "";
        if (cityInput) cityInput.value = u.city || "Bakı";
        if (uniInput) uniInput.value = u.university || "UNEC";
        if (facultyInput) facultyInput.value = u.faculty || "Maliyyə və iqtisadiyyat";
        if (degreeInput) degreeInput.value = u.degree || "Bakalavr";
        if (expInput) expInput.value = (u.experience_years !== undefined) ? u.experience_years : 0;
        if (englishInput) englishInput.value = u.englishLevel || "B2";
        if (langInput) langInput.value = u.otherLanguages || "Rus dili (B1), Türk dili";
        if (sectorInput) sectorInput.value = u.targetSector || "Maliyyə";

        // Populate Roles Dropdown based on Sector
        if (roleInput && this.data && this.data.jobRolesBenchmark) {
            roleInput.innerHTML = "";
            this.data.jobRolesBenchmark.forEach(r => {
                const opt = document.createElement("option");
                opt.value = r.id;
                opt.textContent = `${r.title} (${r.sector})`;
                if (r.id === u.targetRole) opt.selected = true;
                roleInput.appendChild(opt);
            });
        }

        // 4. Bottom "Karyera profiliniz" Summary Chips
        const sumEdu = document.getElementById("prof-sum-edu");
        if (sumEdu) sumEdu.textContent = `${u.degree || 'Bakalavr'} ${u.university || 'UNEC'}`;

        const sumExp = document.getElementById("prof-sum-exp");
        if (sumExp) sumExp.textContent = `${u.experience_years || 0} il`;

        const sumEng = document.getElementById("prof-sum-eng");
        if (sumEng) sumEng.textContent = `${u.englishLevel || 'B2'} (Intermediate)`;

        const sumSec = document.getElementById("prof-sum-sector");
        if (sumSec) sumSec.textContent = u.targetSector || "Maliyyə";

        const sumRole = document.getElementById("prof-sum-role");
        if (sumRole) sumRole.textContent = roleBenchmark ? roleBenchmark.title : "Financial Analyst";

        const sumStatusTitle = document.getElementById("prof-sum-status-title");
        const sumStatusDesc = document.getElementById("prof-sum-status-desc");
        if (completion.isComplete || completion.percentage >= 80) {
            if (sumStatusTitle) sumStatusTitle.textContent = "Profiliniz Skill Gap analizi üçün hazırdır!";
            if (sumStatusDesc) sumStatusDesc.textContent = "Bütün analizlər və uyğun vakansiyalar real vaxtda hesablanır.";
        } else {
            if (sumStatusTitle) sumStatusTitle.textContent = "Profilinizi tamamlayın";
            if (sumStatusDesc) sumStatusDesc.textContent = "Daha dəqiq nəticələr üçün çatışmayan məlumatları əlavə edin.";
        }

        // 5. Right Panel: Əsas bacarıqlarınız
        const skillsList = document.getElementById("prof-sidebar-skills-list");
        if (skillsList) {
            skillsList.innerHTML = "";
            const userSkills = u.savedSkills || {};
            const entries = Object.entries(userSkills).slice(0, 4);

            if (entries.length === 0) {
                skillsList.innerHTML = `<div class="p-3 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">Hələ heç bir bacarıq əlavə edilməyib.</div>`;
            } else {
                entries.forEach(([sId, val]) => {
                    const level = typeof val === "object" ? val.level : (val > 5 ? Math.round(val / 20) : val);
                    const tagColor = level >= 4 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : (level >= 3 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-rose-50 text-rose-700 border-rose-200");

                    const row = document.createElement("div");
                    row.className = "flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs";
                    row.innerHTML = `
                        <span class="font-bold text-slate-800 capitalize">${sId.replace(/_/g, " ")}</span>
                        <span class="font-bold px-2 py-0.5 rounded-md border text-[11px] ${tagColor}">${level}/5</span>
                    `;
                    skillsList.appendChild(row);
                });
            }
        }

        // 6. Right Panel: Profilinizin vəziyyəti Checklist
        const chkEdu = document.getElementById("prof-chk-edu");
        if (chkEdu) {
            const isEduDone = Boolean(u.university && u.faculty);
            chkEdu.textContent = isEduDone ? "Tamamlandı" : "Natamam";
            chkEdu.className = `font-bold ${isEduDone ? 'text-emerald-600' : 'text-rose-500'}`;
        }

        const chkRole = document.getElementById("prof-chk-role");
        if (chkRole) {
            const isRoleDone = Boolean(u.targetRole);
            chkRole.textContent = isRoleDone ? "Tamamlandı" : "Seçilməyib";
            chkRole.className = `font-bold ${isRoleDone ? 'text-emerald-600' : 'text-rose-500'}`;
        }

        const chkSkills = document.getElementById("prof-chk-skills");
        if (chkSkills) {
            const skillCount = Object.keys(u.savedSkills || {}).length;
            const isSkillsDone = skillCount >= 3;
            chkSkills.textContent = isSkillsDone ? "Tamamlandı" : (skillCount > 0 ? "Qismən" : "Yoxdur");
            chkSkills.className = `font-bold ${isSkillsDone ? 'text-emerald-600' : 'text-amber-600'}`;
        }

        const chkCv = document.getElementById("prof-chk-cv");
        if (chkCv) {
            const isCvDone = Boolean(u.uploadedCV);
            chkCv.textContent = isCvDone ? "Tamamlandı" : "Yoxdur";
            chkCv.className = `font-bold ${isCvDone ? 'text-emerald-600' : 'text-rose-500'}`;
        }

        // 7. Missing Items Suggestions (if < 100%)
        const missingBox = document.getElementById("prof-missing-items-box");
        const missingList = document.getElementById("prof-missing-items-list");
        if (missingBox && missingList) {
            if (completion.isComplete) {
                missingBox.classList.add("hidden");
            } else {
                missingBox.classList.remove("hidden");
                missingList.innerHTML = "";
                completion.missing.slice(0, 3).forEach(m => {
                    const div = document.createElement("div");
                    div.className = "flex items-center justify-between p-2 rounded-xl bg-white border border-amber-200 text-xs";
                    div.innerHTML = `
                        <span class="text-slate-800 font-medium">${m.label}</span>
                        <button onclick="${m.action}" class="text-blue-600 font-bold hover:underline text-[11px]">Tamamla →</button>
                    `;
                    missingList.appendChild(div);
                });
            }
        }
    }

    markProfileFormChanged() {
        const btn = document.getElementById("prof-save-btn");
        if (btn) {
            btn.classList.add("ring-2", "ring-blue-400");
        }
    }

    handleSectorChangeFromProfile() {
        const sectorVal = document.getElementById("prof-input-sector")?.value;
        const roleSelect = document.getElementById("prof-input-role");
        if (!roleSelect || !this.data || !this.data.jobRolesBenchmark) return;

        roleSelect.innerHTML = "";
        const filtered = this.data.jobRolesBenchmark.filter(r => (r.sector || "").toLowerCase().includes((sectorVal || "").toLowerCase()));
        const listToUse = filtered.length > 0 ? filtered : this.data.jobRolesBenchmark;

        listToUse.forEach(r => {
            const opt = document.createElement("option");
            opt.value = r.id;
            opt.textContent = `${r.title} (${r.sector})`;
            roleSelect.appendChild(opt);
        });

        this.markProfileFormChanged();
    }

    handleRoleChangeFromProfile() {
        this.markProfileFormChanged();
    }

    async saveProfileChanges() {
        const btn = document.getElementById("btn-prof-save-changes");
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i>Firestore-a yazılır...';
        }

        const updated = {
            name: document.getElementById("prof-input-name")?.value || "İstifadəçi",
            email: document.getElementById("prof-input-email")?.value || "user@example.com",
            city: document.getElementById("prof-input-city")?.value || "Bakı",
            university: document.getElementById("prof-input-uni")?.value || "UNEC",
            faculty: document.getElementById("prof-input-faculty")?.value || "Maliyyə və iqtisadiyyat",
            degree: document.getElementById("prof-input-degree")?.value || "Bakalavr",
            educationLevel: document.getElementById("prof-input-degree")?.value || "Bakalavr",
            experience_years: parseInt(document.getElementById("prof-input-exp")?.value, 10) || 0,
            experience: parseInt(document.getElementById("prof-input-exp")?.value, 10) || 0,
            englishLevel: document.getElementById("prof-input-english")?.value || "B2",
            otherLanguages: document.getElementById("prof-input-languages")?.value || "Rus dili (B1), Türk dili",
            targetSector: document.getElementById("prof-input-sector")?.value || "Maliyyə & Bankçılıq",
            targetRole: document.getElementById("prof-input-role")?.value || "financial_analyst"
        };

        await this.auth.updateProfile(updated);

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check mr-1.5"></i>Yadda Saxla';
        }
        
        // Show stylish non-blocking toast
        this.showToast("✓ Profil Firestore-da uğurla yeniləndi!");

        // Recalculate cabinet and all modules
        this.renderStudentCabinet();
        this.renderLiveVacancies();
    }

    showToast(msg) {
        let toast = document.getElementById("skillmap-live-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "skillmap-live-toast";
            toast.className = "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 transition-all transform duration-300 opacity-0 translate-y-4";
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas fa-circle-check text-emerald-400 text-sm"></i><span>${msg}</span>`;
        toast.classList.remove("opacity-0", "translate-y-4", "hidden");
        toast.classList.add("opacity-100", "translate-y-0");

        setTimeout(() => {
            toast.classList.remove("opacity-100", "translate-y-0");
            toast.classList.add("opacity-0", "translate-y-4");
        }, 3000);
    }

    // Photo Management
    openPhotoUploadModal() {
        const m = document.getElementById("modal-photo-upload");
        if (!m) return;
        const user = this.auth.currentUser;
        const previewImg = document.getElementById("modal-photo-preview-img");
        const previewText = document.getElementById("modal-photo-preview-text");

        if (user && user.photoUrl) {
            if (previewImg) { previewImg.src = user.photoUrl; previewImg.classList.remove("hidden"); }
            if (previewText) previewText.classList.add("hidden");
        } else {
            if (previewImg) previewImg.classList.add("hidden");
            if (previewText) previewText.classList.remove("hidden");
        }
        m.style.display = "flex";
    }

    closePhotoUploadModal() {
        const m = document.getElementById("modal-photo-upload");
        if (m) m.style.display = "none";
    }

    handlePhotoFileSelected(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Şəkil faylı 5MB-dan böyük ola bilməz.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.pendingPhotoUrl = e.target.result;
            const previewImg = document.getElementById("modal-photo-preview-img");
            const previewText = document.getElementById("modal-photo-preview-text");
            if (previewImg) {
                previewImg.src = this.pendingPhotoUrl;
                previewImg.classList.remove("hidden");
            }
            if (previewText) previewText.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }

    savePhotoUpload() {
        if (!this.pendingPhotoUrl) {
            this.closePhotoUploadModal();
            return;
        }
        this.auth.saveProfilePhoto(this.pendingPhotoUrl);
        this.closePhotoUploadModal();
        this.showToast("✓ Profil şəkli uğurla yeniləndi!");
        this.renderStudentCabinet();
    }

    removeProfilePhoto() {
        this.auth.removeProfilePhoto();
        this.pendingPhotoUrl = null;
        this.closePhotoUploadModal();
        this.showToast("Profil şəkli silindi və standart avatara qaytarıldı.");
        this.renderStudentCabinet();
    }

    // Completion Breakdown Modal
    showCompletionBreakdownModal() {
        const m = document.getElementById("modal-completion-breakdown");
        if (!m) return;

        const user = this.auth.currentUser || {};
        const completion = this.auth.calculateCompletion(user);

        const pctElem = document.getElementById("breakdown-modal-pct");
        if (pctElem) pctElem.textContent = `${completion.percentage}%`;

        const statusElem = document.getElementById("breakdown-modal-status");
        if (statusElem) statusElem.textContent = completion.status;

        const itemsContainer = document.getElementById("breakdown-modal-items");
        if (itemsContainer) {
            itemsContainer.innerHTML = "";
            completion.breakdown.forEach(item => {
                const row = document.createElement("div");
                row.className = "flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs";
                row.innerHTML = `
                    <div class="flex items-center gap-2">
                        <i class="${item.completed ? 'fas fa-circle-check text-emerald-500' : 'far fa-circle text-slate-400'}"></i>
                        <span class="font-medium text-slate-800">${item.label}</span>
                    </div>
                    <span class="font-bold ${item.completed ? 'text-emerald-700' : 'text-slate-400'}">+${item.weight}%</span>
                `;
                itemsContainer.appendChild(row);
            });
        }

        m.style.display = "flex";
    }

    closeCompletionBreakdownModal() {
        const m = document.getElementById("modal-completion-breakdown");
        if (m) m.style.display = "none";
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
                    <div class="font-bold text-base text-slate-900">${(user && user.name) || "Demo Tələbə"}</div>
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
        const user = (this.auth && this.auth.isLoggedIn()) ? this.auth.currentUser : null;
        if (!user) { this.openAuthModal("login"); return; }
        const roleBenchmark = (this.data && this.data.jobRolesBenchmark) ? this.data.jobRolesBenchmark.find(r => r.id === user.targetRole) : null;
        const roleTitle = roleBenchmark ? roleBenchmark.title : "Financial Analyst";

        if (window.cvBuilder) {
            window.cvBuilder.downloadCV(user, lang, roleTitle);
        }
    }

    exportSkillPassport() {
        const user = (this.auth && this.auth.isLoggedIn()) ? this.auth.currentUser : null;
        if (!user) { this.openAuthModal("login"); return; }
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
            "methodology",
            "admin"
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

    renderTopEmployers() {
        if (!this.topEmployersModule && typeof TopEmployersModule !== "undefined") {
            this.topEmployersModule = new TopEmployersModule(this.data);
            window.topEmployersModuleInstance = this.topEmployersModule;
        }
        if (this.topEmployersModule) {
            this.topEmployersModule.render();
        }
    }

    selectEmployer(companyName) {
        if (this.topEmployersModule) {
            this.topEmployersModule.selectEmployer(companyName);
        }
    }

    viewCompanyVacancies(companyName) {
        if (this.topEmployersModule) {
            this.topEmployersModule.viewCompanyVacancies(companyName);
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
        
        if (tabId === "admin") {
            if (this.admin) {
                this.admin.renderAdminView();
            }
        }
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
            if (typeof firebaseSaveSkills === "function") {
                firebaseSaveSkills(this.currentSkills, roleId);
            }
            if (typeof firebaseSaveCareerMatch === "function" && result.matchPercentage !== undefined) {
                firebaseSaveCareerMatch(result.matchPercentage);
            }
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

        setVacancySectorFilter(sector) {
        this.selectedVacancySector = sector;
        this.vacancyCurrentPage = 1;
        
        document.querySelectorAll('#vacancies-sector-filter-container button').forEach(btn => {
            const sec = btn.getAttribute('data-vac-sector');
            if (sec === sector) {
                btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-2xs transition-all";
            } else {
                btn.className = "px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all";
            }
        });
        
        this.renderLiveVacancies();
    }

    setVacancyPage(page) {
        this.vacancyCurrentPage = page;
        this.renderLiveVacancies();
        const tabEl = document.getElementById("tab-live-vacancies");
        if (tabEl) {
            tabEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    renderLiveVacancies() {
        const container = document.getElementById("live-vacancies-grid");
        if (!container) return;

        const searchInput = document.getElementById("vacancy-search-input");
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const allVacancies = (this.data && Array.isArray(this.data.liveVacancies)) ? this.data.liveVacancies : [];
        
        const filtered = allVacancies.filter(v => {
            let matchesSector = true;
            if (this.selectedVacancySector && this.selectedVacancySector !== 'all') {
                const sec = this.selectedVacancySector.toLowerCase();
                const vSec = ((v.sector || '') + ' ' + (v.category || '')).toLowerCase();
                if (sec.includes('it')) {
                    matchesSector = vSec.includes('it') || vSec.includes('texniki') || vSec.includes('data');
                } else if (sec.includes('maliyyə')) {
                    matchesSector = vSec.includes('maliyye') || vSec.includes('muhasibat') || vSec.includes('maliyyə');
                } else if (sec.includes('marketinq')) {
                    matchesSector = vSec.includes('marketinq') || vSec.includes('pr') || vSec.includes('dizayn');
                } else if (sec.includes('hr') || sec.includes('inzibati')) {
                    matchesSector = vSec.includes('insan resurslari') || vSec.includes('ofis') || vSec.includes('inzibati') || vSec.includes('menecment');
                } else if (sec.includes('mühəndis') || sec.includes('muhendis')) {
                    matchesSector = vSec.includes('muhendis') || vSec.includes('texniki');
                } else if (sec.includes('satış') || sec.includes('satis')) {
                    matchesSector = vSec.includes('satis') || vSec.includes('satış');
                } else {
                    matchesSector = vSec.includes(sec);
                }
            }
            if (!matchesSector) return false;
            
            if (!query) return true;
            
            const titleMatch = (v.title || "").toLowerCase().includes(query);
            const compMatch = (v.company || "").toLowerCase().includes(query);
            const sectorMatch = (v.sector || "").toLowerCase().includes(query);
            const skillsMatch = Array.isArray(v.skills) && v.skills.some(s => s.toLowerCase().includes(query));
            return titleMatch || compMatch || sectorMatch || skillsMatch;
        });

        // Update badge count
        const countBadge = document.getElementById("vacancies-count-badge");
        if (countBadge) {
            countBadge.textContent = `${filtered.length} Vakansiya`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    <i class="fas fa-search text-2xl text-slate-300 mb-2 block"></i>
                    Axtarışınıza uyğun heç bir vakansiya tapılmadı.
                </div>
            `;
            const pagContainer = document.getElementById("vacancies-pagination-container");
            if (pagContainer) pagContainer.innerHTML = `<span class="text-xs text-slate-400">0 nəticə tapıldı</span>`;
            return;
        }

        const totalPages = Math.ceil(filtered.length / this.vacancyPageSize);
        if (this.vacancyCurrentPage > totalPages) this.vacancyCurrentPage = 1;

        const startIdx = (this.vacancyCurrentPage - 1) * this.vacancyPageSize;
        const pageItems = filtered.slice(startIdx, startIdx + this.vacancyPageSize);

        const isLoggedIn = this.auth && this.auth.isLoggedIn();
        const userSkills = (this.auth && this.auth.isLoggedIn() && this.auth.currentUser) ? this.auth.currentUser.savedSkills : this.currentSkills;

        container.innerHTML = pageItems.map(vac => {
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

            const allSkills = Array.isArray(vac.skills) ? vac.skills : [];
            let tagsHtml = "";
            if (allSkills.length > 0) {
                tagsHtml = allSkills.slice(0, 5).map(s => {
                    const sLower = s.toLowerCase();
                    const isMatching = isLoggedIn && matchingSkillIds.some(ms => ms === sLower);
                    let pillClass = isMatching 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-black" 
                        : "bg-slate-100 text-slate-700 border-slate-200";
                    return `
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${pillClass}">
                            ${isMatching ? '✓ ' : ''}${s}
                        </span>
                    `;
                }).join(" ");
            } else {
                tagsHtml = `<span class="text-[11px] text-slate-400 italic">Vakansiya mətnində xüsusi bacarıq tələbi qeyd olunmayıb</span>`;
            }

            const qScore = vac.data_quality_score !== undefined ? vac.data_quality_score : 88;
            let qBadgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
            if (qScore < 70) qBadgeColor = "bg-amber-50 text-amber-700 border border-amber-200";

            const compName = vac.company || "Açıq Vakansiya";
            const compInitials = compName.split(" ").map(w => w.charAt(0)).join("").toUpperCase().slice(0, 2) || "VK";
            
            // Specific Direct Vacancy URL on Jobsearch.az
            const directUrl = vac.url || vac.source_url || `https://jobsearch.az/vacancies/${vac.id || 'view'}`;

            const createdAt = vac.created_at || vac.posted_date || "15 Fevral 2026";
            const viewCount = vac.view_count || 340;

            return `
                <div class="job-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group">
                    <div class="space-y-3">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-3">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-indigo-50 border border-slate-200/80 flex items-center justify-center font-black text-slate-700 text-xs shadow-2xs group-hover:border-indigo-300 group-hover:bg-indigo-50/50 transition-all flex-shrink-0">
                                    ${compInitials}
                                </div>
                                <div class="min-w-0">
                                    <span class="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors truncate block">${compName}</span>
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

                        <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-building text-slate-400 mr-1"></i>${vac.sector || 'Ümumi'}</span>
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-location-dot text-slate-400 mr-1"></i>${vac.location || 'Bakı'}</span>
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-money-bill-wave text-slate-400 mr-1"></i>${vac.salary || 'Razılaşma ilə'}</span>
                            <span class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md"><i class="fas fa-briefcase text-slate-400 mr-1"></i>${vac.min_experience_years !== undefined ? (vac.min_experience_years === 0 ? 'Təcrübəsiz / Junior' : `${vac.min_experience_years}+ il`) : 'Qeyd olunmayıb'}</span>
                        </div>

                        <div class="space-y-1.5">
                            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tələb Olunan Bacarıqlar:</span>
                            <div class="flex flex-wrap gap-1">
                                ${tagsHtml}
                            </div>
                        </div>

                        <!-- Archival / Redirect Disclaimer Notice -->
                        <div class="p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-800 flex items-start gap-1.5 leading-tight">
                            <i class="fas fa-circle-info text-amber-500 text-[11px] mt-0.5 flex-shrink-0"></i>
                            <span>Bu elan Jobsearch.az-dan <strong>${createdAt}</strong> tarixində toplanmışdır. Elan bağlanmış ola bilər (işəgötürən tərəfindən bağlandıqda ümumi səhifəyə yönləndirir).</span>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div class="text-[10px] text-slate-400 flex items-center gap-3">
                            <span><i class="far fa-calendar mr-1 text-slate-400"></i>${createdAt}</span>
                            <span><i class="far fa-eye mr-1 text-slate-400"></i>${viewCount} baxış</span>
                        </div>
                        <a href="${directUrl}" target="_blank" rel="noopener noreferrer" title="Bu elan Jobsearch.az-dan toplanmışdır. Əgər bağlanıbsa, Jobsearch.az ümumi səhifəyə yönləndirə bilər." class="px-4 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold text-xs border border-indigo-200 hover:border-indigo-600 shadow-2xs transition-all flex items-center gap-1.5">
                            <span>Elana bax</span>
                            <i class="fas fa-arrow-up-right-from-square text-[10px]"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join("");

        // Render Pagination Controls
        const pagContainer = document.getElementById("vacancies-pagination-container");
        if (pagContainer) {
            let pagHtml = `
                <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-700">Səhifə:</span>
                    <span class="font-bold text-indigo-600 font-mono">${this.vacancyCurrentPage}</span> / <span class="font-semibold text-slate-500">${totalPages}</span>
                    <span class="text-slate-400 pl-2">(${startIdx + 1} - ${Math.min(startIdx + this.vacancyPageSize, filtered.length)} / ${filtered.length} elan)</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button onclick="app.setVacancyPage(${Math.max(1, this.vacancyCurrentPage - 1)})" ${this.vacancyCurrentPage <= 1 ? 'disabled class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-300 cursor-not-allowed text-xs font-bold"' : 'class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"'}>
                        <i class="fas fa-chevron-left mr-1"></i>Əvvəlki
                    </button>
            `;

            // Max 5 page numbers
            let startP = Math.max(1, this.vacancyCurrentPage - 2);
            let endP = Math.min(totalPages, startP + 4);
            if (endP - startP < 4) startP = Math.max(1, endP - 4);

            for (let p = startP; p <= endP; p++) {
                const isActive = p === this.vacancyCurrentPage;
                pagHtml += `
                    <button onclick="app.setVacancyPage(${p})" class="w-8 h-8 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xs' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'}">
                        ${p}
                    </button>
                `;
            }

            pagHtml += `
                    <button onclick="app.setVacancyPage(${Math.min(totalPages, this.vacancyCurrentPage + 1)})" ${this.vacancyCurrentPage >= totalPages ? 'disabled class="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-300 cursor-not-allowed text-xs font-bold"' : 'class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"'}>
                        Növbəti<i class="fas fa-chevron-right ml-1"></i>
                    </button>
                </div>
            `;
            pagContainer.innerHTML = pagHtml;
        }
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

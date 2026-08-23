/**
 * SkillMap Azerbaijan - Süni İntellekt Karyera Məsləhətçisi və Müsahibə Simulyatoru (SkillBot AI Pro)
 * Fərdi tələbə profilini tanıyan, müsahibə sualları verən və karyera qərar dəstəyi göstərən qabaqcıl mühərrik.
 */

class SkillBot {
    constructor() {
        this.isOpen = false;
        this.isExpanded = false;
        this.isInterviewMode = false;
        this.currentInterviewQuestion = null;
        this.interviewQuestionIndex = 0;

        // Müsahibə Sualları Bazası (Azərbaycan Korporativ Standartları)
        this.interviewQuestions = [
            {
                role: "data_analyst",
                question: "PAŞA Bank Data Analytics Müsahibəsi:\n\n**Sual:** SQL-də `WHERE` və `HAVING` açar sözlərinin əsas fərqi nədir və hansı hallarda `HAVING` istifadə etmək məcburidir?",
                keywords: ["aggregate", "group by", "filtr", "aqreqat", "funksiya", "əvvəl", "sonra", "sum", "count", "avg"],
                modelAnswer: "Əla cavab! Əsas fərq odur ki, `WHERE` sətirləri aqreqasiyadan (GROUP BY) ƏVVƏL filtr edir və aqreqat funksiyaları (SUM, COUNT, AVG) ilə işləmir. `HAVING` isə `GROUP BY` nəticəsində yaranmış aqreqat qruplarını filtr etmək üçün istifadə olunur."
            },
            {
                role: "data_analyst",
                question: "ABB Data Müsahibəsi:\n\n**Sual:** Excel və Power BI-da 'Data Modeling' edərkən **Star Schema (Ulduz Sxemi)** ilə **Snowflake Sxemi** arasındakı fərq nədir? Hansı Power BI üçün daha sürətlidir?",
                keywords: ["ulduz", "star", "snowflake", "fakt", "ölçü", "dimension", "fact", "sürətli", "normal"],
                modelAnswer: "Düzgün yanaşma! Star Schema-da fakt cədvəli birbaşa denormallaşdırılmış ölçü (dimension) cədvəllərinə bağlanır və Power BI VertiPaq mühərriki üçün ən sürətli sxemdir. Snowflake-də isə ölçü cədvəlləri normallaşdırılıb alt qruplara bölünür."
            },
            {
                role: "financial_analyst",
                question: "Kapital Bank Maliyyə Müsahibəsi:\n\n**Sual:** Maliyyə modelləşdirməsində **NPV (Net Present Value)** və **IRR (Internal Rate of Return)** nədir? Layihəyə investisiya qərarı verərkən hansına üstünlük verilir?",
                keywords: ["diskont", "dəyər", "gəlirlilik", "investisiya", "faiz", "müsbət", "kapital"],
                modelAnswer: "Tamamilə doğrudur! NPV pulun zaman dəyərini nəzərə alaraq gələcək pul axınlarının cari xalis dəyərini göstərir (NPV > 0 olmalıdır). IRR isə NPV-ni sıfıra bərabər edən daxili gəlirlilik dərəcəsidir. Ölçü və fərqli miqyaslı layihələrdə NPV həmişə daha etibarlı qərarvericidir."
            }
        ];

        this.init();
    }

    init() {
        this.renderWidget();
    }

    renderWidget() {
        const existing = document.getElementById("chat-widget-container");
        if (existing) existing.remove();

        const container = document.createElement("div");
        container.id = "chat-widget-container";
        container.className = "fixed bottom-6 right-6 z-50 flex flex-col items-end no-print";

        container.innerHTML = `
            <!-- Çatbot Pəncərəsi -->
            <div id="chat-window" class="hidden mb-3 w-[360px] sm:w-[410px] h-[540px] bg-white rounded-3xl chat-window border border-slate-200/80 overflow-hidden flex-col transition-all duration-300 shadow-2xl" style="display: none;">
                <!-- Başlıq -->
                <div class="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                            <i class="fas fa-robot text-sm"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <h4 class="font-bold text-sm text-white">SkillBot AI Pro</h4>
                                <span class="px-1.5 py-0.2 text-[9px] font-black rounded bg-emerald-500 text-white">CANLI</span>
                            </div>
                            <p class="text-[10px] text-slate-400" id="chat-user-status">Karyera & Müsahibə Məsləhətçiniz</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-1">
                        <button onclick="window.skillBotInstance.toggleExpand()" class="text-slate-400 hover:text-white p-1.5 rounded-lg text-xs transition-colors" title="Böyüt / Kiçilt">
                            <i class="fas fa-expand" id="chat-expand-icon"></i>
                        </button>
                        <button onclick="window.skillBotInstance.clearChat()" class="text-slate-400 hover:text-white p-1.5 rounded-lg text-xs transition-colors" title="Tarixçəni Təmizlə">
                            <i class="fas fa-rotate-left"></i>
                        </button>
                        <button onclick="window.skillBotInstance.toggleChat()" class="text-slate-400 hover:text-white p-1.5 rounded-lg text-sm ml-1 transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Mesajlar Sahəsi -->
                <div id="chat-messages" class="flex-grow p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/60">
                    <!-- Giriş Mesajı -->
                    <div class="chat-bubble-bot p-4 rounded-2xl max-w-[90%] space-y-2 shadow-2xs">
                        <p class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i class="fas fa-sparkles text-indigo-600"></i> Salam! Mən sizin Fərdi Karyera AI Məsləhətçinizəm.
                        </p>
                        <p class="text-slate-600 leading-relaxed">
                            Mən sizin profilinizə, bacarıqlarınıza və Azərbaycanın 420 real vakansiyasına (Jobsearch.az) bələdəm. Sizə necə kömək edə bilərəm?
                        </p>
                    </div>

                    <!-- İnteraktiv Təklif Düymələri -->
                    <div class="space-y-1.5 pt-1">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tövsiyə olunan əmrlər:</p>
                        <div class="flex flex-wrap gap-1.5">
                            <button onclick="window.skillBotInstance.analyzeUserProfile()" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px] shadow-2xs transition-all flex items-center gap-1">
                                <i class="fas fa-user-check text-indigo-600"></i> Profilimi Analiz Et
                            </button>
                            <button onclick="window.skillBotInstance.startInterviewSimulation()" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px] shadow-2xs transition-all flex items-center gap-1">
                                <i class="fas fa-clipboard-question text-indigo-600"></i> Müsahibə Sualları Ver
                            </button>
                            <button onclick="window.skillBotInstance.sendQuickPrompt('Data Analitiklərin Bakıda orta maaşı nə qədərdir?')" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px] shadow-2xs transition-all flex items-center gap-1">
                                <i class="fas fa-money-bill-wave text-emerald-600"></i> Bakı Maaşları
                            </button>
                            <button onclick="window.skillBotInstance.sendQuickPrompt('SQL və Power BI üçün ən yaxşı pulsuz kurslar')" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[11px] shadow-2xs transition-all flex items-center gap-1">
                                <i class="fas fa-graduation-cap text-amber-600"></i> Pulsuz Kurslar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Yazır... İndikatoru -->
                <div id="chat-typing-indicator" class="hidden px-4 py-2 bg-slate-50/90 text-slate-500 text-xs flex items-center gap-2 border-t border-slate-100">
                    <div class="typing-dots flex items-center gap-1">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="text-[11px] font-medium text-slate-400">SkillBot cavab hazırlayır...</span>
                </div>

                <!-- Daxiletmə Sahəsi -->
                <div class="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                    <input type="text" id="chat-input" onkeypress="if(event.key==='Enter') window.skillBotInstance.sendMessage()" placeholder="Sualınızı və ya cavabınızı yazın..." class="flex-grow text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <button onclick="window.skillBotInstance.sendMessage()" class="w-9 h-9 rounded-xl btn-saas-primary text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <i class="fas fa-paper-plane text-xs"></i>
                    </button>
                </div>
            </div>

            <!-- Əsas Çatbot Açma Düyməsi -->
            <button onclick="window.skillBotInstance.toggleChat()" class="chat-fab-btn w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-2xl hover:scale-105 transition-all group relative cursor-pointer" title="SkillBot AI ilə danış">
                <i class="fas fa-robot text-white group-hover:scale-110 transition-transform"></i>
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white animate-pulse"></span>
            </button>
        `;

        document.body.appendChild(container);
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const win = document.getElementById("chat-window");
        if (win) {
            if (this.isOpen) {
                win.classList.remove("hidden");
                win.style.display = "flex";
                this.updateUserContext();
                setTimeout(() => document.getElementById("chat-input").focus(), 100);
            } else {
                win.classList.add("hidden");
                win.style.display = "none";
            }
        }
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        const win = document.getElementById("chat-window");
        const icon = document.getElementById("chat-expand-icon");
        if (win && icon) {
            if (this.isExpanded) {
                win.classList.add("expanded");
                icon.className = "fas fa-compress";
            } else {
                win.classList.remove("expanded");
                icon.className = "fas fa-expand";
            }
        }
    }

    clearChat() {
        const container = document.getElementById("chat-messages");
        if (container) {
            container.innerHTML = `
                <div class="chat-bubble-bot p-4 rounded-2xl max-w-[90%] space-y-2 shadow-sm">
                    <p class="font-bold text-slate-900 flex items-center gap-1.5">
                        <i class="fas fa-sparkles text-orange-600"></i> Tarixçə təmizləndi.
                    </p>
                    <p class="text-slate-600 leading-relaxed">
                        İstənilən sualınızı yaza və ya <strong>«Müsahibə Sualları Ver»</strong> düyməsi ilə biliklərinizi yoxlaya bilərsiniz!
                    </p>
                </div>
            `;
            this.isInterviewMode = false;
            this.currentInterviewQuestion = null;
        }
    }

    updateUserContext() {
        const statusElem = document.getElementById("chat-user-status");
        if (window.app && window.app.auth && window.app.auth.isLoggedIn()) {
            const user = window.app.auth.currentUser;
            statusElem.textContent = `Aktiv Profil: ${user.name} (${user.university})`;
        } else {
            statusElem.textContent = "Karyera & Müsahibə Məsləhətçiniz";
        }
    }

    sendQuickPrompt(prompt) {
        document.getElementById("chat-input").value = prompt;
        this.sendMessage();
    }

    // 1. FƏRDİ PROFİL ANALİZİ FUNKSİYASI
    analyzeUserProfile() {
        this.appendMessage("Mənim profilimi və bacarıqlarımı analiz et", "user");
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();

            let reply = "";
            if (window.app && window.app.auth && window.app.auth.isLoggedIn()) {
                const user = window.app.auth.currentUser;
                const skills = window.app.currentSkills || {};
                const targetRole = window.app.data.jobRolesBenchmark.find(r => r.id === user.targetRole) || window.app.data.jobRolesBenchmark[0];

                const excel = skills['excel'] || 70;
                const sql = skills['sql'] || 35;
                const powerbi = skills['powerbi'] || 40;

                reply = `📊 **Fərdi Karyera Audit Hesabatı:**\n\n` +
                    `👤 **Namizəd:** ${user.name} (${user.university} – ${user.faculty})\n` +
                    `🎯 **Hədəf Vəzifə:** ${targetRole.title}\n\n` +
                    `💡 **Əsas Nəticələr:**\n` +
                    `• **Güclü Tərəfiniz:** Excel (${excel}%) və Baza İqtisadi Təhsiliniz bazara çox uyğundur.\n` +
                    `• ⚠️ **Kritik Boşluğunuz:** SQL (${sql}%) və Power BI (${powerbi}%) şirkətlərin (PAŞA Bank, ABB) tələb etdiyi 80% standartından aşağıdır.\n\n` +
                    `💰 **Maaş Potensialı:** Bu iki boşluğu bağlasanız, bazar dəyəriniz **1 400 AZN-dən 2 200 AZN-ə (+57%)** yüksələcək!\n\n` +
                    `👇 **Növbəti addım üçün nə etmək istəyirsiniz?**`;
                
                this.appendMessage(reply, "bot", [
                    { label: "📊 Fərdi Gap Cədvəlinə Get", action: "app.switchTab('student-gap')" },
                    { label: "🎯 Müsahibə Sualı ilə Sına", action: "window.skillBotInstance.startInterviewSimulation()" }
                ]);
            } else {
                reply = `Siz hələ profil yaratmamısınız! Fərdi analiz almaq üçün yuxarı sağdakı **«Kabinetə Daxil Ol»** düyməsinə klikləyərək daxil olun və ya qeydiyyatdan keçin.`;
                this.appendMessage(reply, "bot", [
                    { label: "🔐 Kabinetə Giriş Et", action: "app.openAuthModal('login')" }
                ]);
            }
        }, 600);
    }

    // 2. MÜSAHİBƏ SİMULYATORU
    startInterviewSimulation() {
        this.isInterviewMode = true;
        const qObj = this.interviewQuestions[this.interviewQuestionIndex % this.interviewQuestions.length];
        this.currentInterviewQuestion = qObj;
        this.interviewQuestionIndex++;

        this.appendMessage("Məni müsahibə sualı ilə sına", "user");
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            const msg = `🎯 **Müsahibə Simulyasiyası Başladı!**\n\n${qObj.question}\n\n*Aşağıdakı xanaya cavabınızı yazın, mən sizin cavabınızı təhlil edib qiymətləndirəcəyəm.* ✍️`;
            this.appendMessage(msg, "bot");
        }, 500);
    }

    sendMessage() {
        const input = document.getElementById("chat-input");
        const query = input.value.trim();
        if (!query) return;

        this.appendMessage(query, "user");
        input.value = "";
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();

            // Əgər istifadəçi müsahibə sualına cavab verirsə
            if (this.isInterviewMode && this.currentInterviewQuestion) {
                this.evaluateInterviewAnswer(query);
                return;
            }

            // Normal sual-cavab
            const replyObj = this.generateSmartResponse(query);
            this.appendMessage(replyObj.text, "bot", replyObj.actions);
        }, 600);
    }

    evaluateInterviewAnswer(userAnswer) {
        const qObj = this.currentInterviewQuestion;
        const lower = userAnswer.toLowerCase();
        
        let matchCount = 0;
        qObj.keywords.forEach(kw => {
            if (lower.includes(kw)) matchCount++;
        });

        let feedback = "";
        if (matchCount >= 2) {
            feedback = `🏆 **ƏLA NƏTİCƏ! (9/10 Xal)**\n\nSiz sualın əsas məğzini düzgün izah etdiniz.\n\n📖 **Etalon Ekspert İzahı:**\n${qObj.modelAnswer}`;
        } else {
            feedback = `💡 **Yaxşı cəhddir! (6/10 Xal)**\n\nCavabınızda bir neçə texniki nüans çatışmır.\n\n📖 **Etalon Ekspert İzahı:**\n${qObj.modelAnswer}`;
        }

        this.isInterviewMode = false;
        this.currentInterviewQuestion = null;

        this.appendMessage(feedback, "bot", [
            { label: "⏭ Növbəti Müsahibə Sualı", action: "window.skillBotInstance.startInterviewSimulation()" },
            { label: "💼 Bu Vəzifənin Vakansiyalarına Bax", action: "app.switchTab('live-vacancies')" }
        ]);
    }

    generateSmartResponse(query) {
        const lower = query.toLowerCase();

        // 1. Profil analizi
        if (lower.includes("profil") || lower.includes("mənim vəziyyətim") || lower.includes("mən kiməm")) {
            return {
                text: "Profilinizi təhlil edirəm...",
                actions: [{ label: "📊 Profilimi Tam Analiz Et", action: "window.skillBotInstance.analyzeUserProfile()" }]
            };
        }

        // 2. Müsahibə
        if (lower.includes("müsahibə") || lower.includes("intervyu") || lower.includes("sına") || lower.includes("sual ver")) {
            this.startInterviewSimulation();
            return { text: "Müsahibə sualı hazırlanır..." };
        }

        // 3. SQL öyrənmək
        if (lower.includes("sql") || lower.includes("verilənlər bazası")) {
            return {
                text: `🗄️ **SQL Öyrənmə Yol Xəritəsi:**\n\n` +
                    `Azərbaycan banklarında (PAŞA Bank, ABB, Kapital Bank) ən çox tələb olunan SQL mövzuları:\n` +
                    `1. **Baza:** SELECT, WHERE, GROUP BY, HAVING, ORDER BY\n` +
                    `2. **Cədvəl Birləşmələri:** INNER JOIN, LEFT JOIN, FULL OUTER JOIN\n` +
                    `3. **Qabaqcıl:** Window Functions (\`ROW_NUMBER()\`, \`DENSE_RANK()\`, \`LEAD/LAG\`)\n\n` +
                    `🔗 **Tövsiyə olunan pulsuz təlim:** Kaggle SQL & LeetCode 50 SQL Study Plan.`,
                actions: [
                    { label: "🌐 Kaggle SQL Təlimi", url: "https://www.kaggle.com/learn/intro-to-sql" },
                    { label: "🎯 Məni SQL-dən Sına", action: "window.skillBotInstance.startInterviewSimulation()" }
                ]
            };
        }

        // 4. Power BI
        if (lower.includes("power bi") || lower.includes("powerbi") || lower.includes("dax")) {
            return {
                text: `📈 **Microsoft Power BI Təlim Tövsiyəsi:**\n\n` +
                    `Azərbaycan əmək bazarında Power BI bilən namizədlərə tələbat **+68% artıb**.\n` +
                    `Öyrənməli olduğunuz 3 sütun:\n` +
                    `• **Data Transformasiyası:** Power Query ilə təmizləmə\n` +
                    `• **Modelləşdirmə:** Star Schema əlaqələri\n` +
                    `• **DAX Düsturları:** CALCULATE, FILTER, RELATED, SUMX\n\n` +
                    `Rəsmi Sertifikat: **Microsoft Certified: Power BI Data Analyst (PL-300)**.`,
                actions: [
                    { label: "🌐 Microsoft Learn PL-300", url: "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/" }
                ]
            };
        }

        // 5. Maaşlar
        if (lower.includes("maaş") || lower.includes("əməkhaqqı") || lower.includes("qazanc") || lower.includes("baku")) {
            return {
                text: `💰 **Azərbaycan Bazarı üzrə 2026 Maaş Göstəriciləri:**\n\n` +
                    `• **Junior Data Analyst:** 1 000 – 1 500 AZN\n` +
                    `• **Middle Data Analyst (SQL+PowerBI):** 1 800 – 2 800 AZN\n` +
                    `• **Senior / Lead BI Strategist:** 3 500 – 5 000+ AZN\n` +
                    `• **Maliyyə Analitiki (ACCA / FMVA):** 1 600 – 3 200 AZN\n\n` +
                    `📍 Ən yüksək maaşlar **Səbail və Nəsimi** rayonlarındakı baş ofislərdə təklif olunur.`,
                actions: [
                    { label: "🗺️ Bakı Rayonları Maaş Xəritəsi", action: "app.switchTab('interactive-map')" },
                    { label: "📋 Canlı Vakansiyalara Bax", action: "app.switchTab('live-vacancies')" }
                ]
            };
        }

        // 6. Şirkətlər
        if (lower.includes("pasa") || lower.includes("paşa") || lower.includes("abb") || lower.includes("şirkət") || lower.includes("bank")) {
            return {
                text: `🏦 **Azərbaycanın Top Data & Maliyyə İşəgötürənləri:**\n\n` +
                    `1. **PAŞA Bank & Holdinq:** Əsas tələblər — SQL, Power BI, Advanced Excel, İngilis dili.\n` +
                    `2. **ABB (Azərbaycan Beynəlxalq Bankı):** Risklərin idarə edilməsi, Maliyyə modelləşdirməsi.\n` +
                    `3. **Azercell:** Böyük data (Big Data), Python, Telekom analitikası.\n` +
                    `4. **Trendyol Azərbaycan:** E-ticarət analitikası, SQL və sürətli qərarvermə.`,
                actions: [
                    { label: "💼 Şirkətlərin Canlı Vakansiyaları", action: "app.switchTab('live-vacancies')" }
                ]
            };
        }

        // 7. Universitetlər
        if (lower.includes("unec") || lower.includes("banm") || lower.includes("bdu") || lower.includes("ada")) {
            return {
                text: `🎓 **Universitetlər üzrə Əsas Bazar İntellekti:**\n\n` +
                    `• **UNEC:** Maliyyə nəzəriyyəsi çox güclüdür, lakin tələbələrə praktiki **SQL və Power BI laboratoriyaları** lazımdır.\n` +
                    `• **BANM:** Mühəndislik və proqramlaşdırma yüksəkdir, biznes/maliyyə tətbiqləri artırılmalıdır.\n` +
                    `• **ADA:** Beynəlxalq ingilis dili və komanda işi əladır.`,
                actions: [
                    { label: "🏛️ Universitet Dashboard-u", action: "app.switchTab('university-dash')" }
                ]
            };
        }

        // Standart intellektual cavab
        return {
            text: `Maraqlı sualdır! Seçdiyiniz istiqamət üzrə sizə kömək edə bilərəm:\n\n` +
                `1. **«Profilimi analiz et»** — Cari bacarıqlarınız və çatışmayan boşluqlar haqqında fərdi hesabat.\n` +
                `2. **«Müsahibə sualı ver»** — Real bank və İT şirkətlərinin texniki sualları ilə sınaq.\n` +
                `3. **«Maaşlar»** — Bakı rayonları və vəzifələr üzrə cari əməkhaqqı statistikası.`,
            actions: [
                { label: "👤 Profilimi Analiz Et", action: "window.skillBotInstance.analyzeUserProfile()" },
                { label: "🎯 Müsahibə Sualları Ver", action: "window.skillBotInstance.startInterviewSimulation()" }
            ]
        };
    }

    showTyping() {
        const el = document.getElementById("chat-typing-indicator");
        if (el) el.classList.remove("hidden");
    }

    hideTyping() {
        const el = document.getElementById("chat-typing-indicator");
        if (el) el.classList.add("hidden");
    }

    appendMessage(text, sender, actions = []) {
        const container = document.getElementById("chat-messages");
        if (!container) return;

        const div = document.createElement("div");
        div.className = sender === "user" 
            ? "chat-bubble-user p-3 rounded-2xl max-w-[85%] ml-auto text-xs shadow-sm"
            : "chat-bubble-bot p-4 rounded-2xl max-w-[90%] text-xs shadow-sm leading-relaxed space-y-2.5";

        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        
        let actionsHtml = "";
        if (actions && actions.length > 0) {
            actionsHtml = `<div class="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">`;
            actions.forEach(act => {
                if (act.url) {
                    actionsHtml += `<a href="${act.url}" target="_blank" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 shadow-2xs transition-all">${act.label} <i class="fas fa-arrow-up-right-from-square text-[9px]"></i></a>`;
                } else if (act.action) {
                    actionsHtml += `<button onclick="${act.action}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800 font-bold text-[11px] border border-slate-200 shadow-2xs transition-all">${act.label}</button>`;
                }
            });
            actionsHtml += `</div>`;
        }

        div.innerHTML = `<div>${formattedText}</div>${actionsHtml}`;

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.skillBotInstance = new SkillBot();
});

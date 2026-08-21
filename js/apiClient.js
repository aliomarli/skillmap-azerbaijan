/**
 * SkillMap Azerbaijan - REST API Client (apiClient.js)
 * Connects frontend to backend REST API (http://127.0.0.1:8000/api) with automatic offline fallback.
 */

class SkillMapApiClient {
    constructor(baseUrl = "http://127.0.0.1:8000/api") {
        this.baseUrl = baseUrl;
        this.isOnline = false;
        this.checkServer();
    }

    async checkServer() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);
            const res = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                this.isOnline = true;
                console.log("[SkillMap API Client] Connected to Backend REST API:", data);
                this.updateApiBadge(true);
                return true;
            }
        } catch (e) {
            this.isOnline = false;
            console.log("[SkillMap API Client] Backend server offline. Using embedded SkillMapData fallback.");
            this.updateApiBadge(false);
        }
        return false;
    }

    updateApiBadge(online) {
        const badge = document.getElementById("api-status-badge");
        if (badge) {
            if (online) {
                badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200";
                badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Live Backend API (127.0.0.1:8000)`;
            } else {
                badge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200";
                badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Lokal Baza (Offline)`;
            }
        }
    }

    async getJobs(params = {}) {
        if (this.isOnline) {
            try {
                const query = new URLSearchParams(params).toString();
                const res = await fetch(`${this.baseUrl}/jobs?${query}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("[SkillMap API Client] API Error, falling back to local data:", e);
            }
        }
        const localVacancies = window.SkillMapData ? window.SkillMapData.liveVacancies : [];
        return { total: localVacancies.length, jobs: localVacancies };
    }

    async getJobById(id) {
        if (this.isOnline) {
            try {
                const res = await fetch(`${this.baseUrl}/jobs/${id}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("[SkillMap API Client] API Error:", e);
            }
        }
        const localVacancies = window.SkillMapData ? window.SkillMapData.liveVacancies : [];
        return localVacancies.find(v => v.id === id) || null;
    }

    async getSkillsAnalytics() {
        if (this.isOnline) {
            try {
                const res = await fetch(`${this.baseUrl}/analytics/skills`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("[SkillMap API Client] API Error:", e);
            }
        }
        return window.SkillMapData ? window.SkillMapData.macroMarketStats : null;
    }

    async getSkillGapsAnalytics() {
        if (this.isOnline) {
            try {
                const res = await fetch(`${this.baseUrl}/analytics/skills/gaps`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("[SkillMap API Client] API Error:", e);
            }
        }
        return {
            status: "ready",
            sample_size: 420,
            disclaimer: "Based on current collected Jobsearch.az sample (n=420)"
        };
    }

    async getSectorsAnalytics() {
        if (this.isOnline) {
            try {
                const res = await fetch(`${this.baseUrl}/analytics/sectors`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("[SkillMap API Client] API Error:", e);
            }
        }
        return window.SkillMapData ? window.SkillMapData.macroMarketStats.sectorDistribution : [];
    }

    async calculateSkillGap(roleId, skills) {
        if (this.isOnline) {
            try {
                const res = await fetch(`${this.baseUrl}/student/skill-gap`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role_id: roleId, skills: skills })
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("[SkillMap API Client] API Error:", e);
            }
        }
        if (window.app && window.app.engine) {
            return window.app.engine.calculateGap(roleId, skills);
        }
        return null;
    }

    async extractSkillsNLP(text) {
        if (this.isOnline) {
            try {
                const res = await fetch(`${this.baseUrl}/nlp/extract-skills`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: text })
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("[SkillMap API Client] API Error:", e);
            }
        }
        if (window.app && window.app.nlpSim) {
            return window.app.nlpSim.simulateExtraction(text);
        }
        return null;
    }
}

if (typeof window !== "undefined") {
    window.SkillMapApiClient = SkillMapApiClient;
}
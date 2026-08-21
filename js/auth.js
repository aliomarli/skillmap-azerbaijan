/**
 * SkillMap Azerbaijan - Təhlükəsiz Giriş, Şifrə və Profil İdarəetməsi (auth.js)
 * Çoxistifadəçili qeydiyyat, şifrə ilə autentifikasiya və fərdi profil məlumat bazası.
 */

class AuthManager {
    constructor() {
        this.DB_KEY = "skillmap_users_db";
        this.SESSION_KEY = "skillmap_session_user";
        this.initDatabase();
        this.currentUser = this.loadSession();
    }

    initDatabase() {
        let db = this.getDatabase();
        if (!db || Object.keys(db).length === 0) {
            // Standart demo istifadəçi yaradılır
            db = {
                "demo@unec.edu.az": {
                    id: "std_unec_101",
                    email: "demo@unec.edu.az",
                    password: "password123",
                    name: "Nurlan Əliyev",
                    university: "UNEC",
                    faculty: "Maliyyə və Rəqəmsal İqtisadiyyat",
                    targetRole: "data_analyst",
                    degree: "Bakalavr",
                    englishLevel: "B2",
                    gpa: "88.4",
                    studentId: "AZ-UNEC-2026-8492",
                    isVerified: true,
                    joinedDate: "15.01.2026",
                    savedSkills: {
                        "excel": 85,
                        "sql": 40,
                        "powerbi": 45,
                        "python": 30,
                        "analytical_thinking": 85,
                        "english": 75
                    }
                }
            };
            localStorage.setItem(this.DB_KEY, JSON.stringify(db));
        }
    }

    getDatabase() {
        try {
            const data = localStorage.getItem(this.DB_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    saveDatabase(db) {
        localStorage.setItem(this.DB_KEY, JSON.stringify(db));
    }

    loadSession() {
        try {
            const session = localStorage.getItem(this.SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch (e) {
            return null;
        }
    }

    saveSession(user) {
        this.currentUser = user;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    }

    register(email, password, name, university, faculty, targetRole, degree, englishLevel) {
        const cleanEmail = email.toLowerCase().trim();
        const db = this.getDatabase();

        if (db[cleanEmail]) {
            throw new Error("Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib. Zəhmət olmasa 'Daxil Ol' bölməsindən istifadə edin.");
        }

        if (password.length < 6) {
            throw new Error("Şifrə ən azı 6 simvoldan ibarət olmalıdır.");
        }

        const newUser = {
            id: "std_" + Date.now(),
            email: cleanEmail,
            password: password,
            name: name.trim() || "Tələbə",
            university: university || "UNEC",
            faculty: faculty.trim() || "İqtisadiyyat",
            targetRole: targetRole || "data_analyst",
            degree: degree || "Bakalavr",
            englishLevel: englishLevel || "B2",
            gpa: "85.0",
            studentId: `AZ-${university.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
            isVerified: true,
            joinedDate: new Date().toLocaleDateString("az-AZ"),
            savedSkills: {
                "excel": 70,
                "sql": 30,
                "powerbi": 30,
                "analytical_thinking": 75,
                "english": 70
            }
        };

        db[cleanEmail] = newUser;
        this.saveDatabase(db);
        this.saveSession(newUser);
        return newUser;
    }

    login(email, password) {
        const cleanEmail = email.toLowerCase().trim();
        const db = this.getDatabase();
        const user = db[cleanEmail];

        if (!user) {
            throw new Error("Bu e-poçt ilə qeydiyyatdan keçmiş istifadəçi tapılmadı.");
        }

        if (user.password !== password) {
            throw new Error("Şifrə yanlışdır. Yenidən cəhd edin.");
        }

        this.saveSession(user);
        return user;
    }

    updateSkills(skills) {
        if (!this.currentUser) return;
        this.currentUser.savedSkills = { ...skills };
        this.saveSession(this.currentUser);

        const db = this.getDatabase();
        if (db[this.currentUser.email]) {
            db[this.currentUser.email].savedSkills = { ...skills };
            this.saveDatabase(db);
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.SESSION_KEY);
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }
}

if (typeof window !== "undefined") {
    window.AuthManager = AuthManager;
}

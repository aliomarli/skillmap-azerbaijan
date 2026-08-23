/**
 * SkillMap Azerbaijan - Təhlükəsiz Giriş, Şifrə və Profil İdarəetməsi (auth.js)
 * Çoxistifadəçili qeydiyyat, şifrə ilə autentifikasiya və fərdi profil məlumat bazası.
 */

class AuthManager {
    constructor() {
        this.DB_KEY = 'skillmap_users_db';
        this.SESSION_KEY = 'skillmap_session_user';
        this.initDatabase();
        this.currentUser = this.loadSession();
    }

    initDatabase() {
        let db = this.getDatabase();
        if (!db) {
            db = {};
            localStorage.setItem(this.DB_KEY, JSON.stringify(db));
        }
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
            throw new Error('Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib. Zəhmət olmasa Daxil Ol bölməsindən istifadə edin.');
        }

        if (password.length < 6) {
            throw new Error('Şifrə ən azı 6 simvoldan ibarət olmalıdır.');
        }

        const newUser = {
            id: 'std_' + Date.now(),
            email: cleanEmail,
            password: password,
            name: name.trim() || 'Tələbə',
            university: university || 'UNEC',
            faculty: faculty.trim() || 'Maliyyə və İqtisadiyyat',
            targetRole: targetRole || 'financial_analyst',
            targetSector: 'Bank & Maliyyə',
            degree: degree || 'Bakalavr',
            graduationYear: '2026',
            experience_years: 0,
            employmentStatus: 'Tələbə / Məzun',
            englishLevel: englishLevel || 'B2',
            otherLanguages: 'Azərbaycan dili (Ana dili)',
            gpa: '85.0',
            studentId: AZ--,
            isVerified: true,
            joinedDate: new Date().toLocaleDateString('az-AZ'),
            savedSkills: {
                'excel': 4,
                'financial_analysis': 3,
                'analytical_thinking': 4,
                'english': 4
            },
            skillSources: {
                'excel': 'user-added',
                'financial_analysis': 'user-added',
                'analytical_thinking': 'user-added',
                'english': 'user-added'
            },
            uploadedCV: null,
            cvVersions: []
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
            throw new Error('Bu e-poçt ilə qeydiyyatdan keçmiş istifadəçi tapılmadı.');
        }

        if (user.password !== password) {
            throw new Error('Şifrə yanlışdır. Yenidən cəhd edin.');
        }

        this.saveSession(user);
        return user;
    }

    updateProfile(fields = {}) {
        if (!this.currentUser) return;
        Object.assign(this.currentUser, fields);
        this.saveSession(this.currentUser);

        const db = this.getDatabase();
        if (db[this.currentUser.email]) {
            Object.assign(db[this.currentUser.email], fields);
            this.saveDatabase(db);
        }
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

    setSkill(skillId, level, source = 'user-added') {
        if (!this.currentUser) return;
        if (!this.currentUser.savedSkills) this.currentUser.savedSkills = {};
        if (!this.currentUser.skillSources) this.currentUser.skillSources = {};

        this.currentUser.savedSkills[skillId] = parseInt(level, 10) || 1;
        this.currentUser.skillSources[skillId] = source;

        this.updateProfile({
            savedSkills: this.currentUser.savedSkills,
            skillSources: this.currentUser.skillSources
        });
    }

    removeSkill(skillId) {
        if (!this.currentUser || !this.currentUser.savedSkills) return;
        delete this.currentUser.savedSkills[skillId];
        if (this.currentUser.skillSources) delete this.currentUser.skillSources[skillId];

        this.updateProfile({
            savedSkills: this.currentUser.savedSkills,
            skillSources: this.currentUser.skillSources
        });
    }

    saveParsedCV(parsedCV) {
        if (!this.currentUser) return;
        this.currentUser.uploadedCV = parsedCV;

        // Auto-merge extracted skills
        if (parsedCV.skills) {
            if (!this.currentUser.savedSkills) this.currentUser.savedSkills = {};
            if (!this.currentUser.skillSources) this.currentUser.skillSources = {};

            Object.entries(parsedCV.skills).forEach(([sId, sObj]) => {
                this.currentUser.savedSkills[sId] = sObj.level || 3;
                this.currentUser.skillSources[sId] = 'cv-derived';
            });
        }

        // Auto-merge profile info if confirmed
        if (parsedCV.personalInfo && parsedCV.personalInfo.name) {
            this.currentUser.name = parsedCV.personalInfo.name;
        }
        if (parsedCV.education) {
            if (parsedCV.education.university) this.currentUser.university = parsedCV.education.university;
            if (parsedCV.education.degree) this.currentUser.degree = parsedCV.education.degree;
            if (parsedCV.education.field) this.currentUser.faculty = parsedCV.education.field;
        }
        if (parsedCV.experience) {
            this.currentUser.experience_years = parsedCV.experience.totalYears || 0;
            this.currentUser.employmentStatus = parsedCV.experience.employmentStatus || 'Tələbə';
        }
        if (parsedCV.languages && parsedCV.languages.englishLevel) {
            this.currentUser.englishLevel = parsedCV.languages.englishLevel;
        }

        this.updateProfile(this.currentUser);
    }

    deleteCV() {
        if (!this.currentUser) return;
        this.currentUser.uploadedCV = null;
        this.currentUser.cvVersions = [];
        this.updateProfile({
            uploadedCV: null,
            cvVersions: []
        });
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.SESSION_KEY);
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }
}

if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}

/**
 * SkillMap Azerbaijan - Təhlükəsiz Giriş, Şifrə və Profil İdarəetməsi (auth.js)
 * Çoxistifadəçili qeydiyyat, şifrə ilə autentifikasiya və fərdi profil məlumat bazası.
 */

class AuthManager {
    constructor() {
        this.DB_KEY = 'skillmap_users_db';
        this.SESSION_KEY = 'skillmap_session_user';
        this.initDatabase();
        this.currentUser = this.loadSession() || this.getDefaultStudent();
    }

    getDefaultStudent() {
        return {
            id: 'std_default_01',
            email: 'ali.omarli@example.com',
            password: 'password123',
            name: 'Əli Ömərli',
            university: 'UNEC',
            faculty: 'Maliyyə və İqtisadiyyat',
            targetRole: 'financial_analyst',
            targetSector: 'Maliyyə',
            degree: 'Bakalavr',
            graduationYear: '2026',
            experience_years: 0,
            employmentStatus: 'Tələbə / Məzun',
            englishLevel: 'B2',
            city: 'Bakı',
            otherLanguages: 'Rus dili (B1), Türk dili',
            gpa: '88.5',
            studentId: 'AZ-UNEC-2026',
            isVerified: true,
            joinedDate: '15 Fevral 2026',
            savedSkills: {
                'excel': 4,
                'financial_analysis': 3,
                'analytical_thinking': 4,
                'english': 4,
                'sql': 2,
                'power_bi': 2,
                'accounting_1c': 2
            },
            skillSources: {
                'excel': 'user-added',
                'financial_analysis': 'user-added',
                'analytical_thinking': 'user-added',
                'english': 'user-added',
                'sql': 'user-added',
                'power_bi': 'user-added',
                'accounting_1c': 'user-added'
            },
            uploadedCV: {
                name: 'Ali_Omarli_CV_Financial_Analyst.pdf',
                uploadDate: '2026-08-20',
                parsedScore: 88,
                summary: 'UNEC Maliyyə və İqtisadiyyat fakültəsi məzunu, maliyyə təhlili, Excel və analitik düşüncə bacarıqları.'
            },
            cvVersions: []
        };
    }

    initDatabase() {
        let db = this.getDatabase();
        const defaultUser = this.getDefaultStudent();
        if (!db || Object.keys(db).length === 0) {
            db = {};
            db[defaultUser.email] = defaultUser;
            this.saveDatabase(db);
        } else if (!db[defaultUser.email]) {
            db[defaultUser.email] = defaultUser;
            this.saveDatabase(db);
        }
        if (!localStorage.getItem(this.SESSION_KEY)) {
            this.saveSession(defaultUser);
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
            if (session) return JSON.parse(session);
        } catch (e) {}
        return this.getDefaultStudent();
    }

    saveSession(user) {
        this.currentUser = user;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    }

        register(emailOrObj, password, name, university, faculty, targetRole, degree, englishLevel) {
        let email, pass, uName, uUni, uFac, uRole, uDeg, uEng, uSkills, uExp;
        
        if (typeof emailOrObj === "object" && emailOrObj !== null) {
            email = emailOrObj.email;
            pass = emailOrObj.password || "password123";
            uName = emailOrObj.name || "Tələbə";
            uUni = emailOrObj.university || "UNEC";
            uFac = emailOrObj.faculty || "Maliyyə və Mühasibat";
            uRole = emailOrObj.targetRole || "financial_analyst";
            uDeg = emailOrObj.degree || "Bakalavr";
            uEng = emailOrObj.englishLevel || "B2";
            uSkills = emailOrObj.savedSkills;
            uExp = emailOrObj.experience_years !== undefined ? emailOrObj.experience_years : 0;
        } else {
            email = emailOrObj;
            pass = password;
            uName = name;
            uUni = university;
            uFac = faculty;
            uRole = targetRole;
            uDeg = degree;
            uEng = englishLevel;
            uSkills = null;
            uExp = 0;
        }

        if (!email) throw new Error("E-poçt ünvanı daxil edilməlidir.");
        const cleanEmail = email.toLowerCase().trim();
        const db = this.getDatabase();

        if (db[cleanEmail]) {
            throw new Error('Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib. Zəhmət olmasa Daxil Ol bölməsindən istifadə edin.');
        }

        if (pass && pass.length < 6) {
            throw new Error('Şifrə ən azı 6 simvoldan ibarət olmalıdır.');
        }

        const initialSkills = uSkills || {
            'excel': 4,
            'financial_analysis': 3,
            'analytical_thinking': 4,
            'english': 4
        };

        const initialSources = {};
        Object.keys(initialSkills).forEach(k => { initialSources[k] = 'user-added'; });

        const newUser = {
            id: 'std_' + Date.now(),
            email: cleanEmail,
            password: pass,
            name: (uName || '').trim() || 'Tələbə',
            university: uUni || 'UNEC',
            faculty: (uFac || '').trim() || 'Maliyyə və İqtisadiyyat',
            targetRole: uRole || 'financial_analyst',
            targetSector: 'Bank & Maliyyə',
            degree: uDeg || 'Bakalavr',
            graduationYear: '2026',
            experience_years: uExp,
            employmentStatus: 'Tələbə / Məzun',
            englishLevel: uEng || 'B2',
            city: 'Bakı',
            otherLanguages: 'Rus dili (B1), Türk dili',
            gpa: '85.0',
            studentId: 'AZ-UNEC-' + Math.floor(1000 + Math.random() * 9000),
            isVerified: true,
            joinedDate: new Date().toLocaleDateString('az-AZ'),
            savedSkills: initialSkills,
            skillSources: initialSources,
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

        // NOTE: USER NAME IS STRICTLY PRESERVED. CV upload NEVER overwrites user's registered name.

        // Auto-merge educational details
        if (parsedCV.education) {
            if (parsedCV.education.university) this.currentUser.university = parsedCV.education.university;
            if (parsedCV.education.degree) this.currentUser.degree = parsedCV.education.degree;
            if (parsedCV.education.field) this.currentUser.faculty = parsedCV.education.field;
        }

        // Auto-merge experience
        if (parsedCV.experience) {
            if (parsedCV.experience.totalYears !== undefined && parsedCV.experience.totalYears > 0) {
                this.currentUser.experience_years = parsedCV.experience.totalYears;
            }
            this.currentUser.employmentStatus = parsedCV.experience.employmentStatus || 'Tələbə / Məzun';
        }

        // Auto-merge languages
        if (parsedCV.languages) {
            if (parsedCV.languages.englishLevel) this.currentUser.englishLevel = parsedCV.languages.englishLevel;
            if (parsedCV.languages.otherLanguagesStr) this.currentUser.otherLanguages = parsedCV.languages.otherLanguagesStr;
        }

        // Auto-merge city & target career
        if (parsedCV.personalInfo && parsedCV.personalInfo.city) {
            this.currentUser.city = parsedCV.personalInfo.city;
        }
        if (parsedCV.targetCareer) {
            if (parsedCV.targetCareer.sector) this.currentUser.targetSector = parsedCV.targetCareer.sector;
            if (parsedCV.targetCareer.role) this.currentUser.targetRole = parsedCV.targetCareer.role;
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

    calculateCompletion(user) {
        if (!user) return { percentage: 0, status: "Profil natamamdır", isComplete: false, breakdown: [], missing: [] };

        const weights = [
            { id: "name", label: "Ad və Soyad", weight: 10, check: () => Boolean(user.name && user.name.trim().length >= 3), action: "document.getElementById('prof-input-name')?.focus()" },
            { id: "email", label: "E-poçt Ünvanı", weight: 5, check: () => Boolean(user.email && user.email.includes('@')), action: "document.getElementById('prof-input-email')?.focus()" },
            { id: "city", label: "Şəhər", weight: 5, check: () => Boolean(user.city && user.city.trim().length > 0), action: "document.getElementById('prof-input-city')?.focus()" },
            { id: "uni", label: "Universitet", weight: 10, check: () => Boolean(user.university && user.university.trim().length > 0), action: "document.getElementById('prof-input-uni')?.focus()" },
            { id: "faculty", label: "Fakültə / İxtisas", weight: 10, check: () => Boolean(user.faculty && user.faculty.trim().length > 0), action: "document.getElementById('prof-input-faculty')?.focus()" },
            { id: "degree", label: "Təhsil Dərəcəsi", weight: 5, check: () => Boolean(user.degree && user.degree.trim().length > 0), action: "document.getElementById('prof-input-degree')?.focus()" },
            { id: "experience", label: "İş Təcrübəsi", weight: 5, check: () => user.experience_years !== undefined && user.experience_years !== null, action: "document.getElementById('prof-input-exp')?.focus()" },
            { id: "english", label: "İngilis Dili", weight: 5, check: () => Boolean(user.englishLevel && user.englishLevel.trim().length > 0), action: "document.getElementById('prof-input-english')?.focus()" },
            { id: "languages", label: "Digər Dillər", weight: 5, check: () => Boolean(user.otherLanguages && user.otherLanguages.trim().length > 0), action: "document.getElementById('prof-input-languages')?.focus()" },
            { id: "sector", label: "Hədəf Sektor", weight: 10, check: () => Boolean(user.targetSector && user.targetSector.trim().length > 0), action: "document.getElementById('prof-input-sector')?.focus()" },
            { id: "role", label: "Hədəf Vəzifə", weight: 10, check: () => Boolean(user.targetRole && user.targetRole.trim().length > 0), action: "document.getElementById('prof-input-role')?.focus()" },
            { id: "skills", label: "Ən azı 3 Təsdiqlənmiş Bacarıq", weight: 10, check: () => Boolean(user.savedSkills && Object.keys(user.savedSkills).length >= 3), action: "app.switchCabinetView('skills')" },
            { id: "cv", label: "CV Sənədi Yüklənməsi", weight: 5, check: () => Boolean(user.uploadedCV), action: "app.openCVUploadModal()" },
            { id: "photo", label: "Profil Şəkli", weight: 5, check: () => Boolean(user.photoUrl), action: "app.openPhotoUploadModal()" }
        ];

        let totalScore = 0;
        const breakdown = [];
        const missing = [];

        weights.forEach(w => {
            const isCompleted = w.check();
            if (isCompleted) totalScore += w.weight;
            breakdown.push({
                id: w.id,
                label: w.label,
                weight: w.weight,
                completed: isCompleted
            });
            if (!isCompleted) {
                missing.push({
                    id: w.id,
                    label: w.label,
                    action: w.action
                });
            }
        });

        const percentage = Math.min(100, Math.max(0, totalScore));
        let status = "Profil natamamdır";
        if (percentage >= 100) status = "Profil tamamlandı ✓";
        else if (percentage >= 80) status = "Profil demək olar ki, tamamlanıb";
        else if (percentage >= 50) status = "Profil qismən tamamlanıb";

        return {
            percentage,
            status,
            isComplete: percentage === 100,
            breakdown,
            missing
        };
    }

    saveProfilePhoto(photoUrl) {
        if (!this.currentUser) return;
        this.currentUser.photoUrl = photoUrl;
        this.updateProfile({ photoUrl });
    }

    removeProfilePhoto() {
        if (!this.currentUser) return;
        this.currentUser.photoUrl = null;
        this.updateProfile({ photoUrl: null });
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

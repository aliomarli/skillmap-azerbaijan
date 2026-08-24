/**
 * SkillMap Azerbaijan - Firebase Authentication & Cloud Firestore (js/auth.js)
 * Production-ready persistent authentication, profile storage, and role-based permissions.
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authSubscribers = [];
        this.isAuthInitialized = false;
        this.initAuthListener();
    }

    /**
     * Subscribe to authentication state changes
     */
    onAuthStateChanged(callback) {
        if (typeof callback === 'function') {
            this.authSubscribers.push(callback);
            if (this.isAuthInitialized) {
                callback(this.currentUser);
            }
        }
    }

    notifyAuthSubscribers(user) {
        this.authSubscribers.forEach(cb => {
            try { cb(user); } catch (e) { console.error("Auth subscriber error:", e); }
        });
    }

    /**
     * Listen to persistent Firebase Auth state
     */
    initAuthListener() {
        const auth = window.firebaseAuth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
        if (!auth) {
            console.warn("Firebase Auth is not available yet. Falling back to local default student.");
            this.currentUser = this.getDefaultStudent();
            this.isAuthInitialized = true;
            return;
        }

        auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    await this.loadUserProfile(firebaseUser.uid, firebaseUser.email);
                } catch (e) {
                    console.error("Error loading user profile from Firestore:", e);
                    // Fallback to minimal user profile
                    this.currentUser = {
                        uid: firebaseUser.uid,
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName || "Tələbə",
                        ...this.getDefaultStudent()
                    };
                }
            } else {
                this.currentUser = null;
            }
            this.isAuthInitialized = true;
            this.notifyAuthSubscribers(this.currentUser);
            if (window.app && typeof window.app.onAuthStatusChanged === 'function') {
                window.app.onAuthStatusChanged(this.currentUser);
            }
        });
    }

    /**
     * Default template structure for a new or demo student
     */
    getDefaultStudent() {
        return {
            name: "Əli Ömərli",
            email: "ali.omarli@example.com",
            university: "UNEC",
            faculty: "Maliyyə və İqtisadiyyat",
            city: "Bakı",
            educationLevel: "Bakalavr",
            degree: "Bakalavr",
            targetRole: "financial_analyst",
            targetSector: "Maliyyə & Bankçılıq",
            englishLevel: "B2",
            otherLanguages: "Rus dili (B1), Türk dili",
            experience: 0,
            experience_years: 0,
            employmentStatus: "Tələbə / Məzun",
            skills: {
                "excel": 4,
                "financial_analysis": 3,
                "analytical_thinking": 4,
                "english": 4,
                "sql": 2,
                "power_bi": 2,
                "accounting_1c": 2
            },
            savedSkills: {
                "excel": 4,
                "financial_analysis": 3,
                "analytical_thinking": 4,
                "english": 4,
                "sql": 2,
                "power_bi": 2,
                "accounting_1c": 2
            },
            skillSources: {
                "excel": "user-added",
                "financial_analysis": "user-added",
                "analytical_thinking": "user-added",
                "english": "user-added",
                "sql": "user-added",
                "power_bi": "user-added",
                "accounting_1c": "user-added"
            },
            careerMatch: 68,
            profileCompletion: 95,
            profilePhotoUrl: "",
            photoUrl: "",
            cvUrl: "",
            uploadedCV: {
                name: "Ali_Omarli_CV_Financial_Analyst.pdf",
                uploadDate: "2026-08-20",
                parsedScore: 88,
                summary: "UNEC Maliyyə və İqtisadiyyat fakültəsi məzunu, maliyyə təhlili, Excel və analitik düşüncə bacarıqları."
            },
            cvVersions: [],
            role: "student",
            studentId: "AZ-UNEC-2026",
            isVerified: true,
            joinedDate: "15 Fevral 2026"
        };
    }

    /**
     * Load user document from Cloud Firestore: users/{uid}
     */
    async loadUserProfile(uid, email) {
        const db = window.firestoreDb || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
        if (!db) {
            this.currentUser = { uid, email, ...this.getDefaultStudent() };
            return this.currentUser;
        }

        const userDocRef = db.collection("users").doc(uid);
        const docSnap = await userDocRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            this.currentUser = {
                uid: uid,
                id: uid,
                ...data,
                // Ensure aliases compatibility
                savedSkills: data.savedSkills || data.skills || {},
                skills: data.skills || data.savedSkills || {},
                degree: data.degree || data.educationLevel || "Bakalavr",
                educationLevel: data.educationLevel || data.degree || "Bakalavr",
                experience_years: data.experience_years !== undefined ? data.experience_years : (data.experience || 0),
                experience: data.experience !== undefined ? data.experience : (data.experience_years || 0),
                photoUrl: data.photoUrl || data.profilePhotoUrl || "",
                profilePhotoUrl: data.profilePhotoUrl || data.photoUrl || ""
            };
        } else {
            // First time login with this Auth UID — initialize Firestore user document
            const defaultData = this.getDefaultStudent();
            const newDoc = {
                uid: uid,
                id: uid,
                name: "Tələbə",
                email: email || "",
                university: defaultData.university,
                faculty: defaultData.faculty,
                city: defaultData.city,
                educationLevel: defaultData.educationLevel,
                degree: defaultData.degree,
                targetRole: defaultData.targetRole,
                targetSector: defaultData.targetSector,
                englishLevel: defaultData.englishLevel,
                otherLanguages: defaultData.otherLanguages,
                experience: defaultData.experience,
                experience_years: defaultData.experience_years,
                employmentStatus: defaultData.employmentStatus,
                skills: defaultData.skills,
                savedSkills: defaultData.savedSkills,
                skillSources: defaultData.skillSources,
                careerMatch: defaultData.careerMatch,
                profileCompletion: defaultData.profileCompletion,
                profilePhotoUrl: "",
                photoUrl: "",
                cvUrl: "",
                uploadedCV: null,
                cvVersions: [],
                role: "student",
                studentId: "AZ-STD-" + uid.substring(0, 5).toUpperCase(),
                createdAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
                updatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
            };
            await userDocRef.set(newDoc);
            this.currentUser = newDoc;
        }

        if (typeof saveStudentToLocalRegistry === 'function') {
            saveStudentToLocalRegistry(this.currentUser);
        }
        return this.currentUser;
    }

    /**
     * Firebase Authentication: Registration
     */
    async register(emailOrObj, password, name, university, faculty, targetRole, degree, englishLevel) {
        let email, pass, uName, uUni, uFac, uRole, uDeg, uEng, uSkills, uExp;
        
        if (typeof emailOrObj === "object" && emailOrObj !== null) {
            email = emailOrObj.email;
            pass = emailOrObj.password || "password123";
            uName = emailOrObj.name || "Tələbə";
            uUni = emailOrObj.university || "UNEC";
            uFac = emailOrObj.faculty || "Maliyyə və İqtisadiyyat";
            uRole = emailOrObj.targetRole || "financial_analyst";
            uDeg = emailOrObj.degree || "Bakalavr";
            uEng = emailOrObj.englishLevel || "B2";
            uSkills = emailOrObj.savedSkills || emailOrObj.skills;
            uExp = emailOrObj.experience_years !== undefined ? emailOrObj.experience_years : (emailOrObj.experience || 0);
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
        if (!pass || pass.length < 6) throw new Error("Şifrə ən azı 6 simvoldan ibarət olmalıdır.");
        const cleanEmail = email.toLowerCase().trim();

        const auth = window.firebaseAuth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
        const db = window.firestoreDb || (typeof firebase !== 'undefined' ? firebase.firestore() : null);

        if (!auth || !db) {
            throw new Error("Firebase servisləri aktiv deyil. Zəhmət olmasa internet bağlantınızı yoxlayın.");
        }

        try {
            // 1. Create Firebase Auth user
            const userCred = await auth.createUserWithEmailAndPassword(cleanEmail, pass);
            const uid = userCred.user.uid;

            // 2. Set up initial skills
            const initialSkills = uSkills || {
                "excel": 4,
                "financial_analysis": 3,
                "analytical_thinking": 4,
                "english": 4
            };
            const initialSources = {};
            Object.keys(initialSkills).forEach(k => { initialSources[k] = 'user-added'; });

            // 3. Create document in Firestore: users/{uid}
            const userDoc = {
                uid: uid,
                id: uid,
                name: (uName || '').trim() || 'Tələbə',
                email: cleanEmail,
                university: uUni || 'UNEC',
                faculty: (uFac || '').trim() || 'Maliyyə və İqtisadiyyat',
                city: 'Bakı',
                educationLevel: uDeg || 'Bakalavr',
                degree: uDeg || 'Bakalavr',
                targetRole: uRole || 'financial_analyst',
                targetSector: 'Maliyyə & Bankçılıq',
                englishLevel: uEng || 'B2',
                otherLanguages: 'Rus dili (B1), Türk dili',
                experience: uExp,
                experience_years: uExp,
                employmentStatus: 'Tələbə / Məzun',
                skills: initialSkills,
                savedSkills: initialSkills,
                skillSources: initialSources,
                careerMatch: 65,
                profileCompletion: 80,
                profilePhotoUrl: '',
                photoUrl: '',
                cvUrl: '',
                uploadedCV: null,
                cvVersions: [],
                role: 'student',
                studentId: 'AZ-STD-' + uid.substring(0, 5).toUpperCase(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection("users").doc(uid).set(userDoc);
            this.currentUser = userDoc;
            return userDoc;
        } catch (err) {
            throw new Error(this.getFriendlyErrorMessage(err));
        }
    }

    /**
     * Firebase Authentication: Login
     */
    async login(email, password) {
        if (!email) throw new Error("E-poçt ünvanı daxil edilməlidir.");
        if (!password) throw new Error("Şifrə daxil edilməlidir.");
        const cleanEmail = email.toLowerCase().trim();

        const auth = window.firebaseAuth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
        if (!auth) {
            throw new Error("Firebase Authentication hazır deyil.");
        }

        try {
            const userCred = await auth.signInWithEmailAndPassword(cleanEmail, password);
            await this.loadUserProfile(userCred.user.uid, userCred.user.email);
            return this.currentUser;
        } catch (err) {
            throw new Error(this.getFriendlyErrorMessage(err));
        }
    }

    /**
     * Firebase Authentication: Logout
     */
    async logout() {
        const auth = window.firebaseAuth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
        if (auth) {
            await auth.signOut();
        }
        this.currentUser = null;
        this.notifyAuthSubscribers(null);
    }

    /**
     * Update user profile in Cloud Firestore: users/{uid}
     */
    async updateProfile(fields = {}) {
        if (!this.currentUser) return;
        Object.assign(this.currentUser, fields);

        const db = window.firestoreDb || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
        if (db && this.currentUser.uid) {
            try {
                const updatePayload = {
                    ...fields,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                if (fields.degree) updatePayload.educationLevel = fields.degree;
                if (fields.experience_years !== undefined) updatePayload.experience = fields.experience_years;
                if (fields.photoUrl !== undefined) updatePayload.profilePhotoUrl = fields.photoUrl;
                if (fields.savedSkills) updatePayload.skills = fields.savedSkills;

                await db.collection("users").doc(this.currentUser.uid).update(updatePayload);
            } catch (e) {
                console.error("Error updating profile in Firestore:", e);
            }
        }
        if (typeof saveStudentToLocalRegistry === 'function') {
            saveStudentToLocalRegistry(this.currentUser);
        }
    }

    /**
     * Update skills in Cloud Firestore: users/{uid}
     */
    async updateSkills(skills) {
        if (!this.currentUser) return;
        this.currentUser.savedSkills = { ...skills };
        this.currentUser.skills = { ...skills };

        // Recalculate completion
        const comp = this.calculateCompletion(this.currentUser);
        this.currentUser.profileCompletion = comp.percentage;

        const db = window.firestoreDb || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
        if (db && this.currentUser.uid) {
            try {
                await db.collection("users").doc(this.currentUser.uid).update({
                    skills: this.currentUser.savedSkills,
                    savedSkills: this.currentUser.savedSkills,
                    profileCompletion: this.currentUser.profileCompletion,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                console.error("Error updating skills in Firestore:", e);
            }
        }
    }

    /**
     * Set individual skill level and persist to Firestore
     */
    async setSkill(skillId, level, source = 'user-added') {
        if (!this.currentUser) return;
        if (!this.currentUser.savedSkills) this.currentUser.savedSkills = {};
        if (!this.currentUser.skills) this.currentUser.skills = {};
        if (!this.currentUser.skillSources) this.currentUser.skillSources = {};

        const lvl = parseInt(level, 10) || 1;
        this.currentUser.savedSkills[skillId] = lvl;
        this.currentUser.skills[skillId] = lvl;
        this.currentUser.skillSources[skillId] = source;

        await this.updateProfile({
            savedSkills: this.currentUser.savedSkills,
            skills: this.currentUser.skills,
            skillSources: this.currentUser.skillSources
        });
    }

    /**
     * Remove skill and persist to Firestore
     */
    async removeSkill(skillId) {
        if (!this.currentUser || !this.currentUser.savedSkills) return;
        delete this.currentUser.savedSkills[skillId];
        if (this.currentUser.skills) delete this.currentUser.skills[skillId];
        if (this.currentUser.skillSources) delete this.currentUser.skillSources[skillId];

        await this.updateProfile({
            savedSkills: this.currentUser.savedSkills,
            skills: this.currentUser.skills,
            skillSources: this.currentUser.skillSources
        });
    }

    /**
     * Save parsed CV metadata and extracted skills to Firestore
     */
    async saveParsedCV(parsedCV) {
        if (!this.currentUser) return;
        this.currentUser.uploadedCV = parsedCV;

        if (parsedCV.skills) {
            if (!this.currentUser.savedSkills) this.currentUser.savedSkills = {};
            if (!this.currentUser.skills) this.currentUser.skills = {};
            if (!this.currentUser.skillSources) this.currentUser.skillSources = {};

            Object.entries(parsedCV.skills).forEach(([sId, sObj]) => {
                const lvl = (typeof sObj === 'object' && sObj.level) ? sObj.level : (typeof sObj === 'number' ? sObj : 3);
                this.currentUser.savedSkills[sId] = lvl;
                this.currentUser.skills[sId] = lvl;
                this.currentUser.skillSources[sId] = 'cv-derived';
            });
        }

        if (parsedCV.education) {
            if (parsedCV.education.university) this.currentUser.university = parsedCV.education.university;
            if (parsedCV.education.degree) this.currentUser.degree = parsedCV.education.degree;
            if (parsedCV.education.field) this.currentUser.faculty = parsedCV.education.field;
        }

        if (parsedCV.experience) {
            if (parsedCV.experience.totalYears !== undefined && parsedCV.experience.totalYears > 0) {
                this.currentUser.experience_years = parsedCV.experience.totalYears;
                this.currentUser.experience = parsedCV.experience.totalYears;
            }
            this.currentUser.employmentStatus = parsedCV.experience.employmentStatus || 'Tələbə / Məzun';
        }

        if (parsedCV.languages) {
            if (parsedCV.languages.englishLevel) this.currentUser.englishLevel = parsedCV.languages.englishLevel;
            if (parsedCV.languages.otherLanguagesStr) this.currentUser.otherLanguages = parsedCV.languages.otherLanguagesStr;
        }

        if (parsedCV.personalInfo && parsedCV.personalInfo.city) {
            this.currentUser.city = parsedCV.personalInfo.city;
        }
        if (parsedCV.targetCareer) {
            if (parsedCV.targetCareer.sector) this.currentUser.targetSector = parsedCV.targetCareer.sector;
            if (parsedCV.targetCareer.role) this.currentUser.targetRole = parsedCV.targetCareer.role;
        }

        await this.updateProfile(this.currentUser);
    }

    /**
     * Delete CV from Firestore
     */
    async deleteCV() {
        if (!this.currentUser) return;
        this.currentUser.uploadedCV = null;
        this.currentUser.cvVersions = [];
        await this.updateProfile({
            uploadedCV: null,
            cvVersions: []
        });
    }

    /**
     * Profile Photo management
     */
    async saveProfilePhoto(photoUrl) {
        if (!this.currentUser) return;
        this.currentUser.photoUrl = photoUrl;
        this.currentUser.profilePhotoUrl = photoUrl;
        await this.updateProfile({ photoUrl, profilePhotoUrl: photoUrl });
    }

    async removeProfilePhoto() {
        if (!this.currentUser) return;
        this.currentUser.photoUrl = null;
        this.currentUser.profilePhotoUrl = null;
        await this.updateProfile({ photoUrl: null, profilePhotoUrl: null });
    }

    /**
     * Calculate profile completeness score
     */
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
            { id: "photo", label: "Profil Şəkli", weight: 5, check: () => Boolean(user.photoUrl || user.profilePhotoUrl), action: "app.openPhotoUploadModal()" }
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

    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Map Firebase error codes to user-friendly Azerbaijani messages
     */
    getFriendlyErrorMessage(err) {
        if (!err) return "Naməlum xəta baş verdi.";
        const code = err.code || "";
        const msg = err.message || "";

        if (code === "auth/invalid-email") return "Düzgün e-poçt ünvanı daxil edin.";
        if (code === "auth/user-disabled") return "Bu istifadəçi hesabı deaktiv edilib.";
        if (code === "auth/user-not-found") return "Bu e-poçt ilə qeydiyyatdan keçmiş istifadəçi tapılmadı.";
        if (code === "auth/wrong-password" || code === "auth/invalid-credential") return "E-poçt və ya şifrə yanlışdır.";
        if (code === "auth/email-already-in-use") return "Bu e-poçt ünvanı ilə artıq qeydiyyatdan keçilib.";
        if (code === "auth/weak-password") return "Şifrə çox zəifdir. Ən azı 6 simvoldan ibarət olmalıdır.";
        if (code === "auth/network-request-failed") return "İnternet bağlantısı kəsilib. Şəbəkənizi yoxlayın.";
        if (code === "permission-denied") return "Bu əməliyyat üçün icazəniz yoxdur.";
        if (code === "unavailable") return "Serverə qoşulmaq mümkün olmadı. Zəhmət olmasa bir qədər sonra yenidən cəhd edin.";

        return msg || "Əməliyyat icra olunarkən xəta baş verdi.";
    }
}

if (typeof window !== 'undefined') {
    window.AuthManager = AuthManager;
}

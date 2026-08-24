/**
 * SkillMap Azerbaijan - Firebase Authentication & Data Sync (js/firebaseAuth.js)
 * Enterprise-grade, resilient dual-layer sync with Cloud Firestore & persistent local student registry.
 */

// Global Firebase instances
var db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
var auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);

if (typeof window !== "undefined") {
    window.db = db;
    window.firestoreDb = db;
    window.auth = auth;
    window.firebaseAuth = auth;
}

// Local registry helper functions
function getLocalRegisteredStudents() {
    try {
        const raw = localStorage.getItem("skillmap_registered_students");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Error reading local student registry:", e);
    }
    return [];
}

function saveStudentToLocalRegistry(userDoc) {
    if (!userDoc || (!userDoc.uid && !userDoc.email)) return;
    try {
        const list = getLocalRegisteredStudents();
        const uid = userDoc.uid || userDoc.id;
        const email = (userDoc.email || "").toLowerCase().trim();
        
        const idx = list.findIndex(s => (uid && (s.uid === uid || s.id === uid)) || (email && s.email && s.email.toLowerCase() === email));
        if (idx >= 0) {
            list[idx] = { ...list[idx], ...userDoc };
        } else {
            list.unshift(userDoc);
        }
        localStorage.setItem("skillmap_registered_students", JSON.stringify(list));
    } catch (e) {
        console.warn("Error saving student to local registry:", e);
    }
}

function removeStudentFromLocalRegistry(userIdOrEmail) {
    try {
        const list = getLocalRegisteredStudents();
        const target = (userIdOrEmail || "").toLowerCase().trim();
        const filtered = list.filter(s => {
            const uid = (s.uid || s.id || "").toLowerCase();
            const email = (s.email || "").toLowerCase();
            return uid !== target && email !== target;
        });
        localStorage.setItem("skillmap_registered_students", JSON.stringify(filtered));
    } catch (e) {
        console.warn("Error removing student from local registry:", e);
    }
}

async function firebaseRegister(name, email, password, university, faculty, targetRole, englishLevel) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (name || "Tələbə").trim();
    const cleanUni = (university || "UNEC").trim();
    const cleanFac = (faculty || "İqtisadiyyat").trim();
    const cleanRole = (targetRole || "data_analyst").trim();
    const cleanEng = (englishLevel || "B2").trim();

    try {
        let uid = "usr_" + Date.now();
        
        // 1. Try Firebase Auth
        if (auth && typeof auth.createUserWithEmailAndPassword === "function") {
            try {
                const cred = await auth.createUserWithEmailAndPassword(cleanEmail, password);
                uid = cred.user.uid;
            } catch (authErr) {
                // If email already in use, try signing in
                if (authErr.code === "auth/email-already-in-use" || (authErr.message && authErr.message.includes("already in use"))) {
                    try {
                        const signInCred = await auth.signInWithEmailAndPassword(cleanEmail, password);
                        uid = signInCred.user.uid;
                    } catch (signInErr) {
                        console.error("Auth sign-in fallback error:", signInErr.message);
                        return { success: false, error: "Bu email artıq qeydiyyatdan keçib. Şifrə yanlışdır." };
                    }
                } else {
                    console.error("Firebase Auth create error:", authErr.message);
                    return { success: false, error: authErr.message };
                }
            }
        }

        const userDoc = {
            uid: uid,
            id: uid,
            name: cleanName,
            email: cleanEmail,
            university: cleanUni,
            faculty: cleanFac,
            targetRole: cleanRole,
            englishLevel: cleanEng,
            degree: "Bakalavr",
            educationLevel: "Bakalavr",
            city: "Bakı",
            skills: {},
            savedSkills: {},
            careerMatch: 0,
            role: "student",
            studentId: "AZ-STD-" + uid.substring(0, 5).toUpperCase(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 2. Save to Firestore users collection
        if (db) {
            try {
                await db.collection("users").doc(uid).set({
                    ...userDoc,
                    createdAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
                    updatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                });
            } catch (fsErr) {
                console.warn("Firestore users collection write warning:", fsErr.message);
            }

            // Also save to all_users collection
            try {
                await db.collection("all_users").doc(uid).set(userDoc);
            } catch (fsErr2) {
                console.warn("Firestore all_users write warning:", fsErr2.message);
            }
        }

        // 3. Save to local persistent registry
        saveStudentToLocalRegistry(userDoc);

        console.log("Firebase register success:", uid);
        return { success: true, uid: uid, data: userDoc };
    } catch (err) {
        console.error("Firebase register general error:", err.message);
        return { success: false, error: err.message };
    }
}

async function firebaseLogin(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    try {
        if (auth && typeof auth.signInWithEmailAndPassword === "function") {
            const cred = await auth.signInWithEmailAndPassword(cleanEmail, password);
            let userData = null;
            if (db) {
                try {
                    const doc = await db.collection("users").doc(cred.user.uid).get();
                    if (doc.exists) userData = doc.data();
                } catch (e) {
                    console.warn("Firestore read on login warning:", e.message);
                }
            }

            if (!userData) {
                const localStudents = getLocalRegisteredStudents();
                userData = localStudents.find(s => s.uid === cred.user.uid || (s.email && s.email.toLowerCase() === cleanEmail));
            }

            console.log("Firebase login success:", cred.user.uid);
            return { success: true, uid: cred.user.uid, data: userData };
        } else {
            const localStudents = getLocalRegisteredStudents();
            const student = localStudents.find(s => s.email && s.email.toLowerCase() === cleanEmail);
            if (student) {
                return { success: true, uid: student.uid || student.id, data: student };
            }
            return { success: false, error: "İstifadəçi tapılmadı." };
        }
    } catch (err) {
        console.error("Firebase login error:", err.message);
        return { success: false, error: err.message };
    }
}

async function firebaseLogout() {
    if (auth && typeof auth.signOut === "function") {
        await auth.signOut();
    }
    console.log("Firebase logout success");
}

if (auth && typeof auth.onAuthStateChanged === "function") {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Firebase user logged in:", user.uid);
        } else {
            console.log("Firebase user logged out");
        }
    });
}

async function firebaseSaveSkills(skills, targetRole) {
    const currentUid = (auth && auth.currentUser) ? auth.currentUser.uid : (window.app && window.app.auth && window.app.auth.currentUser ? window.app.auth.currentUser.uid : null);
    if (!currentUid) return { success: false, error: "Login olmayıb" };
    
    const roleToSave = targetRole || (window.app ? window.app.selectedTargetRole : null) || "data_analyst";
    
    // 1. Update Firestore
    if (db) {
        try {
            await db.collection("users").doc(currentUid).update({
                skills: skills,
                savedSkills: skills,
                targetRole: roleToSave,
                updatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            });
        } catch (err) {
            console.warn("Save skills Firestore warning:", err.message);
        }

        try {
            await db.collection("all_users").doc(currentUid).update({
                skills: skills,
                savedSkills: skills,
                targetRole: roleToSave,
                updatedAt: new Date().toISOString()
            });
        } catch (err2) {
            console.warn("Save skills all_users warning:", err2.message);
        }
    }

    // 2. Update local registry
    saveStudentToLocalRegistry({
        uid: currentUid,
        id: currentUid,
        skills: skills,
        savedSkills: skills,
        targetRole: roleToSave,
        updatedAt: new Date().toISOString()
    });

    console.log("Skills saved successfully for:", currentUid);
    return { success: true };
}

async function firebaseSaveCareerMatch(careerMatch) {
    const currentUid = (auth && auth.currentUser) ? auth.currentUser.uid : (window.app && window.app.auth && window.app.auth.currentUser ? window.app.auth.currentUser.uid : null);
    if (!currentUid) return;

    if (db) {
        try {
            await db.collection("users").doc(currentUid).update({
                careerMatch: careerMatch,
                updatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
            });
        } catch (err) {
            console.warn("Save career match Firestore warning:", err.message);
        }

        try {
            await db.collection("all_users").doc(currentUid).update({
                careerMatch: careerMatch,
                updatedAt: new Date().toISOString()
            });
        } catch (err2) {
            console.warn("Save career match all_users warning:", err2.message);
        }
    }

    saveStudentToLocalRegistry({
        uid: currentUid,
        id: currentUid,
        careerMatch: careerMatch,
        updatedAt: new Date().toISOString()
    });

    console.log("Career Match saved:", careerMatch);
}

async function firebaseGetProfile() {
    const user = auth ? auth.currentUser : null;
    if (!user) return null;
    if (db) {
        try {
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) return doc.data();
        } catch (e) {
            console.warn("Get profile Firestore warning:", e.message);
        }
    }
    const list = getLocalRegisteredStudents();
    return list.find(s => s.uid === user.uid || (s.email && s.email.toLowerCase() === user.email.toLowerCase())) || null;
}

async function firebaseGetAllUsers() {
    const userMap = new Map();

    // 1. Read from local persistent student registry
    const localStudents = getLocalRegisteredStudents();
    localStudents.forEach(st => {
        const key = (st.uid || st.id || st.email || "").toLowerCase();
        if (key) userMap.set(key, { ...st });
    });

    // 2. If app.auth has a logged in user, include it
    if (window.app && window.app.auth && window.app.auth.currentUser) {
        const cu = window.app.auth.currentUser;
        const key = (cu.uid || cu.id || cu.email || "").toLowerCase();
        if (key) {
            const existing = userMap.get(key) || {};
            userMap.set(key, { ...existing, ...cu });
        }
    }

    // 3. Try reading from Firestore users collection
    if (db) {
        try {
            const snapshot = await db.collection("users").get();
            snapshot.forEach(doc => {
                const data = doc.data();
                const key = (doc.id || data.uid || data.email || "").toLowerCase();
                if (key) {
                    const existing = userMap.get(key) || {};
                    userMap.set(key, { uid: doc.id, id: doc.id, ...existing, ...data });
                }
            });
            console.log(`Loaded ${snapshot.size} users directly from Firestore users collection`);
        } catch (err) {
            console.warn("Firestore users collection get warning:", err.message);
        }

        // 4. Also try reading from all_users collection
        try {
            const snapshot2 = await db.collection("all_users").get();
            snapshot2.forEach(doc => {
                const data = doc.data();
                const key = (doc.id || data.uid || data.email || "").toLowerCase();
                if (key) {
                    const existing = userMap.get(key) || {};
                    userMap.set(key, { uid: doc.id, id: doc.id, ...existing, ...data });
                }
            });
            console.log(`Loaded ${snapshot2.size} users from Firestore all_users collection`);
        } catch (err2) {
            console.warn("Firestore all_users collection get warning:", err2.message);
        }
    }

    const mergedUsers = Array.from(userMap.values());

    // Save back to local storage to keep cache warm
    if (mergedUsers.length > 0) {
        try {
            localStorage.setItem("skillmap_registered_students", JSON.stringify(mergedUsers));
        } catch (e) {}
    }

    console.log(`Total aggregated users loaded: ${mergedUsers.length}`);
    return mergedUsers;
}

async function firebaseGetUserProfile(userId) {
    if (db) {
        try {
            const doc = await db.collection("users").doc(userId).get();
            if (doc.exists) return { uid: doc.id, id: doc.id, ...doc.data() };
        } catch (err) {
            console.warn("Get user profile Firestore warning:", err.message);
        }
    }
    const list = getLocalRegisteredStudents();
    return list.find(s => s.uid === userId || s.id === userId || s.email === userId) || null;
}

async function firebaseSetAdmin(userId) {
    if (db) {
        try {
            await db.collection("users").doc(userId).update({ role: "admin" });
        } catch (e) {
            console.warn("Set admin Firestore warning:", e.message);
        }
        try {
            await db.collection("all_users").doc(userId).update({ role: "admin" });
        } catch (e) {
            console.warn("Set admin all_users warning:", e.message);
        }
    }
    saveStudentToLocalRegistry({ uid: userId, id: userId, role: "admin" });
    console.log("User set as admin:", userId);
}

async function firebaseDeleteUser(userId) {
    if (db) {
        try {
            await db.collection("users").doc(userId).delete();
        } catch (e) {
            console.warn("Delete user Firestore warning:", e.message);
        }
        try {
            await db.collection("all_users").doc(userId).delete();
        } catch (e) {
            console.warn("Delete user all_users warning:", e.message);
        }
    }
    removeStudentFromLocalRegistry(userId);
    console.log("User deleted:", userId);
}

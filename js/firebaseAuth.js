// Global Firebase instances
var db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
var auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);

async function firebaseRegister(name, email, password, university, faculty, targetRole, englishLevel) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(cred.user.uid).set({
      name: name,
      email: email,
      university: university,
      faculty: faculty,
      targetRole: targetRole,
      englishLevel: englishLevel,
      skills: {},
      careerMatch: 0,
      role: "student",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Firebase register success:", cred.user.uid);
    return { success: true, uid: cred.user.uid };
  } catch (err) {
    console.error("Firebase register error:", err.message);
    return { success: false, error: err.message };
  }
}

async function firebaseLogin(email, password) {
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const doc = await db.collection("users").doc(cred.user.uid).get();
    console.log("Firebase login success:", cred.user.uid);
    return { success: true, uid: cred.user.uid, data: doc.data() };
  } catch (err) {
    console.error("Firebase login error:", err.message);
    return { success: false, error: err.message };
  }
}

async function firebaseLogout() {
  await auth.signOut();
  console.log("Firebase logout success");
}

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Firebase user logged in:", user.uid);
  } else {
    console.log("Firebase user logged out");
  }
});

async function firebaseSaveSkills(skills, targetRole) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "Login olmayıb" };
  try {
    const roleToSave = targetRole || (window.app ? window.app.selectedTargetRole : null) || "data_analyst";
    await db.collection("users").doc(user.uid).update({
      skills: skills,
      savedSkills: skills,
      targetRole: roleToSave,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Skills saved to Firebase");
    return { success: true };
  } catch (err) {
    console.error("Save skills error:", err.message);
    return { success: false, error: err.message };
  }
}

async function firebaseSaveCareerMatch(careerMatch) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.collection("users").doc(user.uid).update({
      careerMatch: careerMatch,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Career Match saved:", careerMatch);
  } catch (err) {
    console.error("Save career match error:", err.message);
  }
}

async function firebaseGetProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const doc = await db.collection("users").doc(user.uid).get();
  return doc.exists ? doc.data() : null;
}

async function firebaseGetAllUsers() {
  try {
    const snapshot = await db.collection("users").get();
    const users = [];
    snapshot.forEach(doc => {
      users.push({ uid: doc.id, id: doc.id, ...doc.data() });
    });
    console.log("Loaded", users.length, "users from Firebase");
    return users;
  } catch (err) {
    console.error("Get all users error:", err.message);
    return [];
  }
}

async function firebaseGetUserProfile(userId) {
  try {
    const doc = await db.collection("users").doc(userId).get();
    return doc.exists ? { uid: doc.id, id: doc.id, ...doc.data() } : null;
  } catch (err) {
    console.error("Get user profile error:", err.message);
    return null;
  }
}

async function firebaseSetAdmin(userId) {
  await db.collection("users").doc(userId).update({ role: "admin" });
  console.log("User set as admin:", userId);
}

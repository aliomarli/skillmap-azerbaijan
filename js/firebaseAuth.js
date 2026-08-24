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

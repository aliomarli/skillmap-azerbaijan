/**
 * SkillMap Azerbaijan - Firebase SDK & Firestore Integration (js/firebase.js)
 * Production-ready Authentication and Cloud Firestore backend layer.
 */

const firebaseConfig = {
  apiKey: "AIzaSyB1ocnco4JArR2D8VeG4vFJA-nLBMkPOyk",
  authDomain: "skillmap-c25e7.firebaseapp.com",
  projectId: "skillmap-c25e7",
  storageBucket: "skillmap-c25e7.firebasestorage.app",
  messagingSenderId: "313126067270",
  appId: "1:313126067270:web:0a7451ccb3ceae9e97e47",
  measurementId: "G-TPVJL87SYH"
};

// Initialize Firebase App instance
if (typeof firebase !== "undefined" && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase App initialized successfully (skillmap-c25e7).");
    } catch (e) {
        console.error("Firebase initialization error:", e);
    }
}

// Global Auth and Firestore instances
const firebaseAuth = (typeof firebase !== "undefined" && firebase.auth) ? firebase.auth() : null;
const firestoreDb = (typeof firebase !== "undefined" && firebase.firestore) ? firebase.firestore() : null;

// Enable Firestore Local Persistence if supported
if (firestoreDb && typeof firestoreDb.enablePersistence === "function") {
    firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === "failed-precondition") {
            console.warn("Firestore persistence: Multiple tabs open.");
        } else if (err.code === "unimplemented") {
            console.warn("Firestore persistence: Browser does not support indexedDB offline persistence.");
        }
    });
}

// Attach to window
if (typeof window !== "undefined") {
    window.firebaseConfig = firebaseConfig;
    window.firebaseAuth = firebaseAuth;
    window.firestoreDb = firestoreDb;
}

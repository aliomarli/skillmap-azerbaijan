/**
 * SkillMap Azerbaijan - Firebase SDK & Firestore Integration (js/firebase.js)
 * Official Web App Firebase Configuration for skillmap-c25e7
 */

const firebaseConfig = {
  apiKey: "AIzaSyB1ocnco4JArR2D8Ve4GvFJA-nLBMkPOyk",
  authDomain: "skillmap-c25e7.firebaseapp.com",
  projectId: "skillmap-c25e7",
  storageBucket: "skillmap-c25e7.firebasestorage.app",
  messagingSenderId: "313126067270",
  appId: "1:313126067270:web:0a7451ccb3ceae9ef97e47",
  measurementId: "G-TPVJL87SYH"
};

// Initialize Firebase App instance (Single instance pattern)
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

// Attach to window for global app access
if (typeof window !== "undefined") {
    window.firebaseConfig = firebaseConfig;
    window.firebaseAuth = firebaseAuth;
    window.firestoreDb = firestoreDb;
}

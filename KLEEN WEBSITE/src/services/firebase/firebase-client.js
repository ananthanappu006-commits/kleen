/**
 * KLEEN — Firebase Client Layer
 * Dual-mode adapter supporting real Firebase Web SDK v10 and persistent reactive store.
 */

import { firebaseConfig, isLiveFirebaseConfigured } from "../../config/firebase-config.js";

class FirebaseClient {
  constructor() {
    this.isLive = isLiveFirebaseConfigured();
    this.app = null;
    this.auth = null;
    this.firestore = null;
    this.storage = null;
    this.analytics = null;
    this.authSDK = null;
    this.firestoreSDK = null;
    this.initPromise = this.init();
  }

  async init() {
    if (this.isLive && typeof window !== "undefined") {
      try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js");
        const authSDK = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
        const firestoreSDK = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const storageSDK = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js");

        this.app = initializeApp(firebaseConfig);
        this.analytics = getAnalytics(this.app);
        this.auth = authSDK.getAuth(this.app);
        this.firestore = firestoreSDK.getFirestore(this.app);
        this.storage = storageSDK.getStorage(this.app);
        this.authSDK = authSDK;
        this.firestoreSDK = firestoreSDK;
        this.storageSDK = storageSDK;

        console.log("KLEEN: Connected to Live Firebase Project (kleen-web)");
        return true;
      } catch (err) {
        console.warn("KLEEN: Falling back to persistent reactive store:", err);
        return false;
      }
    }
    return false;
  }

  formatAuthError(err) {
    const code = err?.code || "";
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password. Please check your credentials and try again.";
      case "auth/user-not-found":
        return "No partner account found with this email. Please register as a partner first.";
      case "auth/invalid-email":
        return "The email address is invalid. Please enter a valid email format.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact KLEEN Partner Support.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait a few moments or reset your password.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please sign in.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before completing.";
      case "auth/cancelled-popup-request":
        return "Sign in cancelled.";
      default:
        return (err?.message || "Authentication error occurred.")
          .replace(/^Firebase:\s*/, "")
          .replace(/\s*\(auth\/[^)]+\)\.?$/, "");
    }
  }

  async loginWithFirebase(email, password) {
    await this.initPromise;
    if (!this.auth || !this.authSDK) {
      throw new Error("Firebase Auth SDK is not available.");
    }
    try {
      const userCredential = await this.authSDK.signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  }

  async registerWithFirebase(email, password, fullName) {
    await this.initPromise;
    if (!this.auth || !this.authSDK) {
      throw new Error("Firebase Auth SDK is not available.");
    }
    try {
      const userCredential = await this.authSDK.createUserWithEmailAndPassword(this.auth, email, password);
      if (fullName && this.authSDK.updateProfile) {
        try {
          await this.authSDK.updateProfile(userCredential.user, { displayName: fullName });
        } catch (e) {
          console.warn("Could not update display name:", e);
        }
      }
      return userCredential.user;
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  }

  async loginWithGoogle() {
    await this.initPromise;
    if (!this.auth || !this.authSDK) {
      throw new Error("Firebase Auth SDK is not available.");
    }
    try {
      const provider = new this.authSDK.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await this.authSDK.signInWithPopup(this.auth, provider);
      return result.user;
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  }

  async sendPasswordResetEmail(email) {
    await this.initPromise;
    if (!this.auth || !this.authSDK) {
      throw new Error("Firebase Auth SDK is not available.");
    }
    try {
      await this.authSDK.sendPasswordResetEmail(this.auth, email);
    } catch (err) {
      throw new Error(this.formatAuthError(err));
    }
  }

  async logoutFirebase() {
    await this.initPromise;
    if (this.auth && this.authSDK) {
      await this.authSDK.signOut(this.auth);
    }
  }

  async onAuthStateChanged(callback) {
    await this.initPromise;
    if (this.auth && this.authSDK) {
      return this.authSDK.onAuthStateChanged(this.auth, callback);
    }
  }

  async getAuth() {
    await this.initPromise;
    return this.auth;
  }

  async getAuthSDK() {
    await this.initPromise;
    return this.authSDK;
  }

  async getDoc(collectionName, docId) {
    await this.initPromise;
    if (!this.firestore || !this.firestoreSDK) return null;
    try {
      const docRef = this.firestoreSDK.doc(this.firestore, collectionName, docId);
      const snap = await this.firestoreSDK.getDoc(docRef);
      if (snap && snap.exists && snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn(`Firestore getDoc error [${collectionName}/${docId}]:`, err);
      return null;
    }
  }


  // =========================================================================
  // Cloud Firestore Sync Methods
  // =========================================================================
  async saveDoc(collectionName, docId, data) {
    await this.initPromise;
    if (!this.firestore || !this.firestoreSDK) return;
    try {
      const docRef = this.firestoreSDK.doc(this.firestore, collectionName, docId);
      await this.firestoreSDK.setDoc(docRef, data, { merge: true });
    } catch (err) {
      console.warn(`Firestore save error [${collectionName}/${docId}]:`, err);
    }
  }

  async deleteDoc(collectionName, docId) {
    await this.initPromise;
    if (!this.firestore || !this.firestoreSDK) return;
    try {
      const docRef = this.firestoreSDK.doc(this.firestore, collectionName, docId);
      await this.firestoreSDK.deleteDoc(docRef);
    } catch (err) {
      console.warn(`Firestore delete error [${collectionName}/${docId}]:`, err);
    }
  }

  async listenCollection(collectionName, callback) {
    await this.initPromise;
    if (!this.firestore || !this.firestoreSDK) return;
    try {
      const colRef = this.firestoreSDK.collection(this.firestore, collectionName);
      return this.firestoreSDK.onSnapshot(colRef, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
      }, (err) => {
        console.warn(`Firestore collection listener error [${collectionName}]:`, err);
      });
    } catch (err) {
      console.warn(`Firestore listen error [${collectionName}]:`, err);
    }
  }
}

export const firebaseClient = new FirebaseClient();

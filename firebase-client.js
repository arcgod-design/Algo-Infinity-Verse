/**
 * Firebase Client-Side Authentication
 * Initializes Firebase Auth with Google sign-in provider.
 * Config is injected by the server via window.__FIREBASE_CONFIG__.
 */
(function () {
  "use strict";

  const FIREBASE_CDN = "https://www.gstatic.com/firebasejs/10.12.2";
  let firebaseApp = null;
  let firebaseAuth = null;
  let googleProvider = null;
  let initPromise = null;

  function getConfig() {
    return window.__FIREBASE_CONFIG__ || null;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureFirebaseLoaded() {
    if (window.firebase && window.firebase.auth) return;
    await loadScript(`${FIREBASE_CDN}/firebase-app-compat.js`);
    await loadScript(`${FIREBASE_CDN}/firebase-auth-compat.js`);
  }

  async function initializeFirebaseAuth() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const config = getConfig();
      if (!config) {
        console.warn("[firebase-client] No Firebase config found. Google sign-in disabled.");
        return null;
      }

      await ensureFirebaseLoaded();

      if (!firebaseApp) {
        firebaseApp = window.firebase.initializeApp(config);
        firebaseAuth = window.firebase.auth();
        googleProvider = new window.firebase.auth.GoogleAuthProvider();
        googleProvider.addScope("profile");
        googleProvider.addScope("email");
      }

      return { app: firebaseApp, auth: firebaseAuth, provider: googleProvider };
    })();

    return initPromise;
  }

  async function signInWithGoogle() {
    const firebase = await initializeFirebaseAuth();
    if (!firebase) {
      throw new Error("Firebase is not configured. Google sign-in is unavailable.");
    }

    const result = await firebase.auth.signInWithPopup(firebase.provider);
    const user = result.user;
    const idToken = await user.getIdToken();

    const response = await fetch("/api/auth/google", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Google authentication failed.");
    }

    return payload;
  }

  async function signOut() {
    const firebase = await initializeFirebaseAuth();
    if (firebase && firebase.auth.currentUser) {
      await firebase.auth.signOut();
    }

    if (location.protocol !== "file:") {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    }
  }

  function onAuthStateChanged(callback) {
    initializeFirebaseAuth().then((firebase) => {
      if (!firebase) {
        callback(null);
        return;
      }
      firebase.auth.onAuthStateChanged(callback);
    });
  }

  function getCurrentFirebaseUser() {
    if (!firebaseAuth) return null;
    return firebaseAuth.currentUser;
  }

  window.firebaseAuth = {
    initialize: initializeFirebaseAuth,
    signInWithGoogle,
    signOut,
    onAuthStateChanged,
    getCurrentUser: getCurrentFirebaseUser,
  };
})();

/**
 * Firebase Configuration for KLEEN
 * 
 * Replace the values below with your Firebase Project credentials from Firebase Console:
 * Project Settings -> General -> Your apps -> Web app -> SDK setup and configuration.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyAIgQPphpRFY2C3lhC_T_WL_N4UyzpARng",
  authDomain: "kleen-web.firebaseapp.com",
  projectId: "kleen-web",
  storageBucket: "kleen-web.firebasestorage.app",
  databaseURL: "https://kleen-web-default-rtdb.firebaseio.com",
  messagingSenderId: "52066217143",
  appId: "1:52066217143:web:e0abcae31fa57d37cf3132",
  measurementId: "G-3J8CYBG1H2"
};


/**
 * Flag determining if live Firebase SDK or reactive local emulator is used.
 * Automatically switches to Live Firebase if valid credentials are supplied.
 */
export const isLiveFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("ReplaceWithYours") &&
    firebaseConfig.projectId !== "kleen-maid-service"
  );
};

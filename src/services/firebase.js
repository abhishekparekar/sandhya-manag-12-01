// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { setLogLevel } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDhXwUY9GWDUihdyLDRGmDUuclMsMuRSBs",
    authDomain: "sandhya-mang.firebaseapp.com",
    projectId: "sandhya-mang",
    storageBucket: "sandhya-mang.firebasestorage.app",
    messagingSenderId: "177779159902",
    appId: "1:177779159902:web:96d5563b603d2346f295cf",
    measurementId: "G-HP178LJ1RP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Suppress Firebase connection warnings in console
// Only show actual errors, not network retry warnings
setLogLevel('silent');

// Additional: Suppress WebChannel connection errors
if (typeof window !== 'undefined') {
    const originalConsoleWarn = console.warn;
    console.warn = function (...args) {
        // Filter out Firebase connection warnings
        const message = args[0]?.toString() || '';
        if (
            message.includes('WebChannelConnection') ||
            message.includes('transport errored') ||
            message.includes('ERR_INTERNET_DISCONNECTED') ||
            message.includes('Firestore')
        ) {
            return; // Suppress these warnings
        }
        originalConsoleWarn.apply(console, args);
    };
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
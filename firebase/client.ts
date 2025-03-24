// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDsWV2Ns2B8D5CaHL6dTllKk_C6JBYn0uo",
    authDomain: "interview-prep-ai-14064.firebaseapp.com",
    projectId: "interview-prep-ai-14064",
    storageBucket: "interview-prep-ai-14064.firebasestorage.app",
    messagingSenderId: "313931573153",
    appId: "1:313931573153:web:ee675a7ef1f97628680de0",
    measurementId: "G-YBNZEJ1QS2"
};

// Initialize Firebase
const app = !getApps.length?initializeApp(firebaseConfig):getApp();
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
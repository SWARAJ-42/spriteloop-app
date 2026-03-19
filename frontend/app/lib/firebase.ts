// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyNqESIOGnog8anzsExR3X1eZcj3vXOhI",
  authDomain: "spriteloop-user-authentication.firebaseapp.com",
  projectId: "spriteloop-user-authentication",
  storageBucket: "spriteloop-user-authentication.firebasestorage.app",
  messagingSenderId: "619868805983",
  appId: "1:619868805983:web:577efe2d02077fb300f4ea",
  measurementId: "G-7H7LJMT0QM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
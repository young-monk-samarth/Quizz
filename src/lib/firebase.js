import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAf9fx57-g83wdZO83kM4-tLTZ7PW-WgtE",
  authDomain: "fire-304c1.firebaseapp.com",
  projectId: "fire-304c1",
  storageBucket: "fire-304c1.firebasestorage.app",
  messagingSenderId: "30658240681",
  appId: "1:30658240681:web:9a797d96d338d6404389b8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    // Use signInWithPopup with error handling for COOP issues
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    // Handle specific errors
    if (error.code === 'auth/cancelled-popup-request' || 
        error.code === 'auth/popup-closed-by-user') {
      console.log('Sign in cancelled by user');
      return null;
    }
    if (error.code === 'auth/popup-blocked') {
      console.error('Popup was blocked by browser or extension');
      throw new Error('Please allow popups for this site to sign in');
    }
    console.error("Authentication error", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error", error);
    throw error;
  }
};
import { getApps, initializeApp } from 'firebase/app'

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { collection } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: 'app-chat-1f5a4.firebaseapp.com',
  projectId: 'app-chat-1f5a4',
  storageBucket: 'app-chat-1f5a4.appspot.com',
  messagingSenderId: '825359150547',
  appId: process.env.REACT_APP_APP_ID,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
}

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]
export const storage = getStorage(app)

// Initialize Realtime Database
export const database = getDatabase()

export const auth = getAuth()

// Export the auth object and the authentication functions
export const signup = (
  email,

  password
) => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider)
}

export const signOut = () => {
  return firebaseSignOut(auth)
}

// Initialize Firestore
const db = getFirestore()
export const usersCollection = collection(db, 'users')
console.log('firebase usersCollection', usersCollection)
export default db

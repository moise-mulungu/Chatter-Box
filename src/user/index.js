import { useState, useContext, useEffect } from 'react'
import { auth, login, signup, signOut, signInWithGoogle } from '../firebase'
import { updateProfile } from 'firebase/auth'
import { UserContext } from './user-context-provider'
import Login from './login'
import Signup from './signup'
import db from '../firebase'
import { GoogleAuthProvider } from 'firebase/auth'

export default function User({ onAuthenticate, handleUserConnect }) {
  const [error, setError] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [loading, setLoading] = useState(false)

  const { setUser } = useContext(UserContext)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user)
        onAuthenticate()
        handleUserConnect(user)
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = (email, password) => {
    login(email, password)
      .then((userCredential) => {
        const user = userCredential.user

        setUser(user)

        onAuthenticate()
        handleUserConnect(user)
      })
      .catch((error) => {
        const errorMessage = error.message
        console.log('login Error: ', error)

        setError(errorMessage)
        setLoading(true)
      })
  }

  const handleSignup = (email, username, password) => {
    signup(email, password)
      .then((userCredential) => {
        const user = userCredential.user

        updateProfile(user, {
          displayName: username,
        })
          .then(() => {
            return user.reload()
          })
          .then(() => {
            const addUsersData = db.collection('users')
            addUsersData
              .doc(user.uid)
              .set({
                displayName: user.displayName,
                photoURL: user.photoURL,
                isActive: true,
              })
              .catch((error) => {
                console.error('Error writing to Firestore: ', error)
              })
          })
          .then(() => {
            setUser(user)
            setIsLoggedIn(true)
            onAuthenticate()
            handleUserConnect(user)
          })
          .catch((error) => {
            console.error('Error updating display name', error)
          })
      })
      .catch((error) => {
        const errorMessage = error.message

        console.log('signup Error: ', error)
        setError(errorMessage)
      })
  }

  const handleLoginWithGoogle = () => {
    signInWithGoogle()
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result)
        const token = credential.accessToken

        const user = result.user

        db.collection('users').doc(user.uid).set({
          displayName: user.displayName,
          photoURL: user.photoURL,
          isActive: true,
        })
        setUser(user)
        onAuthenticate()
        handleUserConnect(user)
      })
      .catch((error) => {
        const errorMessage = error.message
        setError(errorMessage)
      })
  }

  const toggleAuthenticationMode = () => {
    setIsLoggedIn(!isLoggedIn)
  }

  return (
    <div>
      {isLoggedIn ? (
        <Login
          handleLogin={handleLogin}
          handleLoginWithGoogle={handleLoginWithGoogle}
          error={error}
          toggleAuthenticationMode={toggleAuthenticationMode}
        />
      ) : (
        <Signup
          handleSignup={handleSignup}
          error={error}
          toggleAuthenticationMode={toggleAuthenticationMode}
        />
      )}
    </div>
  )
}

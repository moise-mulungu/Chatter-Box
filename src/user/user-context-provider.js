import React, { createContext, useState, useEffect } from 'react'
import { auth } from '../firebase'
import { Puff } from 'react-loader-spinner'

export const UserContext = createContext()

export default function UserContextProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log('Firebase user:', firebaseUser)
      console.log('Firebase with Display Name:', firebaseUser && firebaseUser.displayName)
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Puff color="#00BFFF" height={100} width={100} timeout={3000} />
      </div>
    )

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}

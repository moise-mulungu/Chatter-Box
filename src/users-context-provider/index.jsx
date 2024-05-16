import React, { createContext, useState, useEffect } from 'react'

import { fetchUsers } from './fetch-users'

export const UsersContext = createContext()

export default function UsersContextProvider({ children }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = fetchUsers((fetchedUsers) => {
      setUsers(fetchedUsers)
      setLoading(false)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const updateUserIsTyping = (uid, isTyping) => {
    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        const updatedUser = user.uid === uid ? { ...user, isTyping } : user
        return updatedUser
      })
    })
  }

  const updateUserHasConnected = (user) => {
    setUsers((prevUsers) => {
      const filteredPrevUsers = prevUsers.filter(
        (prevUser) => JSON.stringify(prevUser) !== JSON.stringify(user)
      )

      return [...filteredPrevUsers, user]
    })
  }

  const value = {
    users,
    updateUserIsTyping,
    updateUserHasConnected,
  }

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}

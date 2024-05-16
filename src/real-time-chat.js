import { useState, useEffect, useContext } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import db, { database, auth } from './firebase'
import Header from './header'
import ChatBox from './chat-box'
import MessageInput from './message-input'
import Footer from './footer'
import User from './user'
import UserProfile from './user/user-profile'
import PrivateChatList from './private-chat/private-chat-list'
import PrivateChatWindow from './private-chat/private-chat-window'
import {
  ref as createDatabaseReference,
  onValue as listenToDatabaseValueChanges,
  set as setDatabaseValue,
  get as getDatabaseValue,
} from 'firebase/database'
import { serverTimestamp } from 'firebase/database'
import { UserContext } from './user/user-context-provider'
import { UsersContext } from './users-context-provider'
import { doc, deleteDoc } from 'firebase/firestore'
import { FiLogOut } from 'react-icons/fi'

export default function RealTimeChat() {
  console.log('RealTimeChat Database object:', database)

  const [messages, setMessages] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isProfileVisible, setProfileVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [isPrivateChatActive, setPrivateChatActive] = useState(false)
  const [privateChatUser, setPrivateChatUser] = useState(null)

  const { user: currentUser } = useContext(UserContext)
  const { users, updateUserIsTyping, updateUserHasConnected } = useContext(UsersContext)
  console.log('RealTimeChat w of RealTimeChat:', { currentUser })
  console.log('connected users in the Array:', connectedUsers)
  console.log('RealTimeChat users:', users)

  const messagesCollection = collection(db, 'messages')

  useEffect(() => {
    if (currentUser) {
      onTyping(true)
    } else {
      onTyping(false)
    }
  }, [currentUser])

  // New function to handle typing status
  const onTyping = (isTyping) => {
    console.log('RealTimeChat onTyping function called with:', isTyping, {
      currentUserUid: currentUser?.uid,
      currentUser,
    })

    if (currentUser?.uid) {
      const typingRef = createDatabaseReference(database, `typing/${currentUser.uid}`)

      setDatabaseValue(typingRef, isTyping)
      setConnectedUsers((prevConnectedUsers) =>
        prevConnectedUsers.map((connectedUser) =>
          connectedUser.uid === currentUser.uid ? { ...connectedUser, isTyping } : connectedUser
        )
      )

      updateUserIsTyping(currentUser.uid, isTyping)
    }
  }

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'))
    const unsubscribeFirestore = onSnapshot(q, async (snapshot) => {
      const messages = []

      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() })
      })
      setMessages(messages)
    })

    const unsubscribeDatabaseListeners = users.map((user) => {
      console.log('RealTimeChat connectedUsers.map user:', user)
      if (!user) {
        console.error('User is undefined')
        // return
      }
      const userStatusRef = createDatabaseReference(database, 'status/' + user.uid)

      return listenToDatabaseValueChanges(userStatusRef, (snapshot) => {
        const status = snapshot.val()
        if (status) {
          console.log('RealTimeChat User status:', { user, status })
        }
      })
    })

    const typingRef = createDatabaseReference(database, 'typing')
    const unsubscribeTyping = listenToDatabaseValueChanges(typingRef, (snapshot) => {
      const typingUsers = []
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.val() === true) {
          typingUsers.push(childSnapshot.key)
        }
      })

      setTypingUsers(typingUsers)
    })

    const unsubscribeAuth = auth.onAuthStateChanged((updatedUser) => {
      if (updatedUser) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }

      setLoading(false)
    })

    return () => {
      unsubscribeFirestore()
      unsubscribeDatabaseListeners.forEach((unsubscribe) => unsubscribe())
      unsubscribeTyping()
      unsubscribeAuth()
    }
  }, [connectedUsers])

  const onSendMessage = (message) => {
    setMessages((previousMessages) => [...previousMessages, message])
  }

  const receiveMessages = (currentUser, privateChatUser, setMessages) => {
    const q = query(
      messagesCollection,
      where('sender', 'in', [currentUser.uid, privateChatUser.uid]),
      where('receiver', 'in', [currentUser.uid, privateChatUser.uid]),
      orderBy('timestamp', 'asc')
    )

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data())
      setMessages(messages)
    })
  }

  useEffect(() => {
    if (currentUser && privateChatUser) {
      const unsubscribe = receiveMessages(currentUser, privateChatUser, setMessages)
      return unsubscribe
    }
  }, [currentUser, privateChatUser])

  const deleteMessage = async (message) => {
    setMessages((previousMessages) => previousMessages.filter((m) => m.id !== message.id))

    try {
      const messageDocRef = doc(db, 'messages', message.id)
      await deleteDoc(messageDocRef)
    } catch (e) {
      console.error('Error removing document: ', e)
    }
  }

  useEffect(() => {
    const usersStatusReference = createDatabaseReference(database, 'status')

    const stopListeningToStatusChanges = listenToDatabaseValueChanges(
      usersStatusReference,
      (snapshot) => {
        console.log(
          'RealTimeChat useEffect deps [] userStatusChanges listener fired:',
          snapshot.val()
        )

        const userPromises = []
        snapshot.forEach((childSnapshot) => {
          const userStatus = childSnapshot.val()
          console.log('RealTimeChat useEffect deps [] userStatusChanges userStatus:', {
            userStatusDisplayName: userStatus.displayName,
            userStatusUid: userStatus.uid,
            userStatusState: userStatus.state,
            userStatus,
            childSnapshot,
            childSnapshotKey: childSnapshot.key,
          })

          if (userStatus.state !== 'online') {
            return
          }

          const userReference = createDatabaseReference(database, 'users/' + childSnapshot.key)
          const userPromise = getDatabaseValue(userReference).then((userSnapshot) => {
            const user = userSnapshot.val()

            console.log(`Fetched user data: ${JSON.stringify(user)}`)
            return {
              uid: childSnapshot.key,
              displayName: user?.displayName,
              ...userStatus,
            }
          })
          userPromises.push(userPromise)
        })

        Promise.all(userPromises).then((updatedUsers) => {
          const uniqueUsers = Array.from(new Set(updatedUsers.map((user) => user.uid))).map(
            (uid) => {
              return updatedUsers.find((user) => user.uid === uid)
            }
          )
          console.log(
            'RealTimeChat useEffect deps [] userStatusChanges about to setConnectedUsers():',
            uniqueUsers
          )

          setConnectedUsers(uniqueUsers)
        })
      }
    )

    return () => stopListeningToStatusChanges()
  }, [])

  useEffect(() => {}, [connectedUsers])

  const handleUserConnect = (user) => {
    console.log('handleUserConnect called with user:', user)
    const userStatusDatabaseRef = createDatabaseReference(database, 'status/' + user.uid)

    setDatabaseValue(userStatusDatabaseRef, {
      state: 'online',
      last_changed: serverTimestamp(),
      displayName: user.displayName,
    })

    setConnectedUsers((prevConnectedUsers) => [...prevConnectedUsers, user])

    updateUserHasConnected(user)

    setIsAuthenticated(true)
    setIsActive(true)
  }

  const handleUserDisconnect = (user) => {
    return new Promise((resolve, reject) => {
      console.log('handleUserDisconnect called with user:', user)
      const userStatusDatabaseRef = createDatabaseReference(database, 'status/' + user.uid)

      setDatabaseValue(userStatusDatabaseRef, {
        state: 'offline',
        last_changed: serverTimestamp(),
        displayName: user.displayName,
      })
        .then(() => {
          setConnectedUsers((prevConnectedUsers) =>
            prevConnectedUsers.filter((u) => u.uid !== user.uid)
          )

          setIsAuthenticated(false)
          setIsActive(false)
          resolve()
        })
        .catch((error) => {
          console.error('Error disconnecting user: ', error)
          reject(error)
        })
    })
  }

  const onAuthenticate = (isAuthenticated) => {
    setIsAuthenticated(isAuthenticated)
  }

  const handleSignOut = async () => {
    try {
      await handleUserDisconnect(currentUser)
      await auth.signOut()
      console.log('User signed out')
      setIsActive(false)
    } catch (error) {
      console.error('Error signing out: ', error)
    }
  }

  useEffect(() => {
    console.log(selectedUser)
  }, [selectedUser])

  const startPrivateChat = (user) => {
    console.log('startPrivateChat called with user:', user)
    setPrivateChatUser(user)
    setPrivateChatActive(true)
  }

  const closePrivateChat = () => {
    console.log('closePrivateChat called')
    setPrivateChatUser(null)
    setPrivateChatActive(false)
  }

  return (
    <>
      {!isAuthenticated && (
        <User handleUserConnect={handleUserConnect} onAuthenticate={onAuthenticate} />
      )}
      {isAuthenticated && (
        <div className="flex flex-col h-screen bg-gray-100 mx-2 md:mx-0">
          <Header className="h-10 md:h-10" />
          {isProfileVisible ? (
            <UserProfile
              setSelectedUser={setSelectedUser}
              selectedUser={selectedUser}
              setProfileVisible={setProfileVisible}
              isActive={isActive}
            />
          ) : isPrivateChatActive ? (
            <PrivateChatWindow
              currentUser={currentUser}
              privateChatUser={privateChatUser}
              closePrivateChat={closePrivateChat}
            />
          ) : (
            <div className="flex-1">
              <div className="flex flex-col md:flex-row flex-grow h-full md:h-full">
                <div className="flex flex-col flex-grow md:w-1/3 border-r-2 border-gray-200">
                  <ChatBox
                    messages={messages}
                    deleteMessage={deleteMessage}
                    currentUser={currentUser}
                  />
                </div>
                <div className="flex flex-col flex-grow md:w-1/3 border-r-2 border-gray-200">
                  <MessageInput
                    onSendMessage={onSendMessage}
                    onTyping={(isTyping) => onTyping(isTyping)}
                  />
                </div>

                <div className="flex flex-col flex-grow md:w-1/3 border-r-2 border-gray-200">
                  <div className="flex flex-col h-full">
                    <div className="flex-grow">
                      <h2 className="text-gray-100 bg-purple-500 p-2 rounded text-xl font-bold text-center mb-4">
                        Connected Users
                      </h2>

                      {connectedUsers.map((user) => {
                        console.log('RealTimeChat connectedUsers.map user:', user)
                        const formattedDisplayName =
                          user?.displayName &&
                          user?.displayName[0].toUpperCase() + user?.displayName.slice(1)

                        console.log('RealTimeChat real-time-chat/index.jsx ', {
                          user,
                          typeofUserDisplayname: typeof user?.displayName,
                          userDisplayname: user?.displayName,
                          userUid: user?.uid,
                          users,
                        })
                        if (!user) {
                          console.error('User is undefined')
                          return
                        }

                        const isTyping = typingUsers.includes(user.uid)

                        return (
                          <div
                            key={user?.uid}
                            className="flex justify-between items-center text-gray-500 p-2 rounded mt-4 mb-4 shadow-md cursor-pointer"
                            onClick={() => {
                              console.log('Clicked user:', user)
                              if (user.uid == currentUser.uid) {
                                console.log('Selected user:', user)

                                setSelectedUser(user)

                                setProfileVisible(true)
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <img
                                src={user?.photoURL ? user.photoURL : '/user-avatar.jpg'}
                                alt="User Profile"
                                className="w-10 h-10 rounded-full cursor-pointer mr-2"
                              />
                              <span className="hover:text-purple-500 transition-colors duration-200">
                                {formattedDisplayName || user?.uid}
                              </span>
                              <span className="ml-2 h-2 w-2 bg-green-500 rounded-full" />
                            </div>

                            {isTyping && (
                              <span className="ml-2 animate-pulse text-2xl text-blue-500 flex-shrink-0">
                                ...
                              </span>
                            )}

                            {user.uid === currentUser.uid && (
                              <div className="flex items-center">
                                <FiLogOut
                                  onClick={handleSignOut}
                                  className="cursor-pointer text-red-500 hover:text-red-700 mr-1"
                                  size={24}
                                />
                                <span className="text-xs text-red-500 mt-0.5">Sign Out</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <PrivateChatList
                        currentUser={currentUser}
                        users={users}
                        startPrivateChat={startPrivateChat}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Footer className="h-10 md:h-10" />
        </div>
      )}
    </>
  )
}

import { useEffect, useState, useRef, useContext } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { usersCollection } from './firebase'
import { onSnapshot } from 'firebase/firestore'
import db from './firebase'
import { UserContext } from './user/user-context-provider'
import { globalStateStore } from './global-state-store'

export default function ChatBox({ messages, deleteMessage }) {
  const [userData, setUserData] = useState({})
  const messagesContainerRef = useRef(null)

  const testKey = globalStateStore((state) => state.testKey) // Access the global state
  const setTestKey = globalStateStore((state) => state.setTestKey) // Access the setter function

  const { user: currentUser } = useContext(UserContext)

  useEffect(() => {
    setTestKey('newValue') // Update the global state
  }, [])

  useEffect(() => {
    if (!db) return

    const fetchAllUserData = async () => {
      const uniqueSenders = [...new Set(messages.map((message) => message.sender))]
      const newUserData = {}
      for (const sender of uniqueSenders) {
      }
      setUserData(newUserData)
    }

    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      try {
        const updatedUserData = { ...userData }
        snapshot.docs.forEach((doc) => {
          updatedUserData[doc.id] = doc.data()
        })
        setUserData(updatedUserData)
      } catch (error) {
        console.error('Error in onSnapshot callback:', error)
      }
    })

    fetchAllUserData()
    return () => {
      unsubscribe()
    }
  }, [messages, db])

  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight } = messagesContainerRef.current
      messagesContainerRef.current.scrollTop = scrollHeight
    }
  }, [messages])

  const getMessageTimestamp = (timestamp) => {
    const messageDate = new Date(timestamp)

    const currentDate = new Date()

    if (
      messageDate.getFullYear() === currentDate.getFullYear() &&
      messageDate.getMonth() === currentDate.getMonth() &&
      messageDate.getDate() === currentDate.getDate()
    ) {
      const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      // Return a message indicating the message was sent today with the formatted time
      return `today, ${timeString}`
    } else if (
      messageDate.getFullYear() === currentDate.getFullYear() &&
      messageDate.getMonth() === currentDate.getMonth() &&
      messageDate.getDate() === currentDate.getDate() - 1
    ) {
      return 'yesterday'
    } else {
      return messageDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  const handleUserClick = (user) => {
    console.log(user)
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-grow overflow-y-auto rounded p-4 bg-purple-500 text-white h-96"
    >
      {messages?.map((message, index) => {
        const sender = message.senderName || message.sender
        const user = userData[message.sender]

        return (
          <div
            key={message.timestamp + message.sender}
            className="mb-4 border-b-2 border-purple-300 p-2"
          >
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={currentUser?.uid === message.sender ? currentUser?.photoURL : user?.photoURL}
                  alt="User Profile"
                  className="w-10 h-10 rounded-full cursor-pointer"
                  onClick={() => handleUserClick(user)}
                />
                <div className="flex-grow">
                  <strong
                    className="font-bold cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    {user?.name || sender}
                  </strong>
                  : {message?.text}{' '}
                </div>
                <em className="text-sm text-purple-300">
                  {message?.timestamp ? getMessageTimestamp(message.timestamp) : ''}
                </em>
              </div>

              {currentUser && currentUser?.uid === message.sender && (
                <button onClick={() => deleteMessage(message)}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

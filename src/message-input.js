import { useState, useContext, useEffect, useRef } from 'react'
import { UserContext } from './user/user-context-provider'
import { addDoc, collection, getDoc, getDocs, updateDoc, doc } from 'firebase/firestore'
import db from './firebase'
import { getAuth } from 'firebase/auth'

import { throttle } from 'lodash' // for throttling

export default function MessageInput({ onSendMessage, onTyping }) {
  const [message, setMessage] = useState('')
  const [prevMessage, setPrevMessage] = useState('') // to store the previous message
  const typingTimeoutRef = useRef(null) // reference to store the timeout

  useEffect(() => {
    const updateAllMessages = async () => {
      // Fetch all messages
      const messagesSnapshot = await getDocs(collection(db, 'messages'))
      console.log('messages snapshot:', messagesSnapshot)
      // Prepare an array to hold all update promises
      const updatePromises = []

      // Loop over each message
      messagesSnapshot.docs.forEach((messageDoc) => {
        // Fetch the user associated with this message
        const userPromise = getDoc(doc(db, 'users', messageDoc.data().sender))

        // Add the update promise to the array
        updatePromises.push(
          userPromise.then(async (userSnapshot) => {
            if (userSnapshot.exists()) {
              // Update the message with the user's displayName
              return updateDoc(doc(db, 'messages', messageDoc.id), {
                senderName: userSnapshot.data().displayName,
              }).catch((error) => {
                console.error(`Failed to update document: ${messageDoc.id}`, error)
              })
            } else {
              console.warn(`User document not found for sender ID: ${messageDoc.data().sender}`)
            }
          })
        )
      })

      // Wait for all updates to complete
      await Promise.all(updatePromises)
    }

    updateAllMessages()
    if (message !== '') {
      onTyping(true)
    }
    return () => {
      onTyping(false)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current) // clear the timeout when the component unmounts
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const auth = getAuth()
    if (!auth.currentUser) {
      console.log('User is not authenticated')
      return
    }

    if (!user.user?.displayName) {
      console.error('User or user.displayName is undefined', { user })
      return
    }

    // Trim the message and check if it's empty
    const trimmedMessage = message.trim()
    if (trimmedMessage === '') {
      return
    }

    const messageObj = {
      text: message,
      sender: user.user.uid, // Store the user's ID instead of the display name
      senderName: user.user.displayName,
      timestamp: Date.now(),
    }

    // await addDoc(collection(db, 'messages'), messageObj)
    const docRef = await addDoc(collection(db, 'messages'), messageObj)

    // Retrieve the document to get its id
    const docSnapshot = await getDoc(docRef)

    // Add the Firestore-generated id to the message object
    messageObj.id = docSnapshot.id
    onSendMessage(messageObj)
    setMessage('')

    onTyping(false)
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)

    const isInputFieldNotEmpty = e.target.value !== ''

    const isDifferentFromPreviousMessage = e.target.value !== prevMessage
    const isUserTypingNewContent = isInputFieldNotEmpty && isDifferentFromPreviousMessage // check if the user is typing new content

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current) // clear the previous timeout

    // set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false)
    }, 3000) // 3 seconds

    // throttle the onTyping function to only call it once every 3 seconds
    const throttledOnTyping = throttle(onTyping, 3000)
    throttledOnTyping(isUserTypingNewContent)

    onTyping(isUserTypingNewContent)
    setPrevMessage(e.target.value) // update the previous message
  }

  // ctrl + enter to send message and keep multiline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e)
    }
  }

  const user = useContext(UserContext)
  console.log({ user })
  console.log(user.displayName)

  const rows = message.split('\n').length

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full border-t-2 border-purple-300 p-4">
      <textarea
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        className="w-full flex-grow mb-4 p-2 rounded border-2 border-purple-500 resize-none"
        rows={rows}
      />
      <button type="submit" className="bg-green-500 text-white rounded p-2">
        Send
      </button>
    </form>
  )
}

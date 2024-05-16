import React, { useState, useEffect } from 'react'

function PrivateChatWindow({ currentUser, privateChatUser, closePrivateChat, receiveMessages }) {
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const unsubscribe = receiveMessages(currentUser, privateChatUser, setMessages)
    return unsubscribe
  }, [currentUser, privateChatUser])

  const handleSendMessage = () => {
    if (messageInput.trim() !== '') {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: prevMessages.length + 1, 
          sender: currentUser.uid,
          receiver: privateChatUser.uid,
          text: messageInput.trim(),
          timestamp: new Date().toISOString(), 
        },
      ])
      setMessageInput('') 
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center text-gray-500 p-2 rounded shadow-md">
        <span className="hover:text-purple-500 transition-colors duration-200">
          {privateChatUser.displayName || privateChatUser.uid}
        </span>
        <button onClick={closePrivateChat} className="text-xs text-red-500 mt-0.5">
          Close
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="flex flex-col mt-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.sender === currentUser.uid ? 'items-end' : 'items-start'
              } mb-2`}
            >
              <div
                className={`max-w-xs mx-2 p-2 rounded-lg ${
                  message.sender === currentUser.uid ? 'bg-blue-200' : 'bg-gray-200'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              <p className="text-xs text-gray-500">{message.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-2">
        <div className="flex">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 mr-2 border rounded-md focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="bg-purple-500 text-white px-4 py-2 rounded-md focus:outline-none"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrivateChatWindow

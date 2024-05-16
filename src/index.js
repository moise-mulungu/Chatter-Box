import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import RealTimeChat from './real-time-chat'
import UserContextProvider from './user/user-context-provider'
import UsersContextProvider from './users-context-provider'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <UsersContextProvider>
    <UserContextProvider>
      <RealTimeChat />
    </UserContextProvider>
  </UsersContextProvider>
)

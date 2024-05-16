import { useState } from 'react'

export default function Signup({ handleSignup, error, toggleAuthenticationMode }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 mx-2 md:mx-0">
      <div className="bg-purple-500 text-white rounded-lg shadow-lg p-8 md:w-1/3 h-full md:h-2/3 flex items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Signup</h1>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="p-2 border-2 border-gray-200 rounded mb-2 w-full text-black"
            autoComplete="email"
          />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            placeholder="Username"
            className="p-2 border-2 border-gray-200 rounded mb-2 w-full text-black"
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="p-2 border-2 border-gray-200 rounded mb-2 w-full text-black"
          />
          {error && <p className="text-black">{error}</p>}
          <button
            onClick={() => {
              handleSignup(email, username, password)
            }}
            className="p-2 mt-4 bg-yellow-500 text-white rounded mb-2 w-full"
          >
            Signup
          </button>

          <button
            href="#"
            onClick={toggleAuthenticationMode}
            className="text-white text-xl border-b-2 border-green-500"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

/*
(done)DM: I don't understand what you are trying to fix. Your list below is good, but please state the problem in detail before listing your steps. MM: this assignment is from the official-ux-review file: bug - upon new signup, the display name is empty, so any messages the user types is not shown in the messages list. Solution: upon signup, automatically populate displayName with username from the signup form DM: ok, good, just add that to the top of your list going forward. MM: ok, it's done.
 In order to fix the signup of a newly connected user, i :
  0. bug to fix: display name empty upon new signup
  1. checked the diff commit of the Signup, User, and firebase config files
  2. checked the firebase console for the new user
  3. i tried to update the signup function in the firebase config file, but it didn't work
  4. i stopped here first as i was running out of the time, i will try to fix it later 
*/

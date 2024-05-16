import { useState, useContext, useEffect } from 'react'
import { UserContext } from './user-context-provider'
import { updateProfile, getAuth } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import db, { auth, signOut } from '../firebase'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { BounceLoader } from 'react-spinners'
import User from './index'
import { FiLogOut } from 'react-icons/fi'

const UserProfile = ({ setSelectedUser, setProfileVisible, isActive }) => {
  const { user, setUser } = useContext(UserContext)

  const [displayName, setDisplayName] = useState(user ? user.displayName : '')
  const [photoURL, setPhotoURL] = useState(user ? user.photoURL : '')
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignedOut, setIsSignedOut] = useState(false)

  const storage = getStorage()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((updatedUser) => {
      if (updatedUser) {
        setUser(updatedUser)
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName)
      setPhotoURL(user.photoURL)
    }
  }, [user])

  const updateProfileAndFirestore = async (userPhotoUrl) => {
    if (!user || !user.uid) {
      console.error('User or user.uid is not defined')
      return
    }
    await updateProfile(user, {
      displayName,
      photoURL: userPhotoUrl,
    })

    await setDoc(doc(db, 'users', user.uid), {
      displayName,
      photoURL: userPhotoUrl,
      isActive,
    })
  }

  const handleUpdateProfile = async () => {
    if (!user) {
      console.error('User is not defined')
      return
    }

    setIsLoading(true)

    try {
      let userPhotoUrl = user.photoURL
      if (selectedProfilePhoto) {
        const storageRef = ref(storage, `profilePhotos/${user.uid}`)

        const uploadTask = uploadBytesResumable(storageRef, selectedProfilePhoto)

        uploadTask.on(
          'state_changed',
          (snapshot) => {},
          (error) => {
            console.error('Error uploading file', error)
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            userPhotoUrl = downloadURL
            await updateProfileAndFirestore(userPhotoUrl)
            const unsubscribe = auth.onAuthStateChanged((updatedUser) => {
              if (updatedUser) {
                setUser(updatedUser)
                setSelectedUser(null)
                setProfileVisible(false)
                unsubscribe()
              } else {
                console.error(
                  "User is is not signed in (not authenticated). This could occur if the user signs out, if the user's session expires, or if the user's account is deleted"
                )
              }
            })
          }
        )
      } else {
        await updateProfileAndFirestore(userPhotoUrl)

        const unsubscribe = auth.onAuthStateChanged((updatedUser) => {
          console.log('updatedUser', updatedUser)

          const userIsSignedIn = !!updatedUser
          if (userIsSignedIn) {
            setUser(updatedUser)
            setSelectedUser(null)
            setProfileVisible(false)
            unsubscribe()
          } else {
            console.error(
              "User is is not signed in (not authenticated). This could occur if the user signs out, if the user's session expires, or if the user's account is deleted"
            )
          }
        })
      }
    } catch (error) {
      console.error('Error updating profile', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setProfileVisible(false)
      setIsSignedOut(true)
    } catch (error) {
      console.error('Error signing out', error)
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setProfileVisible(false)
        }
      }}
    >
      {isSignedOut ? (
        <User />
      ) : isLoading ? (
        <BounceLoader color={'#123abc'} loading={isLoading} size={60} />
      ) : (
        <div className="p-8 bg-white shadow-md rounded relative">
          <h2 className="text-2xl text-purple-500 font-bold mb-5 text-center">User Profile</h2>
          <div className="absolute top-0 right-0 p-2 mt-2 mr-2 flex flex-col items-center">
            <FiLogOut
              onClick={handleSignOut}
              className="cursor-pointer text-red-500 hover:text-red-700"
              size={24}
            />
            <span className="text-xs text-red-500 mt-1">Sign Out</span>
          </div>
          <div className="flex items-center justify-center mb-5">
            <img className="w-24 h-24 rounded-full" src={photoURL} alt="Profile" />
          </div>

          <div className="mb-4">
            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <span className="text-gray-500 leading-tight" id="email">
              {user ? user.email : ''}
            </span>
          </div>
          <div className="mb-4">
            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="displayName">
              Display Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 leading-tight focus:outline-none focus:shadow-outline"
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="photoURL">
              Photo URL
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="photoURL"
              type="file"
              onChange={(e) => setSelectedProfilePhoto(e.target.files[0])}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-green-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={handleUpdateProfile}
              disabled={isLoading}
            >
              Update Profile
            </button>
            {isLoading && <BounceLoader color={'#123abc'} size={24} className="ml-2" />}
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => setProfileVisible(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile

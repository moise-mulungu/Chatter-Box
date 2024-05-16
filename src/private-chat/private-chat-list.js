function PrivateChatList({ currentUser, users, startPrivateChat }) {
  console.log('users', users)

  return (
    <div className="flex-grow overflow-y-auto">
      {users.map(
        (user) =>
          user.uid !== currentUser.uid && (
            <div
              key={user.uid}
              className="flex justify-between items-center text-gray-500 p-2 rounded mt-4 mb-4 shadow-md cursor-pointer"
              onClick={() => startPrivateChat(user)}
            >
              <div className="flex items-center">
                <span className="hover:text-purple-500 transition-colors duration-200">
                  {user.displayName || user.uid}
                </span>
                <span className="ml-2 h-2 w-2 bg-green-500 rounded-full" />
              </div>
            </div>
          )
      )}
    </div>
  )
}

export default PrivateChatList

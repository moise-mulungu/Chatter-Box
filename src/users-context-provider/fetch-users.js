import { collection, getDocs, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import db from '../firebase' // import your Firebase config

// DM: NO CHANGES TO THIS FILE, read, but dont implement my todo-MMs below. But, if you copy some code from here, copy my todo-MMs and implement them in the new provider in users-context-provider-2.(ok)

/*

your new users provider needs to gather all info about a user, except messages, that is separate. it looks like that info is in two places: realtime and firestore databases

*/

// export async function fetchUsers() {
export function fetchUsers(callback) {
  // const users = []

  // access the users collection in Firestore
  const usersCollectionReference = collection(db, 'users')

  const previousData = {}
  // query the users collection for users where isActive is true
  //(done) DM: dont use abbreviations. q can be query
  // const q = query(usersCollectionReference, where('isActive', '==', true))
  // DM: even when I removed the where clause, the query still returns only one user, "geny". why?
  // MM: i am not sure why the where clause is not working. i will work on it next time.
  // DM: look in the database in the console. "geny" is probably the only user there. So, work on what process triggers a new user in the database.
  // const usersQuery = query(usersCollectionReference)

  // get the users from Firestore
  // const usersSnapshot = await getDocs(usersQuery)
  const unsubscribe = onSnapshot(usersCollectionReference, (userSnapshot) => {
    //(done) DM: look at the console.logs in this function to see what data is coming back from the database, then work on the database queries to get the data you want
    console.log('fetchUsers onSnapshot', { snapshot: userSnapshot })
    let isActiveChanged = false
    // usersSnapshot.forEach((doc, index) => {
    userSnapshot.docChanges().forEach((change) => {
      // DM: todoMM: assign all expressions to a well-named variable. Also console.log them. "change.doc.previousData().isActive" is too long of an expression and is a good candidate for a variable name that makes it clear what is going on. Even if a variable name seems obvious, it is easy to log and logical expressions are easier to read.
      // DM: todoMM: Also, you can do early returns EX if (change.type !== 'modified') return; to make logical expressions more simple.
      console.log('fetchUsers snapshot.docChanges', { change })
      if (change.type === 'modified') {
        const currentData = change.doc.data()
        const previousIsActive = previousData[change.doc.id]?.isActive

        if (currentData.isActive !== previousIsActive) {
          isActiveChanged = true
        }

        // Update previousData with the current data
        previousData[change.doc.id] = currentData
      }
    })
    if (isActiveChanged) {
      const users = []
      userSnapshot.forEach((doc) => {
        const user = doc.data()
        console.log('fetchUsers each userSnapshot', {
          usersCollectionReference,
          // usersQuery,
          doc,
          user,
        })
        // Calculate whether the user is active or not
        const lastMessageTimestamp = user.lastMessageTimestamp?.toDate()
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)
        user.isActive = lastMessageTimestamp >= oneDayAgo
        users.push(user)
      })
      callback(users)
    }
  })

  return unsubscribe
}

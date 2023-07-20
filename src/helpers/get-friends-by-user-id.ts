import { fetchRedis } from './redis'

export const getFriendsByUserId = async (userId: string) => {
  // retrieve friends for current user
  console.log("userid", userId)
  const friendIds = (await fetchRedis(
    'smembers',
    `user:${userId}:friends`
  )) as string[]
  console.log("friend ids", friendIds)

  const friends = await Promise.all( // [] of promises, and all the promises are called at the same time 
    friendIds.map(async (friendId) => {
      const friend = await fetchRedis('get', `user:${friendId}`) as string
      const parsedFriend = JSON.parse(friend) as User
      return parsedFriend
    })
  )

  return friends // now we ve the friends array we can use this in our layout to get access to all the friends this person has
}

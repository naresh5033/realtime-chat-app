import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { pusherServer } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { id: idToAdd } = z.object({ id: z.string() }).parse(body) //parse request body and get the id / with the zod validation

    const session = await getServerSession(authOptions)

    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    // verify both users are not already friends
    const isAlreadyFriends = await fetchRedis(
      'sismember',
      `user:${session.user.id}:friends`,
      idToAdd
    )

    if (isAlreadyFriends) {
      return new Response('Already friends', { status: 400 })
    }

    // lets determine if the user has incoming friend request
    const hasFriendRequest = await fetchRedis(
      'sismember',
      `user:${session.user.id}:incoming_friend_requests`,
      idToAdd
    )

    if (!hasFriendRequest) {
      return new Response('No friend request', { status: 400 })
    }
    // get the user and the friend id
    const [userRaw, friendRaw] = (await Promise.all([ // here we wana pass in [] of promises that we wana executed 
      fetchRedis('get', `user:${session.user.id}`), 
      fetchRedis('get', `user:${idToAdd}`),
    ])) as [string, string]

    const user = JSON.parse(userRaw) as User
    const friend = JSON.parse(friendRaw) as User

    // notify added user, so when the friend accepts the friend req the sender will be notified by this evnet listener

    await Promise.all([ //execte them suimutaneously that will significantly improves the performance of our api route
      pusherServer.trigger(
        toPusherKey(`user:${idToAdd}:friends`),
        'new_friend',
        user
      ),
      pusherServer.trigger(
        toPusherKey(`user:${session.user.id}:friends`),
        'new_friend',
        friend
      ), // so by this way our friend will get our data and we will get our friend data
      
      db.sadd(`user:${session.user.id}:friends`, idToAdd), //add the user as a friend to the db
      db.sadd(`user:${idToAdd}:friends`, session.user.id), // now we wana add the user to the requerter's friend list the (other way aroutnd) 
      db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd), //since both users are friends now, so remove the friend requests
    ])

    return new Response('OK')
  } catch (error) {
    console.log(error)

    if (error instanceof z.ZodError) {
      return new Response('Invalid request payload', { status: 422 })
    }

    return new Response('Invalid request', { status: 400 })
  }
}
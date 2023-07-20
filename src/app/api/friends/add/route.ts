import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { pusherServer } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import { addFriendValidator } from '@/lib/validations/add-friend'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email: emailToAdd } = addFriendValidator.parse(body.email)

    const idToAdd = (await fetchRedis(
      'get',
      `user:email:${emailToAdd}`
    )) as string

    if (!idToAdd) { //if the current user does not exists
      return new Response('This person does not exist.', { status: 400 })
    }

    // as we'd know who's making the request
    const session = await getServerSession(authOptions)

    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (idToAdd === session.user.id) {
      return new Response('You cannot add yourself as a friend', {
        status: 400,
      })
    }

    // check if user is already added
    const isAlreadyAdded = (await fetchRedis(
      'sismember',//s - set[]
      `user:${idToAdd}:incoming_friend_requests`,// if the user already logged in is the member of the friends req
      session.user.id
    )) as 0 | 1 // either the user is the member or not

    if (isAlreadyAdded) {
      return new Response('Already added this user', { status: 400 })
    }

    // check if they re already friends
    const isAlreadyFriends = (await fetchRedis(
      'sismember', 
      `user:${session.user.id}:friends`, 
      idToAdd
    )) as 0 | 1 

    if (isAlreadyFriends) {
      return new Response('Already friends with this user', { status: 400 })
    }

    // valid request, send friend request

    // lets trigger the event (incomming friend request)
    await pusherServer.trigger(
      toPusherKey(`user:${idToAdd}:incoming_friend_requests`), //1st arg is channel, and same like the subscribe(), the trigger() wont accept the :, so use the helper fn
      'incoming_friend_requests', // event
      {
        senderId: session.user.id,
        senderEmail: session.user.email,
      }
    )
      // since its a post req (set add), and only the get req will ve the cached
    await db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id) // the user thats logged in is gon put into the list of icomming friend req 

    return new Response('OK')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response('Invalid request payload', { status: 422 }) //422 - for unprocessable entity
    }

    return new Response('Invalid request', { status: 400 })
  }
}

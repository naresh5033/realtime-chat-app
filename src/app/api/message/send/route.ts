import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { pusherServer } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import { Message, messageValidator } from '@/lib/validations/message'
import { nanoid } from 'nanoid'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  try {
    const { text, chatId }: { text: string; chatId: string } = await req.json()
    const session = await getServerSession(authOptions)

    if (!session) return new Response('Unauthorized', { status: 401 })

    const [userId1, userId2] = chatId.split('--')

    if (session.user.id !== userId1 && session.user.id !== userId2) {
      return new Response('Unauthorized', { status: 401 })
    }

    const friendId = session.user.id === userId1 ? userId2 : userId1

    const friendList = (await fetchRedis(
      'smembers',
      `user:${session.user.id}:friends`
    )) as string[]
    const isFriend = friendList.includes(friendId)

    if (!isFriend) {
      return new Response('Unauthorized', { status: 401 })
    }

    const rawSender = (await fetchRedis(
      'get',
      `user:${session.user.id}`
    )) as string
    const sender = JSON.parse(rawSender) as User

    const timestamp = Date.now()

    // we ve to notify the msgs to the user in the real time and then we ve to persist those msgs in the db
    //first lets define the message
    const messageData: Message = {
      id: nanoid(),
      senderId: session.user.id,
      text,
      timestamp,
    }

    // then validate the message
    const message = messageValidator.parse(messageData)

    // notify all connected chat room clients before persist the msg to the db/ trigger the pusher even 
    await pusherServer.trigger(toPusherKey(`chat:${chatId}`), 'incoming-message', message) // channel, event and msg

    // we don't want to listen to all chats. we don't want like 100s of websockets instances for the chats, so instead we can trigger the chat event that contains the msg infos, and by that we'll know which chat this is concerning, so that we can listen to only one event
    await pusherServer.trigger(toPusherKey(`user:${friendId}:chats`), 'new_message', {
      ...message,
      senderImg: sender.image,
      senderName: sender.name
    })

    // all valid, send the message to db (zadd - sorted add) 
    await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp, // so we'll know the order of the mags 
      member: JSON.stringify(message),
    })

    return new Response('OK')
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 })
    }

    return new Response('Internal Server Error', { status: 500 })
  }
}

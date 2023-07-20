'use client'

import { pusherClient } from '@/lib/pusher'
import { chatHrefConstructor, toPusherKey } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import UnseenChatToast from './UnseenChatToast'

interface SidebarChatListProps {
  friends: User[]
  sessionId: string
}

interface ExtendedMessage extends Message {
  senderImg: string
  senderName: string
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([])
  const [activeChats, setActiveChats] = useState<User[]>(friends) 

  // the event listener for the incomming messages and the friend req
  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`)) // chat channel
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`))// friend channel

    const newFriendHandler = (newFriend: User) => {
      console.log("received new user", newFriend)
      setActiveChats((prev) => [...prev, newFriend]) // add whatever the prev chat was and add the new friend 
    }

    const chatHandler = (message: ExtendedMessage) => {
      const shouldNotify =
        pathname !==
        `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}` // we don't wana get this notification when we re alreay in that chat, we only wana get notified when we re in the other pages or other chats.

      if (!shouldNotify) return // guard clause the code won't be executed

      // should be notified
      toast.custom((t) => (
        <UnseenChatToast
          t={t}
          sessionId={sessionId}
          senderId={message.senderId}
          senderImg={message.senderImg}
          senderMessage={message.text}
          senderName={message.senderName}
        />
      ))

      setUnseenMessages((prev) => [...prev, message])
    }

    pusherClient.bind('new_message', chatHandler)
    pusherClient.bind('new_friend', newFriendHandler)

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`))
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`))

      pusherClient.unbind('new_message', chatHandler)
      pusherClient.unbind('new_friend', newFriendHandler)
    } // finally unsubscribe and unbind both of the events
  }, [pathname, sessionId, router])

  useEffect(() => {
    if (pathname?.includes('chat')) {
      setUnseenMessages((prev) => { // access the previous messages and filter em if the pathname not icludes the senderid then its unseen msg, if they re on the corresponding chat and it will take those our the state coz they ve seen the msgs
        return prev.filter((msg) => !pathname.includes(msg.senderId))
      })
    }
  }, [pathname])

  return ( // the max h and overflow for the scroll bar, it shouldn't push all the content below the screen
    <ul role='list' className='max-h-[25rem] overflow-y-auto -mx-2 space-y-1'>
      {activeChats.sort().map((friend) => {
        const unseenMessagesCount = unseenMessages.filter((unseenMsg) => {
          return unseenMsg.senderId === friend.id
        }).length // to get the no.of unseen messages of the friend

        return (
          <li key={friend.id}>
            <a
              href={`/dashboard/chat/${chatHrefConstructor( // this util fn just for splitting the idsk
                sessionId,
                friend.id
              )}`} // this is how we construct the unseen msg url
              className='text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'>
              {friend.name}
              {unseenMessagesCount > 0 ? (
                <div className='bg-indigo-600 font-medium text-xs text-white w-4 h-4 rounded-full flex justify-center items-center'>
                  {unseenMessagesCount}
                </div>
              ) : null}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export default SidebarChatList

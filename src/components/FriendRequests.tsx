'use client'

import { pusherClient } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import axios from 'axios'
import { Check, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

interface FriendRequestsProps {
  incomingFriendRequests: IncomingFriendRequest[]
  sessionId: string
}

const FriendRequests: FC<FriendRequestsProps> = ({
  incomingFriendRequests,
  sessionId,
}) => {
  const router = useRouter()
  const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(
    incomingFriendRequests
  )

  // to subscribe to the pusher events(friend requests)
  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_requests`) // since the subscribe() doesnt allow the : colon, so we can make use this helper fn toPusherKey
    )
    console.log("listening to ", `user:${sessionId}:incoming_friend_requests`)

    const friendRequestHandler = ({
      senderId,
      senderEmail,
    }: IncomingFriendRequest) => {
      console.log("function got called")
      setFriendRequests((prev) => [...prev, { senderId, senderEmail }])
    }

    // bind the event whenever this cb(frineRequestHandler) fn occurs
    pusherClient.bind('incoming_friend_requests', friendRequestHandler)

    // finally unsubscribe to the event and then unbind the listener
    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_requests`)
      )
      pusherClient.unbind('incoming_friend_requests', friendRequestHandler)
    }
  }, [sessionId])

  // Accept the friend request
  const acceptFriend = async (senderId: string) => {
    await axios.post('/api/friends/accept', { id: senderId })

    setFriendRequests((prev) =>
      prev.filter((request) => request.senderId !== senderId) // if we ve multiple friend reqs we re filtering em, and accepting one, and want to take(filter) him out of the state to only show the other 2, ie y we re filtering em and accept only 1 id
    )

    router.refresh()
  }

  // deny the friend request
  const denyFriend = async (senderId: string) => {
    await axios.post('/api/friends/deny', { id: senderId })

    setFriendRequests((prev) =>
      prev.filter((request) => request.senderId !== senderId) // same logic we wana take him out of the state
    )

    router.refresh()
  }

  return (
    <>
      {friendRequests.length === 0 ? (
        <p className='text-sm text-zinc-500'>Nothing to show here...</p>
      ) : (
        friendRequests.map((request) => (
          <div key={request.senderId} className='flex gap-4 items-center'>
            <UserPlus className='text-black' />
            <p className='font-medium text-lg'>{request.senderEmail}</p>
            <button
              onClick={() => acceptFriend(request.senderId)}
              aria-label='accept friend'
              className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md'>
              <Check className='font-semibold text-white w-3/4 h-3/4' />
            </button>

            <button
              onClick={() => denyFriend(request.senderId)}
              aria-label='deny friend'
              className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md'>
              <X className='font-semibold text-white w-3/4 h-3/4' />
            </button>
          </div>
        ))
      )}
    </>
  )
}

export default FriendRequests

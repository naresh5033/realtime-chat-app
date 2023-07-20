import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// this is for the puhser subscription(), since that fn doesnt allow the : colon, so we can make use this helper fn
export function toPusherKey(key: string) {
  return key.replace(/:/g, '__') //so for any arg of : and replace it wiht the double unerscore
}

// to get the chatId, it simply splits the ids with --
export function chatHrefConstructor(id1: string, id2: string) {
  const sortedIds = [id1, id2].sort()
  return `${sortedIds[0]}--${sortedIds[1]}`
}

import { z } from 'zod'

export const addFriendValidator = z.object({ // that email obj must be of type str and email(format by zod)
  email: z.string().email(),
})

# FriendZone - A full-stack realtime messaging chat application

A modern full-stack nextjs 13 project, with tailwindcss, next auth, reddis db, prisma Orm,

- `npx create-next-app@latest realtime-messaging`

## Features

- Realtime messaging
- Adding friends and sending friend requests via email
- Performant database queries with Redis
- Responsive UI built with TailwindCSS
- Protection of sensitive routes
- Google authentication

- Built with TypeScript
- TailwindCSS
- Icons from Lucide

- Class merging with tailwind-merge
- Conditional classes with clsx
- Variants with class-variance-authority
- middleware - right after the user logged in we will redirects him to the dashboard. the middleware is gon b/w the user and the login comp, when the user made a req to the login it will first goes to the middleware will intercepts the req(wil checks if the person is logged in or not and if he is) and it will then redirect him back to the dashboard.
  - to impl the middleware we can use the next/auth fn withAuth()) from @next-auth/middleware. this withAuth() will receives a callback fn middleware().
- chat comp, make it as a dynamic comp by put them in to the [chatId], and render the paras of the page props, so that way the we can determine which chat we wana show to the user.

# Dependencies

- tailwind `npm i tailwindcss postcss prefixer -D ` and `npx initailwindcss init -p`
- note: if we ever downgrade the packages in the package.json file, and then remove it from the node modules then we ca run the command `Remove-item -Recursive -Force node_modules` and `Remove-item package-lock.json`
- `npm i class-variance-authority` the cva is options for building type-safe UI components; taking away all the worries of class names and StyleSheet composition.
- lucide-react `npm i lucide-react`for the icons
- clsx and tailwind merge `npm i clsx tailwind-merge` the clsx is A tiny (228B) utility for constructing className strings conditionally. which will allow us to use the conditional class names. and the tailwind merge for merge the classes together for the cleaner code.
- for the redis db we can use the upstash service that offers the redis db
  - `npm i @upstash/redis`
- next-auth `npm i --save next-auth` for the authentication.. app/pages/auth/[...nextauth].ts -> any req that are sending to this page is handle by the next auth.
  - for the auth adapters `npm i @next-auth/upstash-redis-adapter` so we can wrap our db with the adapter to handle the authentication.
  - and the session strategy by the JWT
  - and google for the auth provider
  - react-hot-toast `npm i --save react-hot-toast` for the notification
  - we can gen our rsa by using the openssl, which will be used to encrypt/ sign our jwt with, in the NEXT_AUTH_SECRET by `openssl genrsa 2048` or we can type str for the next auth secret
- tailwindcss forms `npm i --save @tailwindcss/forms` for handling our forms, and save that plugin in our taiwind config file
- react-hook-form and zod for the form validation `npm i --save react-hook-form zod @hooksform/resolvers axios` the zod will allows us to define the schema that will then validating the user i/ps, we will define our add friend validation in the lib dir
- react-text-area-autosize `npm i --save react-text-area-autosize` is a dropin replacement for the text area comp, which will automatically resize the text area as the content changes.
- nanoid `npm i --save nanoid` for generating the rand id, like uuid
- date-fns `npm i --save date-fns` for the date time formatter
- **_pusher_** `npm i pusher ` for the server side, distrubution of the real time msgs
- and for the client side to recieving those msgs `npm i pusher-js`
- encoding `npm i encoding`
- react-loading-skeleton `npm i react-loading-skeleton`for our app loading state.
- headless ui -react `npm i @headlessui/react` for the mobile responsive view

## Acknowledgements

- [Awesome Button UI Component](https://ui.shadcn.com/)

## Real Time Features

- when we wana send friend requests that will ve to receive in the real time
- and also when we receive the msg that should be in the real time, should be pop up.
- and then when we not see the msg it should be pop up on the unseen msg with the notification of the sender name, the msg content and the sender img
- and when we click that notification, and it will taken us to the chat field
- We will be using **_pusher_** for the real time service
- When the client send a msg it will forwards to the pusher server, then the pusher will put our messages into the db
- also it will broadcast the msgs to whoever subscribed to chat, in the real time using the websockets
- so before even persist the msgs to the db it will trigger the even to the client and the partner(so it will be in the real time)

### Friend Request

- in the client side we first need to subscribe to the the pusher events.
- so we will subscribe to the events(incomming friend request) in the friendRequest component.
- and then to trigger the event (in the server side), in the api/friends/adds
- And couple of things we ve to do in this Friend Request comp

  1. when the user gets the friend request and then if he accepts it, then the other person/friend will also gets the notification, that this person accepts the friend request(in real time).

     - the other account will refresh, to reflect the friend adding changed
     - so this event will trigger on the api/friends/accept/ route

  2. when we add them as a friend, then their browser will get refreshed, so in the sideBarChatList comp we can make a state (of friends) and keep track of all the chats
  3. when we add a friend the sidebar notification/friend req icon will ve to be disappeared(w/o us needing to refresh the page) when we accept the friend request. in the FriendRequestSidebarOptions Component by subscribing to the new_friend event.

- so in the sidebar comp, couple of things will happen simultaneously, when we accept the friend request, 1. the friend request count will decreased(as we track the state) and 2. in the overview section our friend name will be appeared as the chat partner, and for our partner our name will be appeared as the chat partner, and all these changes occured in the real time.

### Real time chat

- same as the friend request we will be subscribed to the event in the message component. which already has the initial msg message(persisted in the db), and whenever some real time changes occur we will add that state to diplay it in the real time.
- and then trigger the event in the server side, in the api/messages/send
- and for the incomming message, we gon show the toast notification and a little icon next to the friends.
- so to implement this listen to the incoming message and we can do that on a component that always mounted when we get a msg. which is the sideBarChatList component.
- in the route we don't want to listen to all chats. we don't want like 100s of websockets instances for the chats, so instead we can trigger the chat event that contains the msg infos, and by that we'll know which chat this is concerning, so that we can listen to only one event.
- and our cust type ExtendedMessage (extend from the Message) will ve all the info about the sender and we can use that to display(sender name and icon) it in the toast notification and in the chat notification
- and we don't wana get this notification when we re alreay in that chat, we only wana get notified when we re in the other pages or other chats.

# Mobile Response

- for the mobile response we can use the tailwind ui.com -> slide-overs, grab the code and use it in the MobileChatLayoutComponent

### Deployment

- after the deployment add the domain url into the google console - /api/auth/callback/google

- the app is deployed in versel and the deployed url is https://friendszone.vercel.app

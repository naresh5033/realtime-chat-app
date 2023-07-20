import { getToken } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  async function middleware(req) {
    const pathname = req.nextUrl.pathname // get the current path the user is on 

    // Manage route protection
    const isAuth = await getToken({ req })
    const isLoginPage = pathname.startsWith('/login')

    const sensitiveRoutes = ['/dashboard'] // in our case  this is the only sensitive route
    const isAccessingSensitiveRoute = sensitiveRoutes.some((route) => // any route that the path name starts with (route)
      pathname.startsWith(route)
    )

    if (isLoginPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url)) // redirects to the dashboard, with the base url(localhost or what ever the base url is)
      }

      return NextResponse.next() //else(not logged in) pass the req to the login page
    }

    if (!isAuth && isAccessingSensitiveRoute) {
      return NextResponse.redirect(new URL('/login', req.url)) // req.url - base url
    }

    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: { // the second argument 
      async authorized() {
        return true
      }, // this is a workaround for handling redirects on auth pages,and its true so the mw fn is always called, if we don't ve the callback then we'll get the infinite callbakc
    },
  }
)

//this config determines via the matchers prop of string[] in which route this mw will actually runs
export const config = { 
  matchter: ['/', '/login', '/dashboard/:path*'],
}

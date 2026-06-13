import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in') || 
                     request.nextUrl.pathname.startsWith('/sign-up')
  
  // Разрешаем доступ к страницам восстановления пароля без авторизации
  const isPublicPage = request.nextUrl.pathname === '/update-password' ||
                       request.nextUrl.pathname === '/auth/callback'

  const isProtectedPage = !isAuthPage && !isPublicPage && request.nextUrl.pathname !== '/'

  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthPage) {
    const redirectUrl = new URL('/notes', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
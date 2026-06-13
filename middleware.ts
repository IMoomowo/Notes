import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  let user = null

  // Обертываем в try-catch, чтобы временные проблемы с сетью или битые куки сессии не ломали весь сайт (500 ошибка)
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (err) {
    console.error('Ошибка верификации пользователя в middleware:', err)
  }

  const { pathname } = request.nextUrl

  // Пути авторизации
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')
  
  // Публичные страницы и служебные страницы смены пароля
  const isPublicPage = pathname === '/update-password' || 
                       pathname === '/reset-password' || 
                       pathname === '/auth/callback'

  // Страница-диспетчер на главном корне
  const isRootPage = pathname === '/'

  // Защищенной считается страница, которая не является ни страницей авторизации, ни публичной, ни корнем
  const isProtectedPage = !isAuthPage && !isPublicPage && !isRootPage

  // 1. Если пользователь не авторизован и пытается зайти на приватную страницу — отправляем на вход
  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Если пользователь УЖЕ авторизован и пытается зайти на страницы входа/регистрации — отправляем в заметки
  if (user && isAuthPage) {
    const redirectUrl = new URL('/notes', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Исключаем служебные пути Next.js и статические файлы:
     * - _next/static (статические файлы)
     * - _next/image (оптимизация изображений)
     * - favicon.ico (иконка вкладки)
     * - все файлы с расширениями картинок и векторов
     * - а также исключаем внутренние эндпоинты API (/api/...), чтобы не замедлять запросы к базе данных
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
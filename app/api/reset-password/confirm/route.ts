import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Токен и пароль обязательны' }, { status: 400 })
    }

    // Валидация пароля на стороне сервера (защита от прямых запросов к API)
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 6 символов' }, { status: 400 })
    }

    // Проверяем подлинность и время жизни JWT токена
    let decoded: { userId: string; email: string }
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string }
    } catch (err) {
      console.error('Ошибка проверки JWT токена:', err)
      return NextResponse.json({ error: 'Недействительный или просроченный токен' }, { status: 400 })
    }

    const cookieStore = await cookies()

    // Инициализируем клиент Supabase с правами ADMIN (Service Role),
    // так как только этот ключ позволяет вызывать методы в ветке auth.admin
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    // Обновляем пароль пользователя по его ID с правами администратора
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      decoded.userId,
      { password: newPassword }
    )

    if (updateError) throw updateError

    return NextResponse.json({ message: 'Пароль успешно обновлён!' })
  } catch (error) {
    console.error('Критическая ошибка подтверждения сброса пароля:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
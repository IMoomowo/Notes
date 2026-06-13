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

    // Проверяем токен
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string }
    } catch {
      return NextResponse.json({ error: 'Недействительный или просроченный токен' }, { status: 400 })
    }

    // Обновляем пароль через Supabase Admin
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { error } = await supabase.auth.admin.updateUserById(
      decoded.userId,
      { password: newPassword }
    )

    if (error) throw error

    return NextResponse.json({ message: 'Пароль успешно обновлён!' })
  } catch (error) {
    console.error('Ошибка:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
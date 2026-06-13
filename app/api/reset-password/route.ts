import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${baseUrl}/reset-password`,
      }
    )

    if (error) {
      console.error(error)
    }

    // Защита от user enumeration
    return NextResponse.json({
      message:
        'Если адрес зарегистрирован, письмо со ссылкой для сброса будет отправлено.',
    })
  } catch (error) {
    console.error('Ошибка сброса пароля:', error)

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Введите email' },
        { status: 400 }
      )
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Некорректный формат email' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/update-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('Supabase error:', error)

      if (error.status === 429) {
    return NextResponse.json({
      message: 'Слишком много попыток. Подождите немного.'
    }, { status: 429 })
  }

      return NextResponse.json({
        message: 'Если адрес зарегистрирован, вы получите письмо для сброса пароля'
      })
    }
       //такой же ответ, чтобы злоумышленник не перебирал
    return NextResponse.json({
      message: 'Если адрес зарегистрирован, вы получите письмо для сброса пароля'
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
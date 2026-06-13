import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    // Подключаемся к Supabase
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

    // Ищем пользователя
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    const existingUser = users?.find(u => u.email === email)
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Генерируем токен
    const token = jwt.sign(
      { userId: existingUser.id, email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    // Настройка почты
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.FRONTEND_URL}/reset-password?token=${token}`

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Восстановление пароля | Мои заметки',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #46376D;">Восстановление пароля</h2>
          <p>Вы запросили сброс пароля для аккаунта <strong>${email}</strong>.</p>
          <p>Перейдите по ссылке ниже, чтобы установить новый пароль:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #46376D; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">
            Сбросить пароль
          </a>
          <p style="color: #666; font-size: 12px;">Ссылка действительна в течение 1 часа.</p>
        </div>
      `
    })

    return NextResponse.json({ message: 'Письмо отправлено!' })
  } catch (error) {
    console.error('Ошибка:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
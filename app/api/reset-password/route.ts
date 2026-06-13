import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const cookieStore = await cookies()

    // Инициализируем Supabase клиент с правами ADMIN (Service Role),
    // так как только он имеет доступ к администрированию пользователей и методу listUsers()
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

    // Загружаем список пользователей с правами суперадмина
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Ошибка получения списка пользователей из Supabase:', listError)
      throw listError
    }
    
    const existingUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail)
    
    // В целях безопасности от перебора email (user enumeration)
    // мы всегда возвращаем статус 200, чтобы злоумышленник не мог сканировать базу зарегистрированных почт.
    // Если пользователя нет, мы просто пропускаем шаг генерации и отправки письма.
    if (!existingUser) {
      return NextResponse.json({ message: 'Если адрес зарегистрирован, письмо со ссылкой для сброса будет отправлено.' })
    }

    // Генерируем временный JWT токен для сброса на 1 час
    const token = jwt.sign(
      { userId: existingUser.id, email: normalizedEmail },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    // Настройка SMTP транспорта (рекомендуется использовать App Passwords для Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: 'Восстановление пароля | Мои заметки',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #46376D; margin-top: 0;">Восстановление пароля</h2>
          <p>Вы запросили сброс пароля для аккаунта <strong>${normalizedEmail}</strong>.</p>
          <p>Перейдите по ссылке ниже, чтобы установить новый пароль:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #46376D; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Сбросить пароль
            </a>
          </div>
          <p style="color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px; margin-top: 24px;">
            Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс, просто проигнорируйте это письмо.
          </p>
        </div>
      `
    })

    return NextResponse.json({ message: 'Если адрес зарегистрирован, письмо со ссылкой для сброса будет отправлено.' })
  } catch (error) {
    console.error('Ошибка в API сброса пароля:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
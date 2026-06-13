const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

// Проверка наличия обязательных переменных окружения перед инициализацией
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Внимание: Не заданы переменные окружения Supabase для бэкенда!')
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Настройка почтового транспорта (оптимизировано под Mail.ru / SSL)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mail.ru',
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true, // Истинное значение (true) для порта 465
  auth: {
    user: process.env.EMAIL_USER, // Твоя почта@mail.ru
    pass: process.env.EMAIL_PASS  // Пароль приложения (не обычный пароль от почты!)
  }
})

// Запрос на сброс пароля (отправка письма)
router.post('/reset-request', async (req, res) => {
  const { email } = req.body

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email обязателен' })
  }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    // Получаем список пользователей через Admin API (требует Service Role Key)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Ошибка Supabase Auth при получении списка:', listError)
      throw listError
    }
    
    const existingUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail)
    
    // В целях безопасности от перебора почт (User Enumeration) всегда возвращаем 200 ОК.
    // Если пользователя нет — мы просто тихо завершаем работу, не отправляя письмо.
    if (!existingUser) {
      return res.json({ message: 'Инструкции по восстановлению пароля отправлены на указанную почту!' })
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-it'

    // Генерируем токен (действует 1 час)
    const token = jwt.sign(
      { userId: existingUser.id, email: normalizedEmail },
      jwtSecret,
      { expiresIn: '1h' }
    )

    // Сохраняем токен в таблицу password_resets для двойной валидации на бэкенде
    const { error: saveError } = await supabase
      .from('password_resets')
      .insert({
        email: normalizedEmail,
        user_id: existingUser.id,
        token,
        expires_at: new Date(Date.now() + 3600000).toISOString() // Текущее время + 1 час
      })

    if (saveError) {
      console.error('Ошибка записи токена в БД (проверьте наличие таблицы password_resets):', saveError)
    }

    // Ссылка для сброса на фронтенде
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Отправляем письмо
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: 'Восстановление пароля | Мои заметки',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #46376D; margin-top: 0;">Восстановление пароля</h2>
          <p>Вы запросили сброс пароля для аккаунта <strong>${normalizedEmail}</strong>.</p>
          <p>Перейдите по ссылке ниже, чтобы установить новый пароль:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #46376D; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center;">
              Сбросить пароль
            </a>
          </div>
          <p style="color: #666; font-size: 12px; border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: 24px;">
            Ссылка действительна в течение 1 часа. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
          </p>
        </div>
      `
    })

    res.json({ message: 'Инструкции по восстановлению пароля отправлены на указанную почту!' })
  } catch (error) {
    console.error('Ошибка при запросе сброса пароля:', error)
    res.status(500).json({ error: 'Внутренняя ошибка сервера' })
  }
})

// Подтверждение сброса и установка нового пароля
router.post('/reset-confirm', async (req, res) => {
  const { token, newPassword } = req.body

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Токен и новый пароль обязательны' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' })
  }

  try {
    // 1. Проверяем токен в БД password_resets
    const { data: resetRecord, error: findError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .single()

    if (findError || !resetRecord) {
      return res.status(400).json({ error: 'Недействительный или уже использованный токен' })
    }

    // 2. Проверяем срок действия токена в БД
    if (new Date(resetRecord.expires_at) < new Date()) {
      // Автоматически удаляем просроченный токен из БД
      await supabase.from('password_resets').delete().eq('token', token)
      return res.status(400).json({ error: 'Срок действия ссылки истёк' })
    }

    // 3. Дополнительно проверяем подпись JWT токена
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-it'
    try {
      jwt.verify(token, jwtSecret)
    } catch (jwtErr) {
      console.error('Ошибка верификации JWT:', jwtErr)
      return res.status(400).json({ error: 'Токен поврежден или просрочен' })
    }

    // 4. Обновляем пароль через Supabase Auth Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: newPassword }
    )

    if (updateError) throw updateError

    // 5. Удаляем использованный токен, чтобы исключить повторное использование ссылки
    await supabase.from('password_resets').delete().eq('token', token)

    res.json({ message: 'Пароль успешно обновлён!' })
  } catch (error) {
    console.error('Ошибка подтверждения сброса пароля:', error)
    res.status(500).json({ error: 'Внутренняя ошибка сервера' })
  }
})

module.exports = router
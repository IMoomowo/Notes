const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Настройка почтового транспорта (для Mail.ru)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      // smtp.mail.ru
  port: Number(process.env.EMAIL_PORT), // 465
  secure: true,                       // для порта 465
  auth: {
    user: process.env.EMAIL_USER,     // твоя почта@mail.ru
    pass: process.env.EMAIL_PASS      // пароль приложения
  }
})

// Запрос на сброс пароля (отправка письма)
router.post('/reset-request', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email обязателен' })
  }

  try {
    // Проверяем, существует ли пользователь
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    // В Supabase Auth пользователи не в таблице users, а в auth.users
    // Поэтому используем admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    const existingUser = users?.find(u => u.email === email)
    
    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' })
    }

    // Генерируем токен (действует 1 час)
    const token = jwt.sign(
      { userId: existingUser.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    // Сохраняем токен в БД (таблицу создадим позже)
    const { error: saveError } = await supabase
      .from('password_resets')
      .insert({
        email,
        user_id: existingUser.id,
        token,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      })

    if (saveError) console.error('Ошибка сохранения токена:', saveError)

    // Ссылка для сброса
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    // Отправляем письмо
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
          <p style="color: #999; font-size: 12px;">Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        </div>
      `
    })

    res.json({ message: 'Письмо для сброса пароля отправлено!' })
  } catch (error) {
    console.error('Ошибка сброса пароля:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
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
    // Проверяем токен в БД
    const { data: resetRecord, error: findError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .single()

    if (findError || !resetRecord) {
      return res.status(400).json({ error: 'Недействительный токен' })
    }

    // Проверяем срок действия
    if (new Date(resetRecord.expires_at) < new Date()) {
      // Удаляем просроченный токен
      await supabase.from('password_resets').delete().eq('token', token)
      return res.status(400).json({ error: 'Срок действия ссылки истёк' })
    }

    // Обновляем пароль через Supabase Auth (хеширование делает сам Supabase)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: newPassword }
    )

    if (updateError) throw updateError

    // Удаляем использованный токен
    await supabase.from('password_resets').delete().eq('token', token)

    res.json({ message: 'Пароль успешно обновлён!' })
  } catch (error) {
    console.error('Ошибка подтверждения сброса:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

module.exports = router
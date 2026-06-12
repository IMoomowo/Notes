'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/notes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLinkReset(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail.trim()) {
      setResetMessage('Введите email')
      return
    }

    setResetLoading(true)
    setResetMessage(null)

    try {
      // Отправляем magic link, который сразу перенаправит на update-password
      const { error } = await supabase.auth.signInWithOtp({
  email: resetEmail,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://твой-проект.vercel.app'}/auth/callback`,
  }
})

      if (error) throw error

      setResetMessage('✨ Волшебная ссылка отправлена! Перейдите по ней, чтобы установить новый пароль.')
      setTimeout(() => {
        setResetMode(false)
        setResetEmail('')
        setResetMessage(null)
      }, 4000)
    } catch (err) {
      setResetMessage(err instanceof Error ? err.message : 'Ошибка отправки ссылки')
    } finally {
      setResetLoading(false)
    }
  }

  if (resetMode) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Восстановление пароля</h1>
          
          {resetMessage && (
            <div className={`auth-card__message ${resetMessage.includes('отправлена') ? 'auth-card__message--success' : 'auth-card__message--error'}`}>
              {resetMessage}
            </div>
          )}
          
          <form onSubmit={handleMagicLinkReset} className="auth-form">
            <div className="auth-fields-container">
              <div className="auth-field">
                <label className="auth-field__label">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="auth-field__input"
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="auth-card__footer">
              <div className="auth-card__register">
                <button 
                  type="button" 
                  onClick={() => {
                    setResetMode(false)
                    setResetMessage(null)
                    setResetEmail('')
                  }} 
                  className="auth-card__link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Назад ко входу
                </button>
              </div>
              <button type="submit" disabled={resetLoading} className="auth-card__btn">
                {resetLoading ? 'Отправка...' : 'Отправить волшебную ссылку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Войти в личные заметки</h1>
        
        {error && (
          <div className="auth-card__error">
            ❌ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-fields-container">
            <div className="auth-field">
              <label className="auth-field__label">Почта</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-field__input"
                required
                placeholder="example@mail.com"
              />
            </div>
            
            <div className="auth-field auth-field--last">
              <label className="auth-field__label">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-field__input"
                required
                placeholder="••••••••"
              />
            </div>
            
            <div className="auth-card__links">
              <button 
                type="button" 
                onClick={() => setResetMode(true)}
                className="auth-card__link-btn"
              >
                Забыли пароль?
              </button>
            </div>
          </div>
          
          <div className="auth-card__footer">
            <div className="auth-card__register">
              <span>Нет аккаунта?</span>
              <Link href="/sign-up" className="auth-card__link">Зарегистрироваться</Link>
            </div>
            <button type="submit" disabled={loading} className="auth-card__btn">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      setSuccess(true)
      
      // Плавно и красиво перенаправляем на страницу входа через 3 секунды
      timeoutRef.current = setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Создать аккаунт</h1>
        
        {error && (
          <div className="auth-card__error" role="alert">
            ❌ {error}
          </div>
        )}

        {success ? (
          <div className="auth-card__success" role="alert">
            ✅ Регистрация успешна! Сейчас вы будете перенаправлены на страницу входа...
          </div>
        ) : (
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
            </div>
            
            <div className="auth-card__footer">
              <div className="auth-card__register">
                <span>Уже есть аккаунт?</span>
                <Link href="/sign-in" className="auth-card__link">Войти</Link>
              </div>
              <button type="submit" disabled={loading} className="auth-card__btn">
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
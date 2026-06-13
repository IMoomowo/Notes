'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Ошибка</h1>
          <p>Недействительная или устаревшая ссылка для восстановления.</p>
          <button onClick={() => router.push('/sign-in')} className="auth-card__btn">
            Вернуться ко входу
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сброса пароля')
      }

      setSuccess(true)
      
      // Безопасный переход с сохранением ссылки на таймер
      timeoutRef.current = setTimeout(() => {
        router.push('/sign-in')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сброса пароля')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Новый пароль</h1>
        
        {error && <div className="auth-card__error">❌ {error}</div>}
        
        {success ? (
          <div className="auth-card__success">
            ✅ Пароль успешно изменён! Перенаправление...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-fields-container">
              <div className="auth-field">
                <label className="auth-field__label">Новый пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-field__input"
                  required
                  placeholder="••••••••"
                />
              </div>
              
              <div className="auth-field auth-field--last">
                <label className="auth-field__label">Подтвердите пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-field__input"
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="auth-card__footer">
              <button type="submit" disabled={loading} className="auth-card__btn">
                {loading ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card">Загрузка...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
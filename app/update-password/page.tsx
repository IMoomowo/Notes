// app/update-password/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    // Проверяем, есть ли активная сессия восстановления
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsValidSession(true)
      } else {
        // Проверяем hash параметры (если Supabase перенаправил сюда)
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (!error) {
              setIsValidSession(true)
              return
            }
          }
        }
        
        // Если нет сессии, перенаправляем
        setTimeout(() => router.push('/sign-in'), 3000)
        setError('Ссылка для восстановления недействительна или истекла. Перенаправление...')
      }
    }
    
    checkSession()
  }, [router])

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Не выходим из системы сразу, даем пользователю понять что все ок
      setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления пароля')
      setLoading(false)
    }
  }

  if (!isValidSession && !error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Проверка</h1>
          <div className="auth-card__loading">Проверка ссылки восстановления...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Новый пароль</h1>
        
        {error && <div className="auth-card__error">❌ {error}</div>}
        
        {success ? (
          <div className="auth-card__success">
            ✅ Пароль успешно изменён! Перенаправление на страницу входа...
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
                  minLength={6}
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
                  minLength={6}
                />
              </div>
            </div>
            
            <div className="auth-card__footer">
              <button 
                type="submit" 
                disabled={loading} 
                className="auth-card__btn"
              >
                {loading ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card">Загрузка...</div>
      </div>
    }>
      <UpdatePasswordForm />
    </Suspense>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [status, setStatus] = useState({
    loading: false,
    error: null as string | null,
    success: false
  })

  // Проверка сессии
  useEffect(() => {
    const handleRecoverySession = async () => {
      const hash = window.location.hash
      
      // Если есть токен в hash - устанавливаем сессию
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', ''))
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
          
          console.error('Ошибка установки сессии:', error)
          setIsValidSession(false)
          setTimeout(() => router.push('/sign-in'), 3000)
          return
        }
      }
      
      // Проверяем существующую сессию
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsValidSession(true)
        return
      }
      
      setIsValidSession(false)
      setTimeout(() => router.push('/sign-in'), 4000)
    }
    
    handleRecoverySession()
  }, [router])

  // Обновление пароля
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setStatus(prev => ({ ...prev, error: 'Пароли не совпадают' }))
      return
    }
    
    if (password.length < 6) {
      setStatus(prev => ({ ...prev, error: 'Пароль должен быть не менее 6 символов' }))
      return
    }

    setStatus({ loading: true, error: null, success: false })

    try {
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) throw error
      
      setStatus({ loading: false, error: null, success: true })
      
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/sign-in')
      }, 2000)
      
    } catch (err) {
      console.error('Ошибка обновления:', err)
      setStatus({
        loading: false,
        error: err instanceof Error ? err.message : 'Ошибка обновления пароля',
        success: false
      })
    }
  }

  // Состояние загрузки
  if (isValidSession === null) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Проверка</h1>
          <div className="auth-card__loading">Проверка ссылки восстановления...</div>
        </div>
      </div>
    )
  }

  // Невалидная сессия
  if (isValidSession === false) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Ошибка</h1>
          <div className="auth-card__error">
            Ссылка для восстановления недействительна или истекла.
          </div>
          <button onClick={() => router.push('/sign-in')} className="auth-card__btn">
            Вернуться ко входу
          </button>
        </div>
      </div>
    )
  }

  // Форма смены пароля
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Новый пароль</h1>
        
        {status.error && <div className="auth-card__error">❌ {status.error}</div>}
        
        {status.success ? (
          <div className="auth-card__success">
            Пароль успешно изменён! Перенаправление на страницу входа...
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
                  autoComplete="new-password"
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
              <button 
                type="submit" 
                disabled={status.loading} 
                className="auth-card__btn"
              >
                {status.loading ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
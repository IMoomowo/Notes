'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [processing, setProcessing] = useState(true)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleRecovery = async () => {
      // 1. Проверяем query параметры (токен из ссылки recovery)
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      if (token && type === 'recovery') {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        })
        
        if (!verifyError) {
          setProcessing(false)
          return
        } else {
          console.error('Ошибка проверки Recovery токена:', verifyError)
        }
      }
      
      // 2. Проверяем hash параметры (access_token)
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (!sessionError) {
            setProcessing(false)
            return
          } else {
            console.error('Ошибка установки сессии из hash:', sessionError)
          }
        }
      }
      
      // 3. Проверяем существующую сессию
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setProcessing(false)
          return
        }
      } catch (err) {
        console.error('Ошибка проверки пользователя:', err)
      }
      
      // 4. Если ничего не подошло
      setError('Недействительная или просроченная ссылка для восстановления доступа.')
      timeoutRef.current = setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    }
    
    handleRecovery()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [router, searchParams])

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

      await supabase.auth.signOut()
      
      setSuccess(true)
      
      timeoutRef.current = setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления пароля')
      setLoading(false)
    }
  }

  if (processing) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Проверка</h1>
          <div className="auth-card__loading">Пожалуйста, подождите...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Новый пароль</h1>
        
        {error && <div className="auth-card__error" role="alert">❌ {error}</div>}
        
        {success ? (
          <div className="auth-card__success" role="alert">
            ✅ Пароль успешно обновлён! Войдите в аккаунт с новым паролем.
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

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Загрузка</h1>
          <div className="auth-card__loading">Загрузка формы...</div>
        </div>
      </div>
    }>
      <UpdatePasswordForm />
    </Suspense>
  )
}
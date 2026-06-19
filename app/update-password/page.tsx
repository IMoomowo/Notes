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
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const handleRecoverySession = async () => {
      console.log('🔍 Проверка сессии восстановления...')
      
      // Получаем hash из URL (то, что после #)
      const hash = window.location.hash
      console.log('📍 Hash из URL:', hash)
      
      // Если есть hash с access_token, обрабатываем его
      if (hash && hash.includes('access_token')) {
        console.log('🔄 Найден access_token в hash, устанавливаем сессию...')
        
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // Устанавливаем сессию из hash параметров
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            console.error('❌ Ошибка установки сессии:', sessionError)
            setError('Ссылка для восстановления недействительна или истекла.')
            setTimeout(() => router.push('/sign-in'), 3000)
            setIsValidSession(false)
            return
          }
          
          console.log('✅ Сессия установлена, пользователь:', data.user?.email)
          setIsValidSession(true)
          return
        }
      }
      
      // Если нет hash, проверяем существующую сессию
      console.log('🔍 Проверяем существующую сессию...')
      const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
      
      if (sessionCheckError) {
        console.error('❌ Ошибка проверки сессии:', sessionCheckError)
      }
      
      if (session) {
        console.log('✅ Найдена активная сессия, пользователь:', session.user.email)
        setIsValidSession(true)
        return
      }
      
      // Если ничего не подошло
      console.log('❌ Нет действительной сессии')
      setError('Ссылка для восстановления недействительна или истекла. Запросите сброс пароля заново.')
      setTimeout(() => router.push('/sign-in'), 4000)
      setIsValidSession(false)
    }
    
    handleRecoverySession()
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
      console.log('🔄 Обновление пароля...')
      
      // Обновляем пароль
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('❌ Ошибка обновления:', updateError)
        throw updateError
      }

      console.log('✅ Пароль успешно обновлен!')
      setSuccess(true)
      
      // Выходим из системы через 2 секунды
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/sign-in')
      }, 2000)
      
    } catch (err) {
      console.error('❌ Ошибка:', err)
      setError(err instanceof Error ? err.message : 'Ошибка обновления пароля')
      setLoading(false)
    }
  }

  // Показываем загрузку, пока проверяем сессию
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

  // Если сессия недействительна
  if (isValidSession === false) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Ошибка</h1>
          {error && <div className="auth-card__error">❌ {error}</div>}
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
                  minLength={6}
                  autoComplete="new-password"
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
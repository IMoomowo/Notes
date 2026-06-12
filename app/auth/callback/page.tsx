'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      console.log('1. AuthCallback mounted')
      
      // Получаем hash из URL (например, #access_token=...)
      const hash = window.location.hash
      console.log('2. Hash from URL:', hash)
      
      if (hash && hash.includes('access_token')) {
        // Извлекаем токены из hash
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        
        console.log('3. Access token exists:', !!accessToken)
        console.log('4. Refresh token exists:', !!refreshToken)
        
        if (accessToken && refreshToken) {
          try {
            // Устанавливаем сессию вручную
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            console.log('5. SetSession result:', { data, error })
            
            if (!error && data.session) {
              console.log('6. Session set successfully')
              // Успешно вошли → перенаправляем на страницу смены пароля
              router.push('/update-password')
              return
            } else {
              console.error('SetSession error:', error)
            }
          } catch (err) {
            console.error('Exception in setSession:', err)
          }
        }
      }
      
      // Если нет hash или нет токенов — пробуем через getUser
      console.log('7. Trying getUser fallback')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('8. User from getUser:', user?.email)
      
      if (user) {
        router.push('/update-password')
        return
      }
      
      // Если всё равно не получилось — на страницу входа с ошибкой
      console.log('9. Redirecting to sign-in with error')
      setError('Не удалось войти. Попробуйте запросить ссылку ещё раз.')
      setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    }
    
    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Ошибка</h1>
          <div className="auth-card__error">❌ {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Вход...</h1>
        <div className="auth-card__loading">Пожалуйста, подождите</div>
      </div>
    </div>
  )
}
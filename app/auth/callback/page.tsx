'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleCallback = async () => {
      // Извлекаем hash параметры из URL на клиенте
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        
        if (accessToken && refreshToken) {
          try {
            // Устанавливаем сессию Supabase вручную из полученных токенов
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (!sessionError && data.session) {
              // Успешная авторизация → отправляем на страницу обновления пароля
              router.push('/update-password')
              return
            }
          } catch (err) {
            console.error('Исключение при установке сессии:', err)
          }
        }
      }
      
      // Запасной вариант: если токенов в hash нет, проверяем текущую сессию пользователя
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/update-password')
          return
        }
      } catch (err) {
        console.error('Ошибка проверки пользователя:', err)
      }
      
      // Если войти так и не удалось — показываем ошибку и возвращаем на страницу входа
      setError('Не удалось войти. Пожалуйста, запросите ссылку восстановления пароля ещё раз.')
      
      timeoutId = setTimeout(() => {
        router.push('/sign-in')
      }, 3000)
    }
    
    handleCallback()

    // Функция очистки (вызывается при размонтировании компонента)
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
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
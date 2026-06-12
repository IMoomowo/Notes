'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      await supabase.auth.signOut()
      
      alert('Пароль успешно обновлён! Войдите с новым паролем.')
      router.push('/sign-in')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления пароля')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Новый пароль</h1>
        
        {error && <div className="auth-card__error">❌ {error}</div>}
        
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
      </div>
    </div>
  )
}
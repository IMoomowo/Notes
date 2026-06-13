'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword, deleteAccount } from '@/lib/auth'
import SidebarLayout from '../sidebar-layout'

function SettingsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setMessage({ type: 'error', text: 'Введите email' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await resetPassword(resetEmail)
      setMessage({ type: 'success', text: 'Письмо для сброса пароля отправлено на почту' })
      setShowResetConfirm(false)
      setResetEmail('')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка сброса пароля' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await deleteAccount()
      router.push('/sign-in')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка удаления аккаунта' })
      setShowDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings__title">Настройки</h1>

        {message && (
          <div className={`settings__message settings__message--${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Безопасность */}
        <div className="settings-section">
          <h2 className="settings-section__title">Безопасность</h2>
          
          <div className="settings-card">
            <div className="settings-card__info">
              <h3>Сброс пароля</h3>
              <p>Если вы забыли пароль, отправьте письмо для восстановления</p>
            </div>
            {showResetConfirm ? (
              <div className="settings-card__form">
                <input
                  type="email"
                  placeholder="Ваш email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="settings-input"
                />
                <div className="settings-card__actions">
                  <button onClick={() => setShowResetConfirm(false)} className="btn-secondary">
                    Отмена
                  </button>
                  <button onClick={handleResetPassword} disabled={loading} className="btn-primary">
                    Отправить
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowResetConfirm(true)} className="btn-outline">
                Сбросить пароль
              </button>
            )}
          </div>

          <div className="settings-card settings-card--danger">
            <div className="settings-card__info">
              <h3>Удаление аккаунта</h3>
              <p>Все ваши заметки, теги и файлы будут безвозвратно удалены</p>
            </div>
            {showDeleteConfirm ? (
              <div className="settings-card__form">
                <p className="warning-text">Вы уверены? Это действие необратимо.</p>
                <div className="settings-card__actions">
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                    Отмена
                  </button>
                  <button onClick={handleDeleteAccount} disabled={loading} className="btn-danger">
                    {loading ? 'Удаление...' : 'Да, удалить аккаунт'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger-outline">
                Удалить аккаунт
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <SidebarLayout>
      <SettingsContent />
    </SidebarLayout>
  )
}
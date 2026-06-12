import { supabase } from './supabaseClient'

// Сброс пароля (отправка письма)
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  })
  
  if (error) throw error
  return true
}

// Обновление пароля (после сброса)
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) throw error
  return true
}

// Удаление аккаунта (удаляет пользователя и все его данные)
export async function deleteAccount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Пользователь не авторизован')

  // 1. Удаляем все файлы пользователя из Storage
  const { data: files } = await supabase.storage
    .from('notes-media')
    .list(`${user.id}/`)
  
  if (files && files.length > 0) {
    const filePaths = files.map(file => `${user.id}/${file.name}`)
    await supabase.storage.from('notes-media').remove(filePaths)
  }

  // 2. Удаляем заметки (теги удалятся автоматически через CASCADE)
  const { error: notesError } = await supabase
    .from('notes')
    .delete()
    .eq('user_id', user.id)
  
  if (notesError) throw notesError

  // 3. Удаляем теги (если остались сироты)
  const { error: tagsError } = await supabase
    .from('tags')
    .delete()
    .eq('user_id', user.id)
  
  if (tagsError) throw tagsError

  // 4. Удаляем самого пользователя (через admin API)
  const response = await fetch('/api/delete-user', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Не удалось удалить аккаунт')
  }

  // 5. Выходим из системы
  await supabase.auth.signOut()
  
  return true
}
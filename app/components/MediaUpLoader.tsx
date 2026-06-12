'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface MediaUploaderProps {
  noteId: string
  onMediaUploaded: (type: 'image' | 'audio', url: string) => void
}

export default function MediaUploader({ noteId, onMediaUploaded }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File, type: 'image' | 'audio') => {
    if (!file) return

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      // Сохраняем оригинальное имя файла
      const originalName = file.name
      const fileExt = originalName.split('.').pop()
      const fileName = `${user.id}/${noteId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('notes-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('notes-media')
        .getPublicUrl(fileName)

      onMediaUploaded(type, publicUrl)
    } catch (err) {
      console.error('Ошибка загрузки:', err)
      alert(err instanceof Error ? err.message : 'Не удалось загрузить файл')
    } finally {
      setUploading(false)
    }
  }

  const handleAttachClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,audio/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const type = file.type.startsWith('image/') ? 'image' : 'audio'
      uploadFile(file, type)
    }
    input.click()
  }

  return (
    <button 
      className="note-detail-action-btn" 
      title="Прикрепить файл"
      onClick={handleAttachClick}
      disabled={uploading}
    >
      {uploading ? '⌛ Загрузка...' : 'Прикрепить'}
    </button>
  )
}
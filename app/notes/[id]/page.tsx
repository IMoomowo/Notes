'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getTagsForNote, updateNoteTags, getAllTags } from '@/lib/tags'
import { Tag } from '@/types/tag'
import MediaUploader from '../../components/MediaUpLoader'
import SidebarLayout from '../../sidebar-layout'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string | null
  tags?: Tag[]
  images?: string[]
  audio?: string | null
}

interface HistoryState {
  title: string
  content: string
  selectedTags: Tag[]
  images: string[]
  audio: string | null
}

function NoteDetailContent() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [images, setImages] = useState<string[]>([])
  const [audio, setAudio] = useState<string | null>(null)
  
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)

  // История изменений (undo)
  const [history, setHistory] = useState<HistoryState[]>([])
const [historyIndex, setHistoryIndex] = useState(-1)

  // Сохраняем состояние в историю
  const saveToHistory = useCallback((newState: HistoryState) => {
  setHistory(prev => {
    const newHistory = prev.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistoryIndex(newHistory.length - 1)
    return newHistory
  })
}, [historyIndex])

  // Отмена последнего действия 
  const undo = useCallback(() => {
  if (historyIndex > 0) {
    const prevState = history[historyIndex - 1]
    setTitle(prevState.title)
    setContent(prevState.content)
    setSelectedTags(prevState.selectedTags)
    setImages(prevState.images)
    setAudio(prevState.audio)
    setHistoryIndex(historyIndex - 1)
  }
}, [history, historyIndex])

  

  // Обёртки для изменений
  const updateTitle = (newTitle: string) => {
  saveToHistory({ title, content, selectedTags: [...selectedTags], images: [...images], audio })
  setTitle(newTitle)
}

  const updateContent = (newContent: string) => {
  saveToHistory({ title, content, selectedTags: [...selectedTags], images: [...images], audio })
  setContent(newContent)
}

  const addTag = (tag: Tag) => {
  if (!selectedTags.some(t => t.id === tag.id)) {
    saveToHistory({ title, content, selectedTags: [...selectedTags], images: [...images], audio })
    setSelectedTags([...selectedTags, tag])
  }
}

  const removeTagById = (tagId: string) => {
  saveToHistory({ title, content, selectedTags: [...selectedTags], images: [...images], audio })
  setSelectedTags(selectedTags.filter(t => t.id !== tagId))
}

  const addImage = (url: string) => {
  saveToHistory({ title, content, selectedTags: [...selectedTags], images: [...images], audio })
  setImages([...images, url])
}

  const removeImageByIndex = (index: number) => {
  saveToHistory({ title, content, selectedTags: [...selectedTags], images: [...images], audio })
  setImages(images.filter((_, i) => i !== index))
}

const updateAudio = (newAudio: string | null) => {
  saveToHistory({ title, content, selectedTags: [...selectedTags], images: [...images], audio })
  setAudio(newAudio)
}


  // Загрузка заметки
  useEffect(() => {
    async function loadNote() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .single()

        if (error) throw error

        const tags = await getTagsForNote(noteId)
        setNote({ ...data, tags })
        setTitle(data.title)
        setContent(data.content || '')
        setSelectedTags(tags)
        setImages(data.images || [])
        setAudio(data.audio || null)
        const initialState = {
          title: data.title,
          content: data.content || '',
          selectedTags: tags,
          images: data.images || [],
          audio: data.audio || null
        }
        setHistory([initialState])
        setHistoryIndex(0)
      } catch (err) {
        console.error('Ошибка загрузки заметки:', err)
        setError('Заметка не найдена')
      } finally {
        setLoading(false)
      }
    }

    if (noteId) loadNote()
  }, [noteId])

  // Загрузка всех тегов
  useEffect(() => {
    async function loadAllTags() {
      try {
        const tags = await getAllTags()
        setAllTags(tags)
      } catch (err) {
        console.error('Ошибка загрузки тегов:', err)
      }
    }
    loadAllTags()
  }, [])

  // Удаление файла из Storage по URL
  const deleteFromStorage = async (url: string) => {
    try {
      // Извлекаем путь файла из URL
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const bucketIndex = pathParts.indexOf('notes-media')
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/')
        const { error } = await supabase.storage
          .from('notes-media')
          .remove([filePath])
        
        if (error) {
          console.error('Ошибка удаления из Storage:', error)
        } else {
          console.log('Файл удалён из Storage:', filePath)
        }
      }
    } catch (err) {
      console.error('Ошибка при удалении файла:', err)
    }
  }
  

  
  // Удалить изображение
  const removeImage = async (index: number) => {
  const imageUrl = images[index]
  await deleteFromStorage(imageUrl)
  removeImageByIndex(index)  // ← используем обёртку
}

  // Удалить аудио
  const removeAudio = async () => {
    if (audio) {
      await deleteFromStorage(audio)
      setAudio(null)
    }
  }

  // Сохранение заметки
  async function handleSave() {
    if (!title.trim()) {
      setError('Заголовок не может быть пустым')
      return
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          title: title.trim(), 
          content: content.trim() || null,
          images: images,
          audio: audio
        })
        .eq('id', noteId)

      if (error) throw error

      await updateNoteTags(noteId, selectedTags.map(t => t.id))

      const updatedTags = await getTagsForNote(noteId)
      setNote(prev => prev ? { ...prev, title, content, tags: updatedTags, images, audio } : null)
      
      setIsEditingTitle(false)
      setIsEditingContent(false)
      
      router.refresh()
    } catch (err) {
      console.error('Ошибка сохранения:', err)
      setError(err instanceof Error ? err.message : 'Не удалось сохранить заметку')
    }
  }

  // Добавить медиафайл
  const handleMediaUpload = async (type: 'image' | 'audio', url: string) => {
  if (type === 'image') {
    addImage(url)
  } else if (type === 'audio') {
    updateAudio(url)
  }
}

  // Теги
  function addExistingTag(tagId: string) {
  const tagToAdd = allTags.find(t => t.id === tagId)
  if (tagToAdd && !selectedTags.some(t => t.id === tagId)) {
    addTag(tagToAdd) 
    setShowTagDropdown(false)
  }
}

  async function handleCreateTag() {
    if (!newTagName.trim()) return

    setIsAddingTag(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const existingTag = allTags.find(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())
      if (existingTag) {
        addExistingTag(existingTag.id)
        setNewTagName('')
        setShowTagDropdown(false)
        return
      }

      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: newTagName.trim(), user_id: user.id }])
        .select()
        .single()

      if (error) throw error

      setAllTags([...allTags, data])
      addTag(data)
      setNewTagName('')
      setShowTagDropdown(false)
    } catch (err) {
      console.error('Ошибка создания тега:', err)
      setError(err instanceof Error ? err.message : 'Не удалось создать тег')
    } finally {
      setIsAddingTag(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Точно удалить заметку?')
    if (!confirmed) return

    try {
      
      for (const imageUrl of images) {
        await deleteFromStorage(imageUrl)
      }
      
      if (audio) {
        await deleteFromStorage(audio)
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      router.push('/notes')
    } catch (err) {
      console.error('Ошибка удаления:', err)
      setError(err instanceof Error ? err.message : 'Не удалось удалить заметку')
    }
  }
   
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo])


  if (loading) {
    return <div className="loading">Загрузка заметки...</div>
  }

  if (error || !note) {
    return (
      <div className="note-detail-page">
        <div className="note-detail-container">
          <div className="error-message">❌ {error || 'Заметка не найдена'}</div>
          <button onClick={() => router.push('/notes')} className="btn-primary">Вернуться к списку</button>
        </div>
      </div>
    )
  }

  return (
    <div className="note-detail-page">
      <div className="note-detail-container">
        {/* Название */}
        <div className="note-detail-row">
          <span className="note-detail-label">Название</span>
          <div className="note-detail-value-wrapper">
            {isEditingTitle ? (
              <input
  type="text"
  value={title}
  onChange={(e) => updateTitle(e.target.value)}
  onBlur={() => setIsEditingTitle(false)}
  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
  className="note-detail-input"
  autoFocus
/>
            ) : (
              <div className="note-detail-value" onClick={() => setIsEditingTitle(true)}>
                {title || '—'}
              </div>
            )}
          </div>
        </div>

        {/* Теги + Удалить */}
        <div className="note-detail-row note-detail-row--tags">
          <span className="note-detail-label">Теги</span>
          <div className="note-detail-tags-wrapper">
            <div className="note-detail-tags">
              {selectedTags.map((tag) => (
                <span key={tag.id} className="note-detail-tag">
                  {tag.name}
                  <button onClick={() => removeTagById(tag.id)} className="note-detail-tag-remove">✕</button>
                </span>
              ))}
              
              <div className="note-detail-tag-add-wrapper">
                <button className="note-detail-tag-add" onClick={() => setShowTagDropdown(!showTagDropdown)}>
                 Добавить тег <svg width="8" height="8" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.5 1.25H7.5V7.5H1.25V12.5H7.5V18.75H12.5V12.5H18.75V7.5H12.5V1.25Z" fill="#46376D"/>
</svg>

                </button>
                
                {showTagDropdown && (
                  <div className="note-detail-tag-dropdown">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addExistingTag(e.target.value)
                          e.target.value = ''
                        }
                      }}
                      value=""
                      className="note-detail-tag-select"
                    >
                      <option value="">-- Выбрать тег --</option>
                      {allTags
                        .filter(tag => !selectedTags.some(st => st.id === tag.id))
                        .map(tag => (
                          <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
                    </select>
                    <div className="note-detail-new-tag">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Новый тег"
                        className="note-detail-new-tag-input"
                      />
                      <button onClick={handleCreateTag} disabled={isAddingTag || !newTagName.trim()}>
                        {isAddingTag ? '...' : '+'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button onClick={handleDelete} className="note-detail-delete-btn">
              Удалить
            </button>
          </div>
        </div>

        {/* Содержание */}
        <div className="note-detail-content">
          <span className="note-detail-label">Содержание</span>
          {isEditingContent ? (
            <textarea
  value={content}
  onChange={(e) => updateContent(e.target.value)}
  onBlur={() => setIsEditingContent(false)}
  className="note-detail-textarea"
  rows={12}
  autoFocus
/>
          ) : (
            <div className="note-detail-text" onClick={() => setIsEditingContent(true)}>
              {content || '—'}
            </div>
          )}
        </div>

        {/* Изображения */}
        {images.length > 0 && (
          <div className="note-detail-media">
            <span className="note-detail-label">Изображения</span>
            <div className="note-detail-images">
              {images.map((url, index) => {
                const fileName = url.split('/').pop() || `image-${index + 1}`
                
                const handleDownload = async () => {
                  try {
                    const response = await fetch(url)
                    const blob = await response.blob()
                    const blobUrl = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = blobUrl
                    link.download = fileName
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(blobUrl)
                  } catch (err) {
                    console.error('Ошибка скачивания:', err)
                  }
                }
                
                return (
                  <div key={index} className="note-detail-image-wrapper">
                    <img src={url} alt="Изображение"
                    className="note-detail-image" />
                    <div className="note-detail-image-actions">
                      <button onClick={handleDownload} className="note-detail-image-download" title="Скачать">
                        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M15 24.3165L7.58702 17.31L9.648 15.129L13.5 18.771V7.5H16.5V18.771L20.352 15.129L22.413 17.31L15 24.3165ZM3.00001 27H27V3H3.00001V27ZM0 30H30V0H0V30Z" fill="#46376D"/>
</svg>

                      </button>
                      <button onClick={() => removeImage(index)} className="note-detail-image-remove" title="Удалить">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.75 10L10 8.75L6.25 5L10 1.25L8.75 0L5 3.75L1.25 0L0 1.25L3.75 5L0 8.75L1.25 10L5 6.25L8.75 10Z" fill="#F0F0F0"/>
</svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Аудио */}
        {audio && (
          <div className="note-detail-media">
            <span className="note-detail-label">Аудио</span>
            <div className="note-detail-audio-wrapper">
              <audio src={audio} controls className="note-detail-audio" />
              <button onClick={removeAudio} className="note-detail-audio-remove" title="Удалить">
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Правые кнопки */}
      <div className="note-detail-actions">
        <MediaUploader noteId={noteId} onMediaUploaded={handleMediaUpload} />
        <button className="note-detail-action-btn" title="Назад (Ctrl+Z)" onClick={undo}>
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M25 0H0V1.1197H23.9796V19.6239H6.66478L9.82216 16.1592L9.1007 15.3675L4.71166 20.1838L9.1007 25L9.82216 24.2084L6.66478 20.7436H25V0Z" fill="#46376D"/>
</svg>
        </button>
        <button className="note-detail-action-btn note-detail-action-btn--save" onClick={handleSave}>
          Сохранить
        </button>
      </div>
    </div>
  )
}

export default function NoteDetailPage() {
  return (
    <SidebarLayout>
      <NoteDetailContent />
    </SidebarLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { updateNoteTags, getAllTags } from '@/lib/tags'
import { Tag } from '@/types/tag'
import Sidebar from './components/Sidebar'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteTags, setNewNoteTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загружаем теги при монтировании компонента
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

  // глобальное событие для открытия модалки
  useEffect(() => {
    const handleOpenModal = () => {
      setNewNoteTitle('')
      setNewNoteTags([])
      setNewTagName('')
      setError(null)
      setShowCreateModal(true)
    }
    window.addEventListener('openCreateModal', handleOpenModal)
    return () => window.removeEventListener('openCreateModal', handleOpenModal)
  }, [])

  const handleOpenModal = () => {
    setNewNoteTitle('')
    setNewNoteTags([])
    setNewTagName('')
    setError(null)
    setShowCreateModal(true)
  }

  const handleCreateFromModal = async () => {
    if (!newNoteTitle.trim()) {
      setError('Название заметки не может быть пустым')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const { data, error } = await supabase
        .from('notes')
        .insert([{ 
          title: newNoteTitle.trim(), 
          content: null,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      if (newNoteTags.length > 0) {
        await updateNoteTags(data.id, newNoteTags.map(t => t.id))
      }

      setShowCreateModal(false)
      setNewNoteTitle('')
      setNewNoteTags([])
      
      router.push(`/notes/${data.id}`)
      router.refresh()
    } catch (err) {
      console.error('Ошибка создания:', err)
      setError(err instanceof Error ? err.message : 'Не удалось создать заметку')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="app-with-sidebar">
      <Sidebar onOpenCreateModal={handleOpenModal} />
      <main className="main-content">
        {children}
      </main>

      {/* Модалка создания заметки */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="create-modal__title">Создаем заметку</h2>
            
            {error && <div className="error-message" style={{ marginBottom: '16px' }}>❌ {error}</div>}
            
            <div className="create-modal__field">
              <label className="create-modal__label">Название</label>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="create-modal__input"
                placeholder="Введите название"
                autoFocus
              />
            </div>
            
            <div className="create-modal__field">
              <label className="create-modal__label">Тэг</label>
              <div className="create-modal__tag-controls">
                <select
                  onChange={(e) => {
                    const tagId = e.target.value
                    if (!tagId) return
                    const tagToAdd = allTags.find(t => t.id === tagId)
                    if (tagToAdd && !newNoteTags.some(t => t.id === tagId)) {
                      setNewNoteTags([...newNoteTags, tagToAdd])
                    }
                    e.target.value = ''
                  }}
                  value=""
                  className="create-modal__select"
                >
                  <option value="">Выбрать тег</option>
                  {allTags
                    .filter(tag => !newNoteTags.some(st => st.id === tag.id))
                    .map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                </select>
                
                <div className="create-modal__new-tag">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Новый тег"
                    className="create-modal__new-tag-input"
                  />
                  <button
                    onClick={async () => {
                      if (!newTagName.trim()) return
                      setIsAddingTag(true)
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) throw new Error('Не авторизован')
                        
                        const { data, error } = await supabase
                          .from('tags')
                          .insert([{ name: newTagName.trim(), user_id: user.id }])
                          .select()
                          .single()
                        
                        if (error) throw error
                        
                        setAllTags([...allTags, data])
                        setNewNoteTags([...newNoteTags, data])
                        setNewTagName('')
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Не удалось создать тег')
                      } finally {
                        setIsAddingTag(false)
                      }
                    }}
                    className="create-modal__add-tag"
                    disabled={isAddingTag || !newTagName.trim()}
                  >
                    {isAddingTag ? '...' : '+'}
                  </button>
                </div>
              </div>
            </div>
            
            {newNoteTags.length > 0 && (
              <div className="create-modal__selected-tags">
                {newNoteTags.map((tag) => (
                  <span key={tag.id} className="create-modal__tag">
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => setNewNoteTags(newNoteTags.filter(t => t.id !== tag.id))}
                      className="create-modal__tag-remove"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.75 10L10 8.75L6.25 5L10 1.25L8.75 0L5 3.75L1.25 0L0 1.25L3.75 5L0 8.75L1.25 10L5 6.25L8.75 10Z" fill="#F0F0F0"/>
</svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            <div className="create-modal__actions">
              <button onClick={() => setShowCreateModal(false)} className="create-modal__cancel">
                Отмена
              </button>
              <button onClick={handleCreateFromModal} disabled={isCreating} className="create-modal__submit">
                {isCreating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
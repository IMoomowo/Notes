'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Tag } from '@/types/tag'

interface TagManagerProps {
  onTagsChange: () => void
}

export default function TagManager({ onTagsChange }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  async function loadTags() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setTags(data || [])
    } catch (err) {
      console.error('Ошибка загрузки тегов:', err)
    }
  }

  async function openPopup() {
    await loadTags()
    setIsOpen(true)
  }

  function handleMouseEnter() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    openPopup()
  }

  function handleMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setEditingTagId(null)
    }, 200)
  }

  // РЕДАКТИРОВАНИЕ тега
  async function handleUpdateTag(tagId: string, newName: string) {
    if (!newName.trim()) {
      setError('Название тега не может быть пустым')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('tags')
        .update({ name: newName.trim() })
        .eq('id', tagId)

      if (error) throw error

      setTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, name: newName.trim() } : tag
      ))
      
      setEditingTagId(null)
      setEditingName('')
      onTagsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления тега')
    } finally {
      setLoading(false)
    }
  }

  // УДАЛЕНИЕ тега (глобально)
  async function handleDeleteTag(tagId: string, tagName: string) {
    const confirmed = window.confirm(`Точно удалить тег "${tagName}"? Он исчезнет из всех заметок.`)
    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      // Удаляем тег (связи в note_tags удалятся автоматически благодаря ON DELETE CASCADE)
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      // Обновляем список тегов
      setTags(prev => prev.filter(tag => tag.id !== tagId))
      
      // Если удаляемый тег был в режиме редактирования — выходим из него
      if (editingTagId === tagId) {
        setEditingTagId(null)
        setEditingName('')
      }
      
      onTagsChange()
    } catch (err) {
      console.error('Ошибка удаления тега:', err)
      setError(err instanceof Error ? err.message : 'Не удалось удалить тег')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(tag: Tag) {
    setEditingTagId(tag.id)
    setEditingName(tag.name)
    setError(null)
  }

  function cancelEdit() {
    setEditingTagId(null)
    setEditingName('')
    setError(null)
  }

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={openPopup}
        className="sidebar__icon"
        title="Управление тегами"
        style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M30 12V6H24V0H18V6H12V0H6V6H0V12H6V18H0V24H6V30H12V24H18V30H24V24H30V18H24V12H30ZM18 18H12V12H18V18Z" fill="#46376D"/>
</svg>

      </button>

      {isOpen && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            top: 0,
            left: '100%',
            marginLeft: '8px',
            minWidth: '300px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '12px',
            zIndex: 1000
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
            Мои теги ({tags.length})
          </div>

          {error && (
            <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>
              ❌ {error}
            </div>
          )}

          {tags.length === 0 ? (
            <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
              У вас пока нет тегов
            </div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '14px'
                  }}
                >
                  {editingTagId === tag.id ? (
                    // Режим редактирования
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        onClick={() => handleUpdateTag(tag.id, editingName)}
                        disabled={loading}
                        style={{
                          padding: '4px 8px',
                          background: '#46376D',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Сохранить"
                      >
                        <svg width="20" height="20" viewBox="0 0 613 613" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M606.25 6.25H6.25V606.25H606.25V6.25Z" stroke="#d9d9d9" stroke-width="12.5"/>
<path d="M506.25 6.25V256.25H106.25V6.25" stroke="#d9d9d9" stroke-width="12.5"/>
<path d="M206.25 606.25V456.25H406.25V606.25" stroke="#d9d9d9" stroke-width="12.5"/>
<path d="M306.25 456.25V606.25" stroke="#d9d9d9" stroke-width="12.5"/>
</svg>

                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '4px 8px',
                          background: '#ccc',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Отменить"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    // Обычный режим
                    <>
                      <span style={{ flex: 1 }}>
                        <span style={{ 
                          background: '#e0e0e0', 
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          #{tag.name}
                        </span>
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => startEdit(tag)}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#666'
                          }}
                          title="Редактировать"
                        >
                          <svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.77778 0H8.33333V0.555556H8.88889V1.11111H9.44444V1.66667H10V2.22222H9.44444V2.77778H8.88889V3.33333H8.33333V2.77778H7.77778V2.22222H7.22222V1.66667H6.66667V1.11111H7.22222V0.555556H7.77778M5.55556 2.22222H6.66667V2.77778H7.22222V3.33333H7.77778V4.44444H7.22222V5H6.66667V5.55556H6.11111V6.11111H5.55556V6.66667H5V7.22222H4.44444V7.77778H3.88889V8.33333H3.33333V8.88889H2.77778V9.44444H2.22222V10H0V7.77778H0.555556V7.22222H1.11111V6.66667H1.66667V6.11111H2.22222V5.55556H2.77778V5H3.33333V4.44444H3.88889V3.88889H4.44444V3.33333H5V2.77778H5.55556" fill="#46376D"/>
</svg>

                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          disabled={loading}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#ef4444'
                          }}
                          title="Удалить тег"
                        >
                          <svg width="20" height="20" viewBox="0 0 21 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.4439 2.78906V0H6.5561V2.78906H0V5.57812H21V2.78906M1.33171 8.42188V28H19.6683V8.42188H1.33171ZM6.5561 25.2109H3.9439V11.2109H6.5561V25.2109ZM11.8317 25.2109H9.16829V11.2109H11.8317V25.2109ZM17.0561 25.2109H14.4439V11.2109H17.0561V25.2109Z" fill="#852221"/>
</svg>


                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
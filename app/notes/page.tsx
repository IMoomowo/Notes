'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getTagsForNote, getAllTags } from '@/lib/tags'
import { Tag } from '@/types/tag'
import NoteCard from '../components/NoteCard'
import SearchBar from '../components/SearchBar'
import SortButton from '../components/SortButton'
import SidebarLayout from '../sidebar-layout'
import { deleteFromStorage } from '@/lib/storage'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string | null
  tags?: Tag[]
  images?: string[]
  audio?: string | null
}

type SortOption = 'all' | 'recent' | 'name' | 'tags'
type SearchMode = 'all' | 'title' | 'tags'

// Функция для вызова модалки из Layout
const openCreateModal = () => {
  window.dispatchEvent(new Event('openCreateModal'))
}

function NotesContent() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('all')
  const [searchMode, setSearchMode] = useState<SearchMode>('all')
  const [allTags, setAllTags] = useState<Tag[]>([])

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

  // Загрузка заметок
  useEffect(() => {
    async function loadNotes() {
      setLoading(true)
      setError(null)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Пользователь не авторизован')
        
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (notesError) throw notesError
        
        const notesWithTags = await Promise.all(
          (notesData || []).map(async (note) => {
            const tags = await getTagsForNote(note.id)
            return { ...note, tags }
          })
        )
        
        setNotes(notesWithTags)
      } catch (err) {
        console.error('Ошибка загрузки:', err)
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заметки')
      } finally {
        setLoading(false)
      }
    }
    
    loadNotes()
  }, [])

  // Фильтрация и сортировка
  const getFilteredAndSearchedNotes = () => {
    let filtered = [...notes]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      
      switch (searchMode) {
        case 'title':
          filtered = filtered.filter(note => note.title.toLowerCase().includes(query))
          break
        case 'tags':
          filtered = filtered.filter(note => note.tags?.some(tag => tag.name.toLowerCase().includes(query)))
          break
        default:
          filtered = filtered.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(query)
            const contentMatch = note.content?.toLowerCase().includes(query) || false
            return titleMatch || contentMatch
          })
          break
      }
    }

    switch (sortOption) {
      case 'all':
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })
        break
      case 'recent':
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        filtered = filtered.filter(note => {
          const createdAt = note.created_at ? new Date(note.created_at) : null
          return createdAt && createdAt >= sevenDaysAgo
        })
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
          const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })
        break
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'tags':
        filtered.sort((a, b) => (a.tags?.length || 0) - (b.tags?.length || 0))
        break
    }
    return filtered
  }

  const filteredNotes = getFilteredAndSearchedNotes()

  const handleSearch = (query: string) => setSearchQuery(query)
  const handleSortChange = (option: SortOption) => {
    setSortOption(option)
    switch (option) {
      case 'name': setSearchMode('title'); break
      case 'tags': setSearchMode('tags'); break
      default: setSearchMode('all'); break
    }
  }

  async function deleteNote(id: string) {
  const confirmed = window.confirm('Точно удалить заметку?')
  if (!confirmed) return

  try {
    // 1. Получаем заметку, чтобы знать какие файлы удалять
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('images, audio')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // 2. Удаляем изображения из Storage
    if (note.images && note.images.length > 0) {
      for (const imageUrl of note.images) {
        await deleteFromStorage(imageUrl)
      }
    }

    // 3. Удаляем аудио из Storage
    if (note.audio) {
      await deleteFromStorage(note.audio)
    }

    // 4. Удаляем заметку из БД
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) throw error

    setNotes(prev => prev.filter(note => note.id !== id))
  } catch (err) {
    console.error('Ошибка удаления:', err)
    setError(err instanceof Error ? err.message : 'Не удалось удалить заметку')
  }
}

  if (loading && notes.length === 0) {
    return <div className="loading">Загрузка заметок...</div>
  }

  return (
    <div className="notes-page">
      {error && <div className="error-message">❌ {error}</div>}
      
      <div className="notes-hero">
        <h1 className="notes-hero__title">Есть идеи?</h1>
        <div className="notes-hero__actions">
          <SortButton onSort={handleSortChange} currentSort={sortOption} />
          <SearchBar onSearch={handleSearch} />
          <button 
            onClick={openCreateModal}
            className="notes-hero__btn notes-hero__btn--create"
          >
            Создать
          </button>
        </div>
      </div>
      
      <div className="notes-list">
        <div className="notes-header">
          <h2>Список заметок ({filteredNotes.length})</h2>
        </div>
        {filteredNotes.length === 0 && !loading ? (
          <div className="empty-state">📭 Нет заметок. Создайте первую!</div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                id={note.id}
                title={note.title}
                content={note.content}
                tags={note.tags || []}
                createdAt={note.created_at}
                onDelete={() => deleteNote(note.id)}
                hasMedia={(note.images && note.images.length > 0) || !!note.audio}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ГЛАВНЫЙ ЭКСПОРТ — обёрнутый в SidebarLayout
export default function NotesPage() {
  return (
    <SidebarLayout>
      <NotesContent />
    </SidebarLayout>
  )
}
import { supabase } from './supabaseClient'
import { Tag } from '@/types/tag'

// Получить все теги
export async function getAllTags(): Promise<Tag[]> {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return [] // Если не авторизован — возвращаем пустой массив
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)  // ← фильтр по пользователю
    .order('name', { ascending: true })
  
  if (error) throw error
  return data || []
}

// Получить теги для конкретной заметки
export async function getTagsForNote(noteId: string): Promise<Tag[]> {
  // Сначала получаем ID тегов, связанных с заметкой
  const { data: noteTags, error: noteTagsError } = await supabase
    .from('note_tags')
    .select('tag_id')
    .eq('note_id', noteId)
  
  if (noteTagsError) throw noteTagsError
  
  if (!noteTags || noteTags.length === 0) {
    return []
  }
  
  // Получаем ID тегов в виде массива строк
  const tagIds = noteTags.map(item => item.tag_id)
  
  // Теперь получаем сами теги по этим ID
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds)
  
  if (tagsError) throw tagsError
  
  return tags || []
}

// Привязать теги к заметке
export async function addTagsToNote(noteId: string, tagIds: string[]) {
  if (tagIds.length === 0) return
  
  const noteTags = tagIds.map(tagId => ({ note_id: noteId, tag_id: tagId }))
  
  const { error } = await supabase
    .from('note_tags')
    .insert(noteTags)
  
  if (error) throw error
}

// Получить ID тегов для заметки
export async function getTagIdsForNote(noteId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('note_tags')
    .select('tag_id')
    .eq('note_id', noteId)
  
  if (error) throw error
  return data?.map(item => item.tag_id) || []
}

// Обновить теги заметки (заменить старые на новые)
export async function updateNoteTags(noteId: string, newTagIds: string[]) {
  // Сначала удаляем старые связи
  const { error: deleteError } = await supabase
    .from('note_tags')
    .delete()
    .eq('note_id', noteId)
  
  if (deleteError) throw deleteError
  
  // Потом добавляем новые
  if (newTagIds.length > 0) {
    await addTagsToNote(noteId, newTagIds)
  }
}
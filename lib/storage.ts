import { supabase } from './supabaseClient'

export const deleteFromStorage = async (url: string) => {
  try {
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
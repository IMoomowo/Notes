import { Tag } from "./tag"

export interface Note {
  id: string
  title: string
  content: string | null
  created_at: string | null
  updated_at: string | null
  tags?:Tag[]
  images?: string[]      // массив URL изображений
  audio?: string | null  // URL аудиофайла
}
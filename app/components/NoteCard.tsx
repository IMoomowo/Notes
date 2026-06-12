'use client'

import Link from 'next/link'
import { Tag } from '@/types/tag'

interface NoteCardProps {
  id: string
  title: string
  content: string | null
  tags: Tag[]
  createdAt: string | null
  onDelete: () => void
  hasMedia?: boolean  // добавляем пропс
}

export default function NoteCard({ id, title, content, tags, onDelete, hasMedia }: NoteCardProps) {
  return (
    <div className="note-card">
      <div className="note-card__header">
        <h3>{title}</h3>
        <Link href={`/notes/${id}`} className="note-card__edit-btn" title="Редактировать">
          <svg width="20" height="20" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.77778 0H8.33333V0.555556H8.88889V1.11111H9.44444V1.66667H10V2.22222H9.44444V2.77778H8.88889V3.33333H8.33333V2.77778H7.77778V2.22222H7.22222V1.66667H6.66667V1.11111H7.22222V0.555556H7.77778M5.55556 2.22222H6.66667V2.77778H7.22222V3.33333H7.77778V4.44444H7.22222V5H6.66667V5.55556H6.11111V6.11111H5.55556V6.66667H5V7.22222H4.44444V7.77778H3.88889V8.33333H3.33333V8.88889H2.77778V9.44444H2.22222V10H0V7.77778H0.555556V7.22222H1.11111V6.66667H1.66667V6.11111H2.22222V5.55556H2.77778V5H3.33333V4.44444H3.88889V3.88889H4.44444V3.33333H5V2.77778H5.55556" fill="#46376D"/>
</svg>
        </Link>
      </div>
      
      {content && (
        <div className="note-card__content">
          <p>{content}</p>
        </div>
      )}
      
      <div className="note-card__footer">
        <div className="note-card__tags-list">
          {tags.slice(0, 3).map(tag => (
            <span key={tag.id} className="note-card-tag">
              {tag.name}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="note-card-tag note-card-tag--more">
              +{tags.length - 3}
            </span>
          )}
        </div>
        <div className="note-card__right">
          {hasMedia && (
            <span className="note-card__media-icon" title="Есть медиафайлы">
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M17.7778 0L25 6.49998L10.5556 19.5L6.11111 15.4999L17.2221 5.49998L18.8889 6.99997L9.44444 15.4999L10.5556 16.4999L21.6667 6.49998L17.7778 2.99999L3.33333 16L9.99999 21.9999L22.7778 10.5L24.4444 12L9.99999 25L0 16L17.7778 0Z" fill="#46376D"/>
</svg>
            </span>
          )}
          <button onClick={onDelete} className="note-card__delete-btn" title="Удалить">
            <svg width="21" height="28" viewBox="0 0 21 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.4439 2.78906V0H6.5561V2.78906H0V5.57812H21V2.78906M1.33171 8.42188V28H19.6683V8.42188H1.33171ZM6.5561 25.2109H3.9439V11.2109H6.5561V25.2109ZM11.8317 25.2109H9.16829V11.2109H11.8317V25.2109ZM17.0561 25.2109H14.4439V11.2109H17.0561V25.2109Z" fill="#852221"/>
</svg>

          </button>
        </div>
      </div>
    </div>
  )
}
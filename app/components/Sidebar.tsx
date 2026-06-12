'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'
import TagManager from './TagManager'


interface SidebarProps {
  onOpenCreateModal?: () => void
}

export default function Sidebar({ onOpenCreateModal }: SidebarProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    router.push('/sign-in')
    router.refresh()  // принудительно обновляем данные
  } catch (err) {
    console.error('Ошибка выхода:', err)
  }
}

  return (
    <>
      {/* Кнопка-гамбургер для мобильных */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Меню"
      >
        ☰
      </button>

      {/* Сайдбар */}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar--open' : ''}`}>
        {/* Логотип */}
        <div className="sidebar__logo">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="30" fill="#852221"/>
          </svg>
        </div>

        <nav className="sidebar__nav">
          <Link href="/notes" className="sidebar__icon" title="Главная" onClick={() => setMobileMenuOpen(false)}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M30 18.0646L15 5.23197L0 18.0646V12.8357L15 0L30 12.8327V18.0646ZM26.25 17.5987V30H18.75V21.7335H11.25V30H3.75V17.6002L15 8.3011L26.25 17.5987Z" fill="#46376D"/>
</svg>

          </Link>

          <button className="sidebar__icon" title="Новая заметка" onClick={onOpenCreateModal}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.89474 0H4.73684V4.28571H0V7.14286H4.73684V11.4286H7.89474V7.14286H12.6316V4.28571H7.89474V0ZM26.8421 1.42857H15.7895V4.28571H26.8421V18.5714H17.3684V27.1429H4.73684V14.2857H1.57895V30H20.5263V27.1429H23.6842V24.2857H26.8421V21.4286H30V1.42857H26.8421ZM23.6842 24.2857H20.5263V21.4286H23.6842V24.2857Z" fill="#46376D"/>
</svg>

          </button>

          <div className="sidebar__tag-manager-wrapper">
            <TagManager onTagsChange={() => router.refresh()} />
          </div>
        </nav>
         <Link href="/settings" className="sidebar__icon" title="Настройки">
  ⚙️
</Link>
        <button className="sidebar__icon sidebar__icon--logout" title="Выйти" onClick={handleLogout}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0V30H18V23.6842H16.5V28.4211H1.5V1.57895H16.5V6.31579H18V0H0ZM22.5 9.47368L27 14.2105H7.5V15.7895H27L22.5 20.5263H24.75L30 15L24.75 9.47368H22.5Z" fill="#46376D"/>
</svg>

        </button>
      </aside>

      {/* Затемнение для мобильного меню */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </>
  )
}
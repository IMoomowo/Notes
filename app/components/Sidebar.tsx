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
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M25.9453 17.993L30 17.9871V12.0012L25.9512 11.9895L25.5 12.0012C24.6562 11.9953 24.4219 11.2983 24.4219 10.449C24.4219 10.0273 24.5918 9.64662 24.8672 9.37134L27.7266 6.51308L23.4844 2.27255L20.6191 5.13667C20.3438 5.41195 19.9629 5.58181 19.541 5.58181C18.6914 5.58181 18.0059 4.89653 18 4.05311V0H12V4.03553H11.9941C11.9883 4.88481 11.3027 5.57009 10.4531 5.57009C10.0371 5.57009 9.66211 5.40024 9.38672 5.13667L6.50977 2.26084L2.27344 6.50137L5.13281 9.35963C5.13281 9.35963 5.13281 9.36548 5.12695 9.36548C5.40234 9.64662 5.57227 10.0273 5.57227 10.449C5.57227 11.2925 5.33789 11.9836 4.49414 12.0012H0V17.9988L4.04297 17.9871V17.9988C4.88672 18.0047 5.57227 18.69 5.57227 19.5392C5.57227 19.9551 5.40234 20.33 5.13867 20.6052L2.26758 23.4752L6.50977 27.7157L9.36914 24.8575C9.36914 24.8575 9.375 24.8575 9.375 24.8633C9.65039 24.5939 10.0312 24.4182 10.4531 24.4182C11.2969 24.4182 11.9883 24.6583 12 25.5018C12 25.5018 11.9941 25.941 12 25.941V30L18 29.9883V25.941H18.0059C18.0176 25.0976 18.6973 24.4182 19.541 24.4182C19.9629 24.4182 20.3379 24.5881 20.6191 24.8575H20.625L23.4844 27.7157L27.7266 23.4752L24.8672 20.617C24.5977 20.3417 24.4277 19.961 24.4277 19.5392C24.4219 18.6841 25.1016 17.9988 25.9453 17.993ZM15 20.9742C11.6895 20.9742 9.00586 18.2917 9.00586 14.9824C9.00586 11.6732 11.6895 8.98477 15 8.98477C18.3105 8.98477 20.9941 11.6673 20.9941 14.9824C21 18.2917 18.3105 20.9742 15 20.9742Z" fill="#46376D"/>
</svg>
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
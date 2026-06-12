'use client'

import { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Очищаем от спецсимволов, оставляем буквы, цифры, пробелы
    const cleaned = value.replace(/[^\w\sа-яА-ЯёЁ]/g, '')
    setQuery(cleaned)
    onSearch(cleaned)
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Поиск идей..."
        className="search-bar__input"
      />
      <button type="submit" className="search-bar__button" aria-label="Поиск">
        <svg 
          width="24" 
          height="29" 
          viewBox="0 0 24 29" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="search-bar__icon"
        >
          <path 
            opacity="0.6" 
            d="M22.5 4.57895V3.05263H21V1.52632H19.5V0H4.5V1.52632H3V3.05263H1.5V4.57895H0V19.8421H1.5V21.3684H3V22.8947H4.5V24.4211H16.5V27.4737H18V29H22.5V25.9474H21V24.4211H19.5V22.8947H21V21.3684H22.5V19.8421H24V4.57895H22.5ZM21 16.7895H19.5V18.3158H18V19.8421H16.5V21.3684H7.5V19.8421H6V18.3158H4.5V16.7895H3V7.63158H4.5V6.10526H6V4.57895H7.5V3.05263H16.5V4.57895H18V6.10526H19.5V7.63158H21V16.7895Z" 
            fill="#46376D"
          />
        </svg>
      </button>
    </form>
  )
}
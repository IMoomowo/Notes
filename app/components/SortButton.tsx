'use client'

import { useState, useRef, useEffect } from 'react'

type SortOption = 'all' | 'recent' | 'name' | 'tags'

interface SortButtonProps {
  onSort: (option: SortOption) => void
  currentSort: SortOption
}

export default function SortButton({ onSort, currentSort }: SortButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDisplayText = () => {
    switch (currentSort) {
      case 'all': return 'Все'
      case 'recent': return 'Недавнее'
      case 'name': return 'Название'
      case 'tags': return 'Теги'
      default: return 'Sort by'
    }
  }

  const handleSelect = (option: SortOption) => {
    onSort(option)
    setIsOpen(false)
  }

  return (
    <div className="sort-button" ref={dropdownRef}>
      <button 
        className="sort-button__main"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sort-button__label">{getDisplayText()}</span>
        <div className="sort-button__divider"></div>
        <span className={`sort-button__arrow ${isOpen ? 'sort-button__arrow--down' : 'sort-button__arrow--up'}`}>
          <svg width="20" height="8" viewBox="0 0 20 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.5561 8.14914C20.148 7.68704 20.148 6.93777 19.5561 6.47569L12.1415 0.69237C10.9575 -0.231087 9.03908 -0.23073 7.85571 0.693081L0.443993 6.47995C-0.147999 6.94203 -0.147999 7.6913 0.443993 8.15341C1.03583 8.61553 1.99551 8.61553 2.58735 8.15341L8.93102 3.20052C9.52286 2.73832 10.4825 2.73843 11.0744 3.20052L17.4127 8.14914C18.0046 8.61126 18.9642 8.61126 19.5561 8.14914Z" fill="#F0F0F0"/>
</svg>

        </span>
      </button>

      {isOpen && (
        <div className="sort-button__dropdown">
          <button 
            className={`sort-button__option ${currentSort === 'all' ? 'sort-button__option--active' : ''}`}
            onClick={() => handleSelect('all')}
          >
            Все
          </button>
          <button 
            className={`sort-button__option ${currentSort === 'recent' ? 'sort-button__option--active' : ''}`}
            onClick={() => handleSelect('recent')}
          >
            Недавнее
          </button>
          <button 
            className={`sort-button__option ${currentSort === 'name' ? 'sort-button__option--active' : ''}`}
            onClick={() => handleSelect('name')}
          >
            Название
          </button>
          <button 
            className={`sort-button__option ${currentSort === 'tags' ? 'sort-button__option--active' : ''}`}
            onClick={() => handleSelect('tags')}
          >
            Теги
          </button>
        </div>
      )}
    </div>
  )
}
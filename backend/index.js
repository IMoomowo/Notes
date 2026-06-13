const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

// Загружаем переменные окружения из файла .env
dotenv.config()

const app = express()

// Тонкая настройка CORS для безопасности твоего бэкенда
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000', // Next.js по умолчанию
  'http://localhost:5173'  // Vite по умолчанию
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, от мобильных приложений или curl)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    } else {
      return callback(new Error('Блокировка CORS: Доступ с этого источника запрещен.'))
    }
  },
  credentials: true
}))

app.use(express.json())

// Маршрут для проверки работы сервера (Health Check)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  })
})

// Импортируем и подключаем роуты восстановления пароля
const passwordRoutes = require('./routes/password')
app.use('/api/password', passwordRoutes)

// Обработчик несуществующих маршрутов (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' })
})

// Глобальный перехватчик ошибок для предотвращения падения сервера
process.on('uncaughtException', (err) => {
  console.error('Критическая непредвиденная ошибка (Uncaught Exception):', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный промис (Unhandled Rejection) на:', promise, 'причина:', reason)
})

// Запуск сервера
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Backend сервер успешно запущен на http://localhost:${PORT}`)
})
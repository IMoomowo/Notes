const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

// Загружаем переменные окружения
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Подключаемся к Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Маршрут для проверки работы сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Импортируем роуты
const passwordRoutes = require('./routes/password')
app.use('/api/password', passwordRoutes)

// Запуск сервера
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Backend сервер запущен на http://localhost:${PORT}`)
})
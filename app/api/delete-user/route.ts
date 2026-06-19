import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE() {
  try {
    const cookieStore = await cookies()

    // клиент с обычными анонимными правами для проверки сессии текущего пользователя
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
            }
          },
        },
      }
    )

    // Используем getUser() - валидация токена на сервере супабейз
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Идентификатор пользователя берется из проверенной сессии от супабейз
    const verifiedUserId = user.id

    // Создаем админ-клиент с сервисным ключом для удаления
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    // Безопасно удаляем только того пользователя, который сделал этот запрос
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(verifiedUserId)
    
    if (deleteError) throw deleteError

    // Очищаем куки сессии, чтобы разлогинить удаленного пользователя
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить пользователя' },
      { status: 500 }
    )
  }
}
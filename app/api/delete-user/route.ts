import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE() {
  try {
    const cookieStore = await cookies()

    // 1. Создаем клиент с обычными анонимными правами для проверки сессии текущего пользователя
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
              // Ignore
            }
          },
        },
      }
    )

    // Используем getUser() вместо getSession() для максимальной безопасности на бэкенде
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Идентификатор пользователя берется ИСКЛЮЧИТЕЛЬНО из проверенной сессии сервера
    const verifiedUserId = user.id

    // 2. Создаем админ-клиент с сервисным ключом (Service Role Key)
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

    // 3. Безопасно удаляем только того пользователя, который сделал этот запрос
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(verifiedUserId)
    
    if (deleteError) throw deleteError

    // 4. Очищаем текущую сессию в куках, чтобы разлогинить удаленного пользователя
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка при безопасном удалении пользователя:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить пользователя' },
      { status: 500 }
    )
  }
}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (type === 'recovery' && accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          router.push('/update-password')
          return
        }
      }
      router.push('/notes')
    }

    handleHash()
  }, [router])

  return <div>Перенаправление...</div>
}
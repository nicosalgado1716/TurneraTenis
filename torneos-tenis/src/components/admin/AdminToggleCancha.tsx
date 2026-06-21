'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminToggleCancha({ canchaId, activa }: { canchaId: string; activa: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('canchas').update({ activa: !activa }).eq('id', canchaId)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg border disabled:opacity-50 ${
        activa
          ? 'border-red-200 text-red-500 hover:bg-red-50'
          : 'border-green-200 text-green-600 hover:bg-green-50'
      }`}
    >
      {loading ? '...' : activa ? 'Desactivar' : 'Activar'}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminCancelarReserva({ reservaId }: { reservaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cancelar() {
    if (!confirm('¿Cancelar esta reserva?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', reservaId)
    router.refresh()
  }

  return (
    <button
      onClick={cancelar}
      disabled={loading}
      className="text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? '...' : 'Cancelar'}
    </button>
  )
}

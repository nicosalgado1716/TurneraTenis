'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CancelarReservaButton({ reservaId }: { reservaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function cancelar() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', reservaId)

    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={cancelar}
          disabled={loading}
          className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-gray-500 text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
    >
      Cancelar
    </button>
  )
}

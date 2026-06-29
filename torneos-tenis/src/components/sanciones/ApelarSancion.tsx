'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ApelarSancion({ sancionId }: { sancionId: string }) {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleApelar() {
    if (!texto.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('sanciones')
      .update({ apelacion_texto: texto, apelacion_estado: 'pendiente' })
      .eq('id', sancionId)
    setLoading(false)
    setSuccess(true)
    setShow(false)
    router.refresh()
  }

  if (success) {
    return <p className="text-green-700 text-sm font-medium">Apelación enviada. El administrador la revisará a la brevedad.</p>
  }

  return (
    <div>
      {!show ? (
        <button
          onClick={() => setShow(true)}
          className="mt-2 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          Apelar sanción
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            placeholder="Explicá brevemente el motivo de tu apelación..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleApelar}
              disabled={loading || !texto.trim()}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar apelación'}
            </button>
            <button
              onClick={() => setShow(false)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

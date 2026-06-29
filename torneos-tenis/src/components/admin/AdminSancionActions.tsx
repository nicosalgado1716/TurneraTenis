'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sancion } from '@/types'

export default function AdminSancionActions({ sancion }: { sancion: Sancion }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [respuesta, setRespuesta] = useState('')
  const [showRespuesta, setShowRespuesta] = useState(false)

  async function actualizarEstado(estado: string) {
    if (!window.confirm(`¿Confirmar cambio de estado a "${estado}"?`)) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('sanciones').update({ estado }).eq('id', sancion.id)
    setLoading(false)
    router.refresh()
  }

  async function resolverApelacion(apelacion_estado: 'aceptada' | 'rechazada') {
    setLoading(true)
    const supabase = createClient()
    const update: Record<string, string> = { apelacion_estado, apelacion_respuesta: respuesta }
    if (apelacion_estado === 'aceptada') update.estado = 'revocada'
    await supabase.from('sanciones').update(update).eq('id', sancion.id)
    setLoading(false)
    setShowRespuesta(false)
    setRespuesta('')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2 items-start">
      {sancion.estado === 'activa' && (
        <>
          <button
            onClick={() => actualizarEstado('finalizada')}
            disabled={loading}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Finalizar
          </button>
          <button
            onClick={() => actualizarEstado('revocada')}
            disabled={loading}
            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
          >
            Revocar
          </button>
        </>
      )}

      {sancion.apelacion_estado === 'pendiente' && (
        <div className="w-full">
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-1">
            Apelación: {sancion.apelacion_texto}
          </p>
          {!showRespuesta ? (
            <button
              onClick={() => setShowRespuesta(true)}
              className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
            >
              Responder apelación
            </button>
          ) : (
            <div className="space-y-1">
              <textarea
                value={respuesta}
                onChange={e => setRespuesta(e.target.value)}
                placeholder="Respuesta al socio (opcional)"
                rows={2}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-900"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => resolverApelacion('aceptada')}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Aceptar apelación
                </button>
                <button
                  onClick={() => resolverApelacion('rechazada')}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

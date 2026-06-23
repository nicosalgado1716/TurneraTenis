'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cancha } from '@/types'
import { format, addDays } from 'date-fns'

const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
]

const TIPO_LABELS: Record<string, string> = {
  polvo_de_ladrillo: 'Polvo de ladrillo',
  cemento: 'Cemento',
  sintetico: 'Sintético',
  pasto: 'Pasto',
}

interface Props {
  canchas: Cancha[]
}

export default function ReservaForm({ canchas }: Props) {
  const router = useRouter()
  const [canchaId, setCanchaId] = useState(canchas[0]?.id ?? '')
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [horaInicio, setHoraInicio] = useState('')
  const [ocupados, setOcupados] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')
  const maxDate = format(addDays(new Date(), 14), 'yyyy-MM-dd')

  useEffect(() => {
    if (!canchaId || !fecha) return
    setOcupados([])
    setHoraInicio('')
    setLoadingSlots(true)

    const supabase = createClient()
    supabase
      .from('reservas')
      .select('hora_inicio')
      .eq('cancha_id', canchaId)
      .eq('fecha', fecha)
      .neq('estado', 'cancelada')
      .then(({ data }) => {
        setOcupados((data ?? []).map((r: { hora_inicio: string }) => r.hora_inicio.slice(0, 5)))
        setLoadingSlots(false)
      })
  }, [canchaId, fecha])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!horaInicio) {
      setError('Seleccioná un horario')
      return
    }
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const horaFin = `${String(parseInt(horaInicio.split(':')[0]) + 1).padStart(2, '0')}:00`

    const { error: err } = await supabase.from('reservas').insert({
      cancha_id: canchaId,
      user_id: user!.id,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: 'confirmada',
    })

    if (err) {
      setError('No se pudo crear la reserva. El horario puede estar ocupado.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/mis-reservas'), 2000)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-green-800">¡Reserva confirmada!</h2>
        <p className="text-green-600 mt-1">Redirigiendo a tus reservas...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cancha selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canchas.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCanchaId(c.id)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              canchaId === c.id
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <p className="font-semibold text-gray-800">{c.nombre}</p>
            <p className="text-sm text-gray-500">{TIPO_LABELS[c.tipo] ?? c.tipo}</p>
            {c.descripcion && <p className="text-xs text-gray-400 mt-1">{c.descripcion}</p>}
          </button>
        ))}
      </div>

      {/* Fecha */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block font-medium text-gray-700 mb-2">Fecha</label>
        <input
          type="date"
          value={fecha}
          min={today}
          max={maxDate}
          onChange={e => setFecha(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-400 mt-1">Podés reservar hasta 14 días de anticipación</p>
      </div>

      {/* Horarios */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block font-medium text-gray-700 mb-3">Horario</label>
        {loadingSlots ? (
          <p className="text-gray-400 text-sm">Cargando disponibilidad...</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {HORARIOS.map(h => {
              const ocupado = ocupados.includes(h)
              const selected = horaInicio === h
              return (
                <button
                  key={h}
                  type="button"
                  disabled={ocupado}
                  onClick={() => setHoraInicio(h)}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    ocupado
                      ? 'bg-red-100 text-red-400 cursor-not-allowed'
                      : selected
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                  }`}
                >
                  {h}
                </button>
              )
            })}
          </div>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded inline-block"/> Seleccionado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded inline-block"/> Ocupado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded inline-block"/> Disponible</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !horaInicio}
        className="bg-green-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-800 transition disabled:opacity-50"
      >
        {loading ? 'Confirmando...' : 'Confirmar Reserva'}
      </button>
    </form>
  )
}

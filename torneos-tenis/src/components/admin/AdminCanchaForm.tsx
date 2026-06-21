'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminCanchaForm() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', tipo: 'polvo_de_ladrillo', descripcion: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('canchas').insert(form)
    setLoading(false)
    setSuccess(true)
    setForm({ nombre: '', tipo: 'polvo_de_ladrillo', descripcion: '' })
    setTimeout(() => setSuccess(false), 2000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          name="nombre"
          required
          value={form.nombre}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Cancha 4"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de superficie</label>
        <select
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="polvo_de_ladrillo">Polvo de ladrillo</option>
          <option value="cemento">Cemento</option>
          <option value="sintetico">Sintético</option>
          <option value="pasto">Pasto</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
        <input
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {success && <p className="text-green-600 text-sm">✓ Cancha creada correctamente</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Agregar cancha'}
      </button>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { AuditLog } from '@/types'

export default function AuditDetalle({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false)

  const tieneDatos = log.datos_antes || log.datos_despues
  if (!tieneDatos) return <span className="text-gray-300 text-xs">—</span>

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-green-700 hover:underline"
      >
        Ver cambios
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Detalle del cambio</h2>
                <p className="text-sm text-gray-500">{log.descripcion}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {log.datos_antes && (
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wide">Antes</p>
                  <pre className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-gray-700 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(log.datos_antes, null, 2)}
                  </pre>
                </div>
              )}
              {log.datos_despues && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">Después</p>
                  <pre className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-gray-700 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(log.datos_despues, null, 2)}
                  </pre>
                </div>
              )}
              {!log.datos_antes && log.datos_despues && <div />}
              {log.datos_antes && !log.datos_despues && <div />}
            </div>

            {/* Diff visual de campos que cambiaron */}
            {log.datos_antes && log.datos_despues && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Campos modificados</p>
                <div className="space-y-1">
                  {Object.keys(log.datos_despues).map(key => {
                    const antes = JSON.stringify(log.datos_antes![key])
                    const despues = JSON.stringify(log.datos_despues![key])
                    if (antes === despues) return null
                    return (
                      <div key={key} className="flex gap-2 text-xs bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                        <span className="font-mono font-semibold text-gray-600 w-32 shrink-0">{key}</span>
                        <span className="text-red-500 line-through">{antes}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-700">{despues}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

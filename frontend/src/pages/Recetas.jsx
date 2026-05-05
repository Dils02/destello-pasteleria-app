import { useState, useEffect } from 'react'
import { getProductos } from '../services/api'

function Recetas() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    getProductos().then(res => setProductos(res.data))
  }, [])

  const clp = (valor) => `$${Math.round(valor).toLocaleString('es-CL')}`

  const totalIngredientes = productos.reduce((sum, p) => sum + (p.ingredientes?.length || 0), 0)
  const costoPromedio     = productos.length > 0
    ? productos.reduce((sum, p) => sum + p.costo_total, 0) / productos.length
    : 0

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold border-b-4 pb-3 mb-6"
          style={{color: '#1565C0', borderColor: '#29B6F6'}}>
        📒 Recetas
      </h1>

      {/* Métricas — 1 col móvil, 3 desktop */}
      {productos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {[
            { label: '📦 Total productos',    value: productos.length },
            { label: '🧂 Total ingredientes', value: totalIngredientes },
            { label: '💰 Costo promedio',      value: clp(costoPromedio) },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-2xl border border-sky-200 shadow p-5 active:scale-95 transition-all">
              <p className="text-sm font-semibold" style={{color: '#1976D2'}}>{m.label}</p>
              <p className="text-2xl font-bold mt-1" style={{color: '#1565C0'}}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {productos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sky-200 p-8 text-center" style={{color: '#29B6F6'}}>
          ⚠️ No hay productos creados. Ve a <strong>Crear Producto</strong> para agregar uno.
        </div>
      ) : (
        productos.map(producto => (
          <div key={producto.id} className="bg-white rounded-2xl border border-sky-200 shadow-lg mb-4 overflow-hidden">
            <div className="px-4 lg:px-6 py-4 flex justify-between items-center"
                 style={{background: 'linear-gradient(135deg, #E3F2FD, #ffffff)'}}>
              <h3 className="font-semibold text-base lg:text-lg" style={{color: '#1565C0'}}>
                📦 {producto.nombre}
              </h3>
              <span className="font-bold text-sm" style={{color: '#1976D2'}}>
                {clp(producto.costo_total)}
              </span>
            </div>

            <div className="p-4 lg:p-6">
              {/* Tabla con scroll horizontal en móvil */}
              <div className="overflow-x-auto rounded-xl border border-sky-100">
                <table className="w-full text-sm min-w-[450px]">
                  <thead style={{background: '#E3F2FD'}}>
                    <tr>
                      {['Ingrediente','Unidad','Cant. Comprada','Cant. Usada','Costo'].map(h =>
                        <th key={h} className="px-3 py-2 text-left" style={{color: '#1565C0'}}>{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {producto.ingredientes?.map(ing => (
                      <tr key={ing.id} className="border-t border-sky-100">
                        <td className="px-3 py-2">{ing.nombre}</td>
                        <td className="px-3 py-2">{ing.unidad}</td>
                        <td className="px-3 py-2">{ing.cant_comprada}</td>
                        <td className="px-3 py-2">{ing.cant_usada}</td>
                        <td className="px-3 py-2 font-semibold" style={{color: '#1565C0'}}>
                          {clp(ing.costo_proporcional)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Métricas — 2 columnas siempre */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl p-3 text-center" style={{background: '#E3F2FD'}}>
                  <p className="text-xs" style={{color: '#1976D2'}}>💰 Costo total</p>
                  <p className="font-bold" style={{color: '#1565C0'}}>{clp(producto.costo_total)}</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{background: '#E3F2FD'}}>
                  <p className="text-xs" style={{color: '#1976D2'}}>🧂 N° ingredientes</p>
                  <p className="font-bold" style={{color: '#1565C0'}}>{producto.ingredientes?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default Recetas
import { useState, useEffect } from 'react'
import { getVentas, createVenta, deleteVenta, getProductos } from '../services/api'

const Alerta = ({ tipo, mensaje }) => {
  if (!mensaje) return null
  const estilos = {
    error   : 'bg-red-50 border-red-400 text-red-700',
    success : 'bg-blue-50 border-blue-400 text-blue-700',
    warning : 'bg-yellow-50 border-yellow-400 text-yellow-700',
    info    : 'bg-sky-50 border-sky-400 text-sky-700',
  }
  const iconos = { error: '❌', success: '✅', warning: '⚠️', info: 'ℹ️' }
  return (
    <div className={`flex items-center gap-2 border-l-4 rounded-xl px-4 py-3 mt-3 text-sm font-medium ${estilos[tipo]}`}>
      <span>{iconos[tipo]}</span>
      <span>{mensaje}</span>
    </div>
  )
}

const Campo = ({ error, children }) => (
  <div className="flex flex-col gap-1">
    {children}
    {error && <p className="text-red-500 text-xs font-medium pl-1">⚠ {error}</p>}
  </div>
)

function Ventas() {
  const [ventas,        setVentas]        = useState([])
  const [productos,     setProductos]     = useState([])
  const [cargando,      setCargando]      = useState(false)
  const [alerta,        setAlerta]        = useState({ tipo: '', mensaje: '' })
  const [seleccionadas, setSeleccionadas] = useState([])
  const [errores,       setErrores]       = useState({})

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    producto: '', categoria: 'Alimentos',
    unidades: '', precio_venta: '',
    vendedor: '', notas: ''
  })

  useEffect(() => {
    cargarVentas()
    getProductos().then(res => setProductos(res.data))
  }, [])

  const cargarVentas = async () => {
    const res = await getVentas()
    setVentas(res.data)
  }

  const clp = (valor) => `$${Math.round(valor).toLocaleString('es-CL')}`

  const validarVenta = () => {
    const err = {}
    if (!form.fecha)
      err.fecha = 'La fecha es obligatoria'
    if (!form.producto)
      err.producto = 'Debes seleccionar un producto'
    if (!form.unidades || parseInt(form.unidades) <= 0)
      err.unidades = 'Las unidades deben ser mayor a 0'
    if (!form.precio_venta || parseFloat(form.precio_venta) <= 0)
      err.precio_venta = 'El precio de venta debe ser mayor a 0'
    if (!form.vendedor.trim())
      err.vendedor = 'El nombre del vendedor es obligatorio'
    else if (form.vendedor.trim().length < 3)
      err.vendedor = 'El nombre debe tener al menos 3 caracteres'
    const producto   = productos.find(p => p.nombre === form.producto)
    const costo_prod = producto?.costo_total || 0
    const ingreso    = parseInt(form.unidades || 0) * parseFloat(form.precio_venta || 0)
    if (form.precio_venta && form.unidades && ingreso < costo_prod)
      err.precio_venta = `El ingreso (${clp(ingreso)}) no cubre el costo (${clp(costo_prod)})`
    setErrores(err)
    return Object.keys(err).length === 0
  }

  const registrarVenta = async () => {
    if (!validarVenta()) return
    setCargando(true)
    const producto      = productos.find(p => p.nombre === form.producto)
    const costo_prod    = producto?.costo_total || 0
    const ingreso_total = parseInt(form.unidades) * parseFloat(form.precio_venta)
    const ganancia      = ingreso_total - costo_prod
    try {
      await createVenta({
        ...form,
        unidades         : parseInt(form.unidades),
        precio_venta     : parseFloat(form.precio_venta),
        ingreso_total,
        costo_produccion : costo_prod,
        ganancia
      })
      setAlerta({ tipo: 'success', mensaje: `Venta registrada — Ingreso: ${clp(ingreso_total)} | Ganancia: ${clp(ganancia)}` })
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        producto: '', categoria: 'Alimentos',
        unidades: '', precio_venta: '',
        vendedor: '', notas: ''
      })
      setErrores({})
      cargarVentas()
    } catch (e) {
      setAlerta({ tipo: 'error', mensaje: 'Error al registrar la venta.' })
    } finally {
      setCargando(false)
    }
  }

  const toggleSeleccion = (id) =>
    setSeleccionadas(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const eliminarSeleccionadas = async () => {
    for (const id of seleccionadas) await deleteVenta(id)
    setSeleccionadas([])
    setAlerta({ tipo: 'success', mensaje: `${seleccionadas.length} venta(s) eliminada(s)` })
    cargarVentas()
  }

  const totalIngresos = ventas.reduce((sum, v) => sum + v.ingreso_total, 0)
  const totalGanancia = ventas.reduce((sum, v) => sum + v.ganancia, 0)
  const totalUnidades = ventas.reduce((sum, v) => sum + v.unidades, 0)

  const inputClass = (error) =>
    `w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all text-base
    ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-sky-200 bg-white focus:border-blue-400'}`

  const productoSeleccionado = productos.find(p => p.nombre === form.producto)
  const previewIngreso       = parseInt(form.unidades || 0) * parseFloat(form.precio_venta || 0)
  const previewGanancia      = previewIngreso - (productoSeleccionado?.costo_total || 0)

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold border-b-4 pb-3 mb-6"
          style={{color: '#1565C0', borderColor: '#29B6F6'}}>
        🧾 Registrar Venta
      </h1>

      <div className="bg-white rounded-2xl border border-sky-200 shadow-lg p-4 lg:p-6 mb-6">
        <h2 className="text-lg lg:text-xl font-semibold mb-4" style={{color: '#1976D2'}}>
          ➕ Nueva Venta
        </h2>

        {/* Grid 1 col móvil, 2 desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Campo error={errores.fecha}>
            <input type="date" value={form.fecha}
              onChange={e => { setForm({...form, fecha: e.target.value}); setErrores({...errores, fecha: ''}) }}
              className={inputClass(errores.fecha)}/>
          </Campo>

          <Campo error={errores.producto}>
            <select value={form.producto}
              onChange={e => { setForm({...form, producto: e.target.value}); setErrores({...errores, producto: ''}) }}
              className={inputClass(errores.producto)}>
              <option value="">📦 Seleccionar producto</option>
              {productos.map(p =>
                <option key={p.id} value={p.nombre}>{p.nombre} — {clp(p.costo_total)}</option>
              )}
            </select>
          </Campo>

          <Campo error={errores.unidades}>
            <input type="number" placeholder="🔢 Unidades vendidas" min="1"
              value={form.unidades}
              onChange={e => { setForm({...form, unidades: e.target.value}); setErrores({...errores, unidades: ''}) }}
              className={inputClass(errores.unidades)}/>
          </Campo>

          <Campo error={errores.precio_venta}>
            <input type="number" placeholder="💲 Precio de venta por unidad" min="0"
              value={form.precio_venta}
              onChange={e => { setForm({...form, precio_venta: e.target.value}); setErrores({...errores, precio_venta: ''}) }}
              className={inputClass(errores.precio_venta)}/>
          </Campo>

          <Campo error={errores.vendedor}>
            <input type="text" placeholder="👤 Vendedor"
              value={form.vendedor}
              onChange={e => { setForm({...form, vendedor: e.target.value}); setErrores({...errores, vendedor: ''}) }}
              className={inputClass(errores.vendedor)}/>
          </Campo>

          <select value={form.categoria}
            onChange={e => setForm({...form, categoria: e.target.value})}
            className="w-full border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 text-base">
            {['Alimentos','Electrónica','Ropa','Servicios','Otro'].map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>

        <textarea placeholder="📝 Notas (opcional)"
          value={form.notas}
          onChange={e => setForm({...form, notas: e.target.value})}
          className="w-full mt-4 border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 text-base"/>

        {/* Preview ganancia */}
        {form.producto && form.unidades && form.precio_venta && (
          <div className={`mt-3 border-l-4 rounded-xl px-4 py-3 text-sm font-medium
            ${previewGanancia >= 0
              ? 'bg-blue-50 border-blue-400 text-blue-700'
              : 'bg-red-50 border-red-400 text-red-700'}`}>
            📊 Ingreso: <strong>{clp(previewIngreso)}</strong> | Ganancia: <strong>{clp(previewGanancia)}</strong>
            {previewGanancia < 0 && ' — ⚠️ Por debajo del costo'}
          </div>
        )}

        <Alerta tipo={alerta.tipo} mensaje={alerta.mensaje} />

        <button onClick={registrarVenta} disabled={cargando}
          className="w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
          {cargando ? '⏳ Registrando...' : '✅ Registrar Venta'}
        </button>
      </div>

      {ventas.length > 0 && (
        <>
          {/* Métricas — 2 col móvil, 4 desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: '🧾 Ventas',    value: ventas.length },
              { label: '💰 Ingresos',  value: clp(totalIngresos) },
              { label: '📦 Unidades',  value: totalUnidades },
              { label: '📈 Ganancia',  value: clp(totalGanancia) },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-2xl border border-sky-200 shadow p-4 transition-all">
                <p className="text-xs font-semibold" style={{color: '#1976D2'}}>{m.label}</p>
                <p className="text-lg font-bold mt-1" style={{color: '#1565C0'}}>{m.value}</p>
              </div>
            ))}
          </div>

          {seleccionadas.length > 0 && (
            <div className="mb-4 flex flex-col lg:flex-row items-start lg:items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 font-semibold flex-1">
                ⚠️ {seleccionadas.length} venta(s) marcada(s)
              </p>
              <button onClick={eliminarSeleccionadas}
                className="w-full lg:w-auto px-6 py-2 rounded-xl font-semibold text-white bg-red-500 active:scale-95 transition-all">
                🗑️ Confirmar eliminación
              </button>
            </div>
          )}

          {/* Tabla con scroll horizontal en móvil */}
          <div className="bg-white rounded-2xl border border-sky-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead style={{background: '#E3F2FD'}}>
                  <tr>
                    <th className="px-3 py-3 text-left" style={{color: '#1565C0'}}>🗑️</th>
                    {['Fecha','Producto','Categoría','Unidades','Precio','Ingreso','Costo','Ganancia','Vendedor'].map(h =>
                      <th key={h} className="px-3 py-3 text-left" style={{color: '#1565C0'}}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ventas.map(v => (
                    <tr key={v.id} className={`border-t border-sky-100 transition-colors
                      ${seleccionadas.includes(v.id) ? 'bg-red-50' : 'hover:bg-sky-50'}`}>
                      <td className="px-3 py-2">
                        <input type="checkbox"
                          checked={seleccionadas.includes(v.id)}
                          onChange={() => toggleSeleccion(v.id)}
                          className="w-5 h-5 accent-blue-500"/>
                      </td>
                      <td className="px-3 py-2">{v.fecha}</td>
                      <td className="px-3 py-2 font-medium">{v.producto}</td>
                      <td className="px-3 py-2">{v.categoria}</td>
                      <td className="px-3 py-2">{v.unidades}</td>
                      <td className="px-3 py-2">{clp(v.precio_venta)}</td>
                      <td className="px-3 py-2 font-semibold" style={{color: '#1565C0'}}>{clp(v.ingreso_total)}</td>
                      <td className="px-3 py-2">{clp(v.costo_produccion)}</td>
                      <td className={`px-3 py-2 font-semibold ${v.ganancia >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {clp(v.ganancia)}
                      </td>
                      <td className="px-3 py-2">{v.vendedor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Ventas
import { useState, useEffect } from 'react'
import { getPedidos, createPedido, deletePedido, cambiarEstado, getProductos } from '../services/api'

// ── Alerta ──
const Alerta = ({ tipo, mensaje }) => {
  if (!mensaje) return null
  const estilos = {
    error   : 'bg-red-50 border-red-400 text-red-700',
    success : 'bg-blue-50 border-blue-400 text-blue-700',
    warning : 'bg-yellow-50 border-yellow-400 text-yellow-700',
  }
  const iconos = { error: '❌', success: '✅', warning: '⚠️' }
  return (
    <div className={`flex items-center gap-2 border-l-4 rounded-xl px-4 py-3 mt-3 text-sm font-medium ${estilos[tipo]}`}>
      <span>{iconos[tipo]}</span>
      <span>{mensaje}</span>
    </div>
  )
}

// ── Campo con error ──
const Campo = ({ error, children }) => (
  <div className="flex flex-col gap-1">
    {children}
    {error && <p className="text-red-500 text-xs font-medium pl-1">⚠ {error}</p>}
  </div>
)

// ── Badge de estado ──
const BadgeEstado = ({ estado }) => {
  const estilos = {
    pendiente  : 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    entregado  : 'bg-green-100 text-green-700 border border-green-300',
    cancelado  : 'bg-red-100 text-red-600 border border-red-300',
  }
  const iconos = { pendiente: '⏳', entregado: '✅', cancelado: '❌' }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estilos[estado]}`}>
      {iconos[estado]} {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  )
}

function Pedidos() {
  const [pedidos,   setPedidos]   = useState([])
  const [productos, setProductos] = useState([])
  const [pestana,   setPestana]   = useState('pendientes')
  const [cargando,  setCargando]  = useState(false)
  const [alerta,    setAlerta]    = useState({ tipo: '', mensaje: '' })
  const [errores,   setErrores]   = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)

  const [form, setForm] = useState({
    nombre_cliente : '',
    fecha_entrega  : '',
    producto       : '',
    cantidad       : '',
    receta         : '',
    notas          : '',
    estado         : 'pendiente'
  })

  useEffect(() => {
    cargarPedidos()
    getProductos().then(res => setProductos(res.data))
  }, [])

  const cargarPedidos = async () => {
    const res = await getPedidos()
    setPedidos(res.data)
  }

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje })
    setTimeout(() => setAlerta({ tipo: '', mensaje: '' }), 3000)
  }

  // ── Validación ──
  const validarForm = () => {
    const err = {}
    if (!form.nombre_cliente.trim())
      err.nombre_cliente = 'El nombre del cliente es obligatorio'
    else if (form.nombre_cliente.trim().length < 3)
      err.nombre_cliente = 'El nombre debe tener al menos 3 caracteres'
    if (!form.fecha_entrega)
      err.fecha_entrega = 'La fecha de entrega es obligatoria'
    if (!form.producto.trim())
      err.producto = 'El producto es obligatorio'
    if (!form.cantidad || parseInt(form.cantidad) <= 0)
      err.cantidad = 'La cantidad debe ser mayor a 0'
    setErrores(err)
    return Object.keys(err).length === 0
  }

  const registrarPedido = async () => {
    if (!validarForm()) return
    setCargando(true)
    try {
      await createPedido({ ...form, cantidad: parseInt(form.cantidad) })
      mostrarAlerta('success', `Pedido de '${form.nombre_cliente}' registrado correctamente`)
      setForm({
        nombre_cliente: '', fecha_entrega: '',
        producto: '', cantidad: '',
        receta: '', notas: '', estado: 'pendiente'
      })
      setErrores({})
      setMostrarForm(false)
      cargarPedidos()
    } catch (e) {
      mostrarAlerta('error', 'Error al registrar el pedido')
    } finally {
      setCargando(false)
    }
  }

  const actualizarEstado = async (id, estado) => {
    try {
      await cambiarEstado(id, estado)
      mostrarAlerta('success', `Pedido marcado como ${estado}`)
      cargarPedidos()
    } catch (e) {
      mostrarAlerta('error', 'Error al actualizar el estado')
    }
  }

  const eliminarPedido = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el pedido de "${nombre}"?`)) return
    try {
      await deletePedido(id)
      mostrarAlerta('success', 'Pedido eliminado correctamente')
      cargarPedidos()
    } catch (e) {
      mostrarAlerta('error', 'Error al eliminar el pedido')
    }
  }

  const inputClass = (error) =>
    `w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all text-base
    ${error ? 'border-red-400 bg-red-50' : 'border-sky-200 bg-white focus:border-blue-400'}`

  // ── Filtrar pedidos por pestaña ──
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente')
  const pedidosHistorial  = pedidos.filter(p => p.estado === 'entregado' || p.estado === 'cancelado')

  // ── Métricas ──
  const totalPendientes = pedidos.filter(p => p.estado === 'pendiente').length
  const totalEntregados = pedidos.filter(p => p.estado === 'entregado').length
  const totalCancelados = pedidos.filter(p => p.estado === 'cancelado').length

  // ── Tarjeta de pedido ──
  const TarjetaPedido = ({ pedido, mostrarAcciones = true }) => (
    <div className={`bg-white rounded-2xl border shadow-md p-4 lg:p-5 transition-all
      ${pedido.estado === 'entregado' ? 'border-green-200 opacity-80' :
        pedido.estado === 'cancelado' ? 'border-red-200 opacity-70' : 'border-sky-200'}`}>

      {/* Header tarjeta */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-base" style={{color: '#1565C0'}}>
            👤 {pedido.nombre_cliente}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            📅 Entrega: <strong>{pedido.fecha_entrega}</strong>
          </p>
        </div>
        <BadgeEstado estado={pedido.estado} />
      </div>

      {/* Detalle pedido */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl p-2 text-center" style={{background: '#E3F2FD'}}>
          <p className="text-xs" style={{color: '#1976D2'}}>📦 Producto</p>
          <p className="font-semibold text-sm" style={{color: '#1565C0'}}>{pedido.producto}</p>
        </div>
        <div className="rounded-xl p-2 text-center" style={{background: '#E3F2FD'}}>
          <p className="text-xs" style={{color: '#1976D2'}}>🔢 Cantidad</p>
          <p className="font-semibold text-sm" style={{color: '#1565C0'}}>{pedido.cantidad}</p>
        </div>
      </div>

      {pedido.receta && (
        <p className="text-xs text-gray-500 mb-2">
          📒 Receta: <span className="font-medium">{pedido.receta}</span>
        </p>
      )}

      {pedido.notas && (
        <p className="text-xs text-gray-500 mb-3">
          📝 <span className="italic">{pedido.notas}</span>
        </p>
      )}

      {/* Acciones */}
      {mostrarAcciones && pedido.estado === 'pendiente' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-sky-100">
          <button
            onClick={() => actualizarEstado(pedido.id, 'entregado')}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
            style={{background: 'linear-gradient(135deg, #4CAF50, #2E7D32)'}}>
            ✅ Marcar entregado
          </button>
          <button
            onClick={() => actualizarEstado(pedido.id, 'cancelado')}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-orange-400 hover:bg-orange-500 transition-all active:scale-95">
            ❌ Cancelar
          </button>
          <button
            onClick={() => eliminarPedido(pedido.id, pedido.nombre_cliente)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-red-400 hover:bg-red-500 transition-all active:scale-95">
            🗑️
          </button>
        </div>
      )}

      {/* Acciones historial */}
      {mostrarAcciones && pedido.estado !== 'pendiente' && (
        <div className="flex justify-end mt-3 pt-3 border-t border-sky-100">
          <button
            onClick={() => actualizarEstado(pedido.id, 'pendiente')}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all"
            style={{background: '#1976D2'}}>
            ↩️ Reactivar
          </button>
          <button
            onClick={() => eliminarPedido(pedido.id, pedido.nombre_cliente)}
            className="ml-2 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-red-400 hover:bg-red-500 transition-all">
            🗑️
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold border-b-4 pb-3 mb-6"
          style={{color: '#1565C0', borderColor: '#29B6F6'}}>
        📋 Pedidos
      </h1>

      <Alerta tipo={alerta.tipo} mensaje={alerta.mensaje} />

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 mb-6 mt-3">
        {[
          { label: '⏳ Pendientes', value: totalPendientes, color: '#F59E0B' },
          { label: '✅ Entregados', value: totalEntregados, color: '#10B981' },
          { label: '❌ Cancelados', value: totalCancelados, color: '#EF4444' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-sky-200 shadow p-4 text-center transition-all">
            <p className="text-xs font-semibold text-gray-500">{m.label}</p>
            <p className="text-2xl font-bold mt-1" style={{color: m.color}}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Botón nuevo pedido */}
      <button
        onClick={() => setMostrarForm(!mostrarForm)}
        className="w-full lg:w-auto mb-6 px-6 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
        style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
        {mostrarForm ? '✕ Cerrar formulario' : '➕ Nuevo Pedido'}
      </button>

      {/* Formulario nuevo pedido */}
      {mostrarForm && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-lg p-4 lg:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{color: '#1976D2'}}>
            📋 Registrar Nuevo Pedido
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Campo error={errores.nombre_cliente}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>👤 Nombre del cliente</label>
              <input type="text" placeholder="Ej: María González"
                value={form.nombre_cliente}
                onChange={e => { setForm({...form, nombre_cliente: e.target.value}); setErrores({...errores, nombre_cliente: ''}) }}
                className={inputClass(errores.nombre_cliente)}/>
            </Campo>

            <Campo error={errores.fecha_entrega}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>📅 Fecha de entrega</label>
              <input type="date"
                value={form.fecha_entrega}
                onChange={e => { setForm({...form, fecha_entrega: e.target.value}); setErrores({...errores, fecha_entrega: ''}) }}
                className={inputClass(errores.fecha_entrega)}/>
            </Campo>

            <Campo error={errores.producto}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>📦 Producto pedido</label>
              <input type="text" placeholder="Ej: Torta de chocolate"
                value={form.producto}
                onChange={e => { setForm({...form, producto: e.target.value}); setErrores({...errores, producto: ''}) }}
                className={inputClass(errores.producto)}/>
            </Campo>

            <Campo error={errores.cantidad}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>🔢 Cantidad pedida</label>
              <input type="number" placeholder="Ej: 2" min="1"
                value={form.cantidad}
                onChange={e => { setForm({...form, cantidad: e.target.value}); setErrores({...errores, cantidad: ''}) }}
                className={inputClass(errores.cantidad)}/>
            </Campo>

            <Campo error={null}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>📒 Receta del pedido (opcional)</label>
              <select value={form.receta}
                onChange={e => setForm({...form, receta: e.target.value})}
                className="w-full border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 text-base">
                <option value="">Sin receta específica</option>
                {productos.map(p =>
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                )}
              </select>
            </Campo>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium" style={{color: '#1565C0'}}>📝 Notas (opcional)</label>
            <textarea placeholder="Ej: Sin azúcar, con decoración especial..."
              value={form.notas}
              onChange={e => setForm({...form, notas: e.target.value})}
              className="w-full mt-1 border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 text-base"/>
          </div>

          <button onClick={registrarPedido} disabled={cargando}
            className="w-full mt-4 py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
            {cargando ? '⏳ Registrando...' : '✅ Registrar Pedido'}
          </button>
        </div>
      )}

      {/* Pestañas */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'pendientes', label: `⏳ Pendientes (${totalPendientes})` },
          { key: 'historial',  label: `📚 Historial (${pedidosHistorial.length})` },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setPestana(tab.key)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all
              ${pestana === tab.key
                ? 'text-white shadow-md'
                : 'bg-white border border-sky-200 hover:bg-sky-50'}`}
            style={pestana === tab.key
              ? {background: 'linear-gradient(135deg, #29B6F6, #1565C0)', color: 'white'}
              : {color: '#1565C0'}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido pestaña Pendientes */}
      {pestana === 'pendientes' && (
        <div>
          {pedidosPendientes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sky-200 p-8 text-center" style={{color: '#29B6F6'}}>
              🎉 No hay pedidos pendientes por ahora.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pedidosPendientes.map(pedido => (
                <TarjetaPedido key={pedido.id} pedido={pedido} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido pestaña Historial */}
      {pestana === 'historial' && (
        <div>
          {pedidosHistorial.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sky-200 p-8 text-center" style={{color: '#29B6F6'}}>
              📭 El historial está vacío todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pedidosHistorial.map(pedido => (
                <TarjetaPedido key={pedido.id} pedido={pedido} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Pedidos
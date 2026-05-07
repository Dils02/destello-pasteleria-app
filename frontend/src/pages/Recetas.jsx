import { useState, useEffect } from 'react'
import { getProductos, deleteProducto, addIngrediente, updateIngrediente, deleteIngrediente } from '../services/api'

// ── Modal reutilizable ──
const Modal = ({ titulo, onCerrar, children }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center px-6 py-4 border-b border-sky-100"
           style={{background: 'linear-gradient(135deg, #E3F2FD, #ffffff)'}}>
        <h3 className="text-lg font-semibold" style={{color: '#1565C0'}}>{titulo}</h3>
        <button onClick={onCerrar}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors">
          ✕
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

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

function Recetas() {
  const [productos,          setProductos]          = useState([])
  const [alerta,             setAlerta]             = useState({ tipo: '', mensaje: '' })
  const [expandidos,         setExpandidos]         = useState({})

  // ── Estados de modales ──
  const [modalEditarIng,     setModalEditarIng]     = useState(null)   // ingrediente a editar
  const [modalAgregarIng,    setModalAgregarIng]    = useState(null)   // producto_id al que agregar
  const [modalConfirmDelete, setModalConfirmDelete] = useState(null)   // { tipo: 'producto'|'ingrediente', id, nombre }

  // ── Formulario editar ingrediente ──
  const [formEditar, setFormEditar] = useState({
    nombre: '', unidad: 'g', cant_comprada: '', precio_compra: '', cant_usada: ''
  })
  const [erroresEditar, setErroresEditar] = useState({})

  // ── Formulario agregar ingrediente ──
  const [formAgregar, setFormAgregar] = useState({
    nombre: '', unidad: 'g', cant_comprada: '', precio_compra: '', cant_usada: ''
  })
  const [erroresAgregar, setErroresAgregar] = useState({})
  const [cargando, setCargando] = useState(false)

  useEffect(() => { cargarProductos() }, [])

  const cargarProductos = async () => {
    const res = await getProductos()
    setProductos(res.data)
  }

  const clp = (valor) => `$${Math.round(valor).toLocaleString('es-CL')}`

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje })
    setTimeout(() => setAlerta({ tipo: '', mensaje: '' }), 3000)
  }

  const toggleExpander = (id) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ── Validar formulario ingrediente ──
  const validarIngrediente = (form, setErrores) => {
    const errores = {}
    if (!form.nombre.trim())
      errores.nombre = 'El nombre es obligatorio'
    if (!form.cant_comprada || parseFloat(form.cant_comprada) <= 0)
      errores.cant_comprada = 'Debe ser mayor a 0'
    if (!form.precio_compra || parseFloat(form.precio_compra) <= 0)
      errores.precio_compra = 'Debe ser mayor a 0'
    if (!form.cant_usada || parseFloat(form.cant_usada) <= 0)
      errores.cant_usada = 'Debe ser mayor a 0'
    else if (parseFloat(form.cant_usada) > parseFloat(form.cant_comprada))
      errores.cant_usada = 'No puede ser mayor a la cantidad comprada'
    setErrores(errores)
    return Object.keys(errores).length === 0
  }

  // ── Abrir modal editar ──
  const abrirModalEditar = (ing) => {
    setFormEditar({
      nombre       : ing.nombre,
      unidad       : ing.unidad,
      cant_comprada: ing.cant_comprada,
      precio_compra: ing.precio_compra,
      cant_usada   : ing.cant_usada
    })
    setErroresEditar({})
    setModalEditarIng(ing)
  }

  // ── Guardar edición ingrediente ──
  const guardarEdicion = async () => {
    if (!validarIngrediente(formEditar, setErroresEditar)) return
    setCargando(true)
    try {
      const costo_proporcional = (formEditar.cant_usada / formEditar.cant_comprada) * formEditar.precio_compra
      await updateIngrediente(modalEditarIng.id, { ...formEditar, costo_proporcional })
      mostrarAlerta('success', `Ingrediente '${formEditar.nombre}' actualizado correctamente`)
      setModalEditarIng(null)
      cargarProductos()
    } catch (e) {
      mostrarAlerta('error', 'Error al actualizar el ingrediente')
    } finally {
      setCargando(false)
    }
  }

  // ── Agregar ingrediente a producto existente ──
  const guardarNuevoIngrediente = async () => {
    if (!validarIngrediente(formAgregar, setErroresAgregar)) return
    setCargando(true)
    try {
      const costo_proporcional = (formAgregar.cant_usada / formAgregar.cant_comprada) * formAgregar.precio_compra
      await addIngrediente(modalAgregarIng, { ...formAgregar, costo_proporcional })
      mostrarAlerta('success', `Ingrediente '${formAgregar.nombre}' agregado correctamente`)
      setModalAgregarIng(null)
      setFormAgregar({ nombre: '', unidad: 'g', cant_comprada: '', precio_compra: '', cant_usada: '' })
      cargarProductos()
    } catch (e) {
      mostrarAlerta('error', 'Error al agregar el ingrediente')
    } finally {
      setCargando(false)
    }
  }

  // ── Confirmar eliminación ──
  const confirmarEliminacion = async () => {
    if (!modalConfirmDelete) return
    setCargando(true)
    try {
      if (modalConfirmDelete.tipo === 'producto') {
        await deleteProducto(modalConfirmDelete.id)
        mostrarAlerta('success', `Producto '${modalConfirmDelete.nombre}' eliminado`)
      } else {
        await deleteIngrediente(modalConfirmDelete.id)
        mostrarAlerta('success', `Ingrediente '${modalConfirmDelete.nombre}' eliminado`)
      }
      setModalConfirmDelete(null)
      cargarProductos()
    } catch (e) {
      mostrarAlerta('error', 'Error al eliminar')
    } finally {
      setCargando(false)
    }
  }

  const inputClass = (error) =>
    `w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all text-base
    ${error ? 'border-red-400 bg-red-50' : 'border-sky-200 bg-white focus:border-blue-400'}`

  const totalIngredientes = productos.reduce((sum, p) => sum + (p.ingredientes?.length || 0), 0)
  const costoPromedio     = productos.length > 0
    ? productos.reduce((sum, p) => sum + p.costo_total, 0) / productos.length : 0

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold border-b-4 pb-3 mb-6"
          style={{color: '#1565C0', borderColor: '#29B6F6'}}>
        📒 Recetas
      </h1>

      <Alerta tipo={alerta.tipo} mensaje={alerta.mensaje} />

      {/* Métricas */}
      {productos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 mt-3">
          {[
            { label: '📦 Total productos',    value: productos.length },
            { label: '🧂 Total ingredientes', value: totalIngredientes },
            { label: '💰 Costo promedio',      value: clp(costoPromedio) },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-2xl border border-sky-200 shadow p-5 transition-all">
              <p className="text-sm font-semibold" style={{color: '#1976D2'}}>{m.label}</p>
              <p className="text-2xl font-bold mt-1" style={{color: '#1565C0'}}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista productos */}
      {productos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sky-200 p-8 text-center" style={{color: '#29B6F6'}}>
          ⚠️ No hay productos creados. Ve a <strong>Crear Producto</strong> para agregar uno.
        </div>
      ) : (
        productos.map(producto => (
          <div key={producto.id} className="bg-white rounded-2xl border border-sky-200 shadow-lg mb-4 overflow-hidden">

            {/* Header del producto */}
            <div className="px-4 lg:px-6 py-4 flex justify-between items-center"
                 style={{background: 'linear-gradient(135deg, #E3F2FD, #ffffff)'}}>
              <div className="flex items-center gap-3">
                {/* Botón expander */}
                <button
                  onClick={() => toggleExpander(producto.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-white font-bold"
                  style={{background: '#1565C0'}}>
                  {expandidos[producto.id] ? '▲' : '▼'}
                </button>
                <div>
                  <h3 className="font-semibold text-base lg:text-lg" style={{color: '#1565C0'}}>
                    📦 {producto.nombre}
                  </h3>
                  <p className="text-xs" style={{color: '#1976D2'}}>
                    {producto.ingredientes?.length || 0} ingredientes — Costo: {clp(producto.costo_total)}
                  </p>
                </div>
              </div>

              {/* Acciones del producto */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setModalAgregarIng(producto.id); setFormAgregar({ nombre: '', unidad: 'g', cant_comprada: '', precio_compra: '', cant_usada: '' }) }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
                  style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
                  ➕ Ingrediente
                </button>
                <button
                  onClick={() => setModalConfirmDelete({ tipo: 'producto', id: producto.id, nombre: producto.nombre })}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-red-400 hover:bg-red-500 transition-all active:scale-95">
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            {/* Contenido expandible */}
            {expandidos[producto.id] && (
              <div className="p-4 lg:p-6">
                <div className="overflow-x-auto rounded-xl border border-sky-100">
                  <table className="w-full text-sm min-w-[550px]">
                    <thead style={{background: '#E3F2FD'}}>
                      <tr>
                        {['Ingrediente','Unidad','Cant. Comprada','Cant. Usada','Costo','Acciones'].map(h =>
                          <th key={h} className="px-3 py-2 text-left" style={{color: '#1565C0'}}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {producto.ingredientes?.map(ing => (
                        <tr key={ing.id} className="border-t border-sky-100 hover:bg-sky-50">
                          <td className="px-3 py-2 font-medium">{ing.nombre}</td>
                          <td className="px-3 py-2">{ing.unidad}</td>
                          <td className="px-3 py-2">{ing.cant_comprada}</td>
                          <td className="px-3 py-2">{ing.cant_usada}</td>
                          <td className="px-3 py-2 font-semibold" style={{color: '#1565C0'}}>
                            {clp(ing.costo_proporcional)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirModalEditar(ing)}
                                className="px-2 py-1 rounded-lg text-xs font-semibold text-white transition-all"
                                style={{background: '#1976D2'}}>
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => setModalConfirmDelete({ tipo: 'ingrediente', id: ing.id, nombre: ing.nombre })}
                                className="px-2 py-1 rounded-lg text-xs font-semibold text-white bg-red-400 hover:bg-red-500 transition-all">
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen costos */}
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
            )}
          </div>
        ))
      )}

      {/* ══ MODAL EDITAR INGREDIENTE ══ */}
      {modalEditarIng && (
        <Modal titulo={`✏️ Editar — ${modalEditarIng.nombre}`} onCerrar={() => setModalEditarIng(null)}>
          <div className="flex flex-col gap-4">
            <Campo error={erroresEditar.nombre}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Nombre</label>
              <input type="text" value={formEditar.nombre}
                onChange={e => { setFormEditar({...formEditar, nombre: e.target.value}); setErroresEditar({...erroresEditar, nombre: ''}) }}
                className={inputClass(erroresEditar.nombre)}/>
            </Campo>

            <Campo error={null}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Unidad</label>
              <select value={formEditar.unidad}
                onChange={e => setFormEditar({...formEditar, unidad: e.target.value})}
                className="w-full border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none text-base">
                {['kg','g','L','mL','unidad','taza','otro'].map(u =>
                  <option key={u} value={u}>{u}</option>
                )}
              </select>
            </Campo>

            <Campo error={erroresEditar.cant_comprada}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Cantidad total comprada</label>
              <input type="number" min="0" value={formEditar.cant_comprada}
                onChange={e => { setFormEditar({...formEditar, cant_comprada: e.target.value}); setErroresEditar({...erroresEditar, cant_comprada: ''}) }}
                className={inputClass(erroresEditar.cant_comprada)}/>
            </Campo>

            <Campo error={erroresEditar.precio_compra}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Precio de compra total</label>
              <input type="number" min="0" value={formEditar.precio_compra}
                onChange={e => { setFormEditar({...formEditar, precio_compra: e.target.value}); setErroresEditar({...erroresEditar, precio_compra: ''}) }}
                className={inputClass(erroresEditar.precio_compra)}/>
            </Campo>

            <Campo error={erroresEditar.cant_usada}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Cantidad usada en el producto</label>
              <input type="number" min="0" value={formEditar.cant_usada}
                onChange={e => { setFormEditar({...formEditar, cant_usada: e.target.value}); setErroresEditar({...erroresEditar, cant_usada: ''}) }}
                className={inputClass(erroresEditar.cant_usada)}/>
            </Campo>

            {/* Preview costo */}
            {formEditar.cant_comprada > 0 && formEditar.precio_compra > 0 && formEditar.cant_usada > 0 && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-sm" style={{color: '#1565C0'}}>
                📊 Costo proporcional: <strong>
                  {clp((formEditar.cant_usada / formEditar.cant_comprada) * formEditar.precio_compra)}
                </strong>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setModalEditarIng(null)}
                className="flex-1 py-3 rounded-xl font-semibold border-2 border-sky-200 text-gray-600 hover:bg-sky-50 transition-all">
                Cancelar
              </button>
              <button onClick={guardarEdicion} disabled={cargando}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
                {cargando ? '⏳ Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ MODAL AGREGAR INGREDIENTE ══ */}
      {modalAgregarIng && (
        <Modal titulo="➕ Agregar Ingrediente" onCerrar={() => setModalAgregarIng(null)}>
          <div className="flex flex-col gap-4">
            <Campo error={erroresAgregar.nombre}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Nombre</label>
              <input type="text" value={formAgregar.nombre}
                onChange={e => { setFormAgregar({...formAgregar, nombre: e.target.value}); setErroresAgregar({...erroresAgregar, nombre: ''}) }}
                className={inputClass(erroresAgregar.nombre)}/>
            </Campo>

            <Campo error={null}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Unidad</label>
              <select value={formAgregar.unidad}
                onChange={e => setFormAgregar({...formAgregar, unidad: e.target.value})}
                className="w-full border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none text-base">
                {['kg','g','L','mL','unidad','taza','otro'].map(u =>
                  <option key={u} value={u}>{u}</option>
                )}
              </select>
            </Campo>

            <Campo error={erroresAgregar.cant_comprada}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Cantidad total comprada</label>
              <input type="number" min="0" value={formAgregar.cant_comprada}
                onChange={e => { setFormAgregar({...formAgregar, cant_comprada: e.target.value}); setErroresAgregar({...erroresAgregar, cant_comprada: ''}) }}
                className={inputClass(erroresAgregar.cant_comprada)}/>
            </Campo>

            <Campo error={erroresAgregar.precio_compra}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Precio de compra total</label>
              <input type="number" min="0" value={formAgregar.precio_compra}
                onChange={e => { setFormAgregar({...formAgregar, precio_compra: e.target.value}); setErroresAgregar({...erroresAgregar, precio_compra: ''}) }}
                className={inputClass(erroresAgregar.precio_compra)}/>
            </Campo>

            <Campo error={erroresAgregar.cant_usada}>
              <label className="text-sm font-medium" style={{color: '#1565C0'}}>Cantidad usada en el producto</label>
              <input type="number" min="0" value={formAgregar.cant_usada}
                onChange={e => { setFormAgregar({...formAgregar, cant_usada: e.target.value}); setErroresAgregar({...erroresAgregar, cant_usada: ''}) }}
                className={inputClass(erroresAgregar.cant_usada)}/>
            </Campo>

            {/* Preview costo */}
            {formAgregar.cant_comprada > 0 && formAgregar.precio_compra > 0 && formAgregar.cant_usada > 0 && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-sm" style={{color: '#1565C0'}}>
                📊 Costo proporcional: <strong>
                  {clp((formAgregar.cant_usada / formAgregar.cant_comprada) * formAgregar.precio_compra)}
                </strong>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setModalAgregarIng(null)}
                className="flex-1 py-3 rounded-xl font-semibold border-2 border-sky-200 text-gray-600 hover:bg-sky-50 transition-all">
                Cancelar
              </button>
              <button onClick={guardarNuevoIngrediente} disabled={cargando}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
                {cargando ? '⏳ Agregando...' : '➕ Agregar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ MODAL CONFIRMAR ELIMINACIÓN ══ */}
      {modalConfirmDelete && (
        <Modal titulo="⚠️ Confirmar eliminación" onCerrar={() => setModalConfirmDelete(null)}>
          <div className="text-center">
            <div className="text-6xl mb-4">🗑️</div>
            <p className="text-gray-600 mb-2">¿Estás seguro que deseas eliminar:</p>
            <p className="font-bold text-lg mb-1" style={{color: '#1565C0'}}>
              "{modalConfirmDelete.nombre}"
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {modalConfirmDelete.tipo === 'producto'
                ? '⚠️ Se eliminarán también todos sus ingredientes.'
                : 'El costo del producto se recalculará automáticamente.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl font-semibold border-2 border-sky-200 text-gray-600 hover:bg-sky-50 transition-all">
                Cancelar
              </button>
              <button onClick={confirmarEliminacion} disabled={cargando}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50">
                {cargando ? '⏳ Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Recetas
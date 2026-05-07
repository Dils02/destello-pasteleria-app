import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api'
})

// ── Productos ──
export const getProductos      = ()         => api.get('/productos/')
export const createProducto    = (data)     => api.post('/productos/', data)
export const deleteProducto    = (id)       => api.delete(`/productos/${id}/`)

// ── Ingredientes ──
export const addIngrediente    = (id, data) => api.post(`/productos/${id}/agregar_ingrediente/`, data)
export const updateIngrediente = (id, data) => api.patch(`/ingredientes/${id}/`, data)
export const deleteIngrediente = (id)       => api.delete(`/ingredientes/${id}/`)

// ── Ventas ──
export const getVentas         = ()         => api.get('/ventas/')
export const createVenta       = (data)     => api.post('/ventas/', data)
export const deleteVenta       = (id)       => api.delete(`/ventas/${id}/`)

// ── Pedidos ──
export const getPedidos        = ()         => api.get('/pedidos/')
export const createPedido      = (data)     => api.post('/pedidos/', data)
export const deletePedido      = (id)       => api.delete(`/pedidos/${id}/`)
export const cambiarEstado     = (id, estado) => api.patch(`/pedidos/${id}/cambiar_estado/`, { estado })

export default api
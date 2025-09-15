// inventario.js - Módulo de gestión de inventario

let productos = [] // Declare productos array
const mostrarAlerta = (mensaje, tipo) => {
  console.log(`Alerta (${tipo}): ${mensaje}`)
} // Declare mostrarAlerta function

const generarId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5) // Declare generarId function

const guardarDatos = () => {
  localStorage.setItem("productos", JSON.stringify(productos))
} // Declare guardarDatos function

const formatearMoneda = (valor) => `$${valor.toFixed(2)}` // Declare formatearMoneda function

function getInventarioHTML() {
  return `
        <div class="grid grid-2">
            <div class="form-container">
                <h2>Agregar Producto</h2>
                <form id="form-producto" onsubmit="agregarProducto(event)">
                    <div class="form-group">
                        <label for="producto-nombre">Nombre del Producto *</label>
                        <input type="text" id="producto-nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="producto-precio">Precio *</label>
                        <input type="number" id="producto-precio" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="producto-stock">Stock Inicial *</label>
                        <input type="number" id="producto-stock" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="producto-stock-minimo">Stock Mínimo *</label>
                        <input type="number" id="producto-stock-minimo" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="producto-categoria">Categoría</label>
                        <select id="producto-categoria">
                            <option value="Comida">Comida</option>
                            <option value="Bebida">Bebida</option>
                            <option value="Postre">Postre</option>
                            <option value="Snack">Snack</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Agregar Producto</button>
                    <button type="button" class="btn btn-secondary" onclick="limpiarFormularioProducto()">Limpiar</button>
                </form>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Resumen de Inventario</h2>
                </div>
                <div id="resumen-inventario">
                    <!-- El resumen se cargará aquí -->
                </div>
            </div>
        </div>
        
        <div class="table-container" style="margin-top: 2rem;">
            <h2 style="padding: 1rem; margin: 0; background: #f8f9fa; color: #2d5a27;">Lista de Productos</h2>
            <div id="tabla-productos">
                <!-- La tabla se cargará aquí -->
            </div>
        </div>
    `
}

function inicializarInventario() {
  console.log("Inicializando módulo Inventario")
  cargarTablaProductos()
  cargarResumenInventario()

  // Load saved products from localStorage
  const savedProductos = localStorage.getItem("productos")
  if (savedProductos) {
    productos = JSON.parse(savedProductos)
  }
}

function agregarProducto(event) {
  event.preventDefault()

  const nombre = document.getElementById("producto-nombre").value.trim()
  const precio = Number.parseFloat(document.getElementById("producto-precio").value)
  const stock = Number.parseInt(document.getElementById("producto-stock").value)
  const stockMinimo = Number.parseInt(document.getElementById("producto-stock-minimo").value)
  const categoria = document.getElementById("producto-categoria").value

  if (!nombre || precio < 0 || stock < 0 || stockMinimo < 0) {
    mostrarAlerta("Por favor completa todos los campos correctamente", "danger")
    return
  }

  // Verificar si el producto ya existe
  const productoExistente = productos.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase())
  if (productoExistente) {
    mostrarAlerta("Ya existe un producto con ese nombre", "warning")
    return
  }

  const nuevoProducto = {
    id: generarId(),
    nombre: nombre,
    precio: precio,
    stock: stock,
    stock_minimo: stockMinimo,
    categoria: categoria,
    fechaCreacion: new Date().toISOString(),
  }

  productos.push(nuevoProducto)
  guardarDatos()

  // Actualizar interfaz
  cargarTablaProductos()
  cargarResumenInventario()
  limpiarFormularioProducto()

  mostrarAlerta(`Producto "${nombre}" agregado correctamente`, "success")
}

function limpiarFormularioProducto() {
  document.getElementById("form-producto").reset()
}

function cargarTablaProductos() {
  const tablaProductos = document.getElementById("tabla-productos")

  if (productos.length === 0) {
    tablaProductos.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p>No hay productos registrados</p>
            </div>
        `
    return
  }

  tablaProductos.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Stock Mínimo</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productos
                  .map((producto) => {
                    let claseStock = ""
                    let estadoStock = "Normal"

                    if (producto.stock === 0) {
                      claseStock = "stock-critical"
                      estadoStock = "Sin Stock"
                    } else if (producto.stock <= producto.stock_minimo) {
                      claseStock = "stock-low"
                      estadoStock = "Stock Bajo"
                    }

                    return `
                        <tr class="${claseStock}">
                            <td><strong>${producto.nombre}</strong></td>
                            <td>${formatearMoneda(producto.precio)}</td>
                            <td>${producto.stock}</td>
                            <td>${producto.stock_minimo}</td>
                            <td>${producto.categoria}</td>
                            <td>${estadoStock}</td>
                            <td>
                                <button class="btn btn-secondary" onclick="ajustarStock('${producto.id}', -1)" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">-1</button>
                                <button class="btn" onclick="ajustarStock('${producto.id}', 1)" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">+1</button>
                                <button class="btn" onclick="ajustarStock('${producto.id}', 10)" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">+10</button>
                                <button class="btn btn-danger" onclick="eliminarProducto('${producto.id}')" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">Eliminar</button>
                            </td>
                        </tr>
                    `
                  })
                  .join("")}
            </tbody>
        </table>
    `
}

function cargarResumenInventario() {
  const resumenInventario = document.getElementById("resumen-inventario")

  const totalProductos = productos.length
  const productosStockBajo = productos.filter((p) => p.stock <= p.stock_minimo && p.stock > 0).length
  const productosSinStock = productos.filter((p) => p.stock === 0).length
  const valorTotalInventario = productos.reduce((total, p) => total + p.precio * p.stock, 0)

  resumenInventario.innerHTML = `
        <div class="grid grid-2">
            <div class="card">
                <h3>Total Productos</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #4a7c59;">${totalProductos}</p>
            </div>
            <div class="card">
                <h3>Valor Total Inventario</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #4a7c59;">${formatearMoneda(valorTotalInventario)}</p>
            </div>
            <div class="card ${productosStockBajo > 0 ? "stock-low" : ""}">
                <h3>Stock Bajo</h3>
                <p style="font-size: 2rem; font-weight: bold;">${productosStockBajo}</p>
            </div>
            <div class="card ${productosSinStock > 0 ? "stock-critical" : ""}">
                <h3>Sin Stock</h3>
                <p style="font-size: 2rem; font-weight: bold;">${productosSinStock}</p>
            </div>
        </div>
    `
}

function ajustarStock(productoId, cantidad) {
  const producto = productos.find((p) => p.id === productoId)
  if (!producto) return

  const nuevoStock = producto.stock + cantidad
  if (nuevoStock < 0) {
    mostrarAlerta("El stock no puede ser negativo", "warning")
    return
  }

  producto.stock = nuevoStock
  guardarDatos()

  cargarTablaProductos()
  cargarResumenInventario()

  mostrarAlerta(`Stock de "${producto.nombre}" actualizado`, "success")
}

function eliminarProducto(productoId) {
  const producto = productos.find((p) => p.id === productoId)
  if (!producto) return

  if (!confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
    return
  }

  productos = productos.filter((p) => p.id !== productoId)
  guardarDatos()

  cargarTablaProductos()
  cargarResumenInventario()

  mostrarAlerta(`Producto "${producto.nombre}" eliminado`, "success")
}

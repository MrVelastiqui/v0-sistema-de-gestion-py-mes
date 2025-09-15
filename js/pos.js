// pos.js - Módulo del sistema POS

let carritoActual = []
const productos = [] // Declare productos variable
const ventas = [] // Declare ventas variable
const clientes = [] // Declare clientes variable

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(valor)
}

function mostrarAlerta(mensaje, tipo) {
  alert(`${tipo.toUpperCase()}: ${mensaje}`)
}

function generarId() {
  return "_" + Math.random().toString(36).substr(2, 9)
}

function getPOSHTML() {
  return `
        <div class="grid grid-2">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Productos Disponibles</h2>
                </div>
                <div id="productos-grid" class="grid grid-3">
                    <!-- Los productos se cargarán aquí -->
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Carrito de Compras</h2>
                </div>
                <div id="carrito-contenido">
                    <div id="carrito-items"></div>
                    <div id="carrito-total" class="card-header">
                        <strong>Total: €0.00</strong>
                    </div>
                    <div style="margin-top: 1rem;">
                        <input type="text" id="cliente-nombre" placeholder="Nombre del cliente (opcional)" class="form-group input" style="margin-bottom: 1rem; width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <button class="btn" onclick="procesarVenta()" id="btn-procesar-venta" disabled>
                            Procesar Venta
                        </button>
                        <button class="btn btn-secondary" onclick="limpiarCarrito()">
                            Limpiar Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
}

function inicializarPOS() {
  console.log("Inicializando módulo POS")
  carritoActual = []
  cargarProductosPOS()
  actualizarCarrito()
}

function cargarProductosPOS() {
  const productosGrid = document.getElementById("productos-grid")

  if (productos.length === 0) {
    productosGrid.innerHTML = `
            <div class="alert alert-warning">
                No hay productos disponibles. Ve al módulo de Inventario para agregar productos.
            </div>
        `
    return
  }

  productosGrid.innerHTML = productos
    .filter((producto) => producto.stock > 0)
    .map(
      (producto) => `
            <div class="card" style="cursor: pointer; transition: transform 0.2s;" 
                 onclick="agregarAlCarrito('${producto.id}')"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <h3>${producto.nombre}</h3>
                <p><strong>${formatearMoneda(producto.precio)}</strong></p>
                <p>Stock: ${producto.stock}</p>
                <p class="btn" style="margin: 0; padding: 0.5rem; text-align: center;">
                    Agregar al Carrito
                </p>
            </div>
        `,
    )
    .join("")
}

function agregarAlCarrito(productoId) {
  const producto = productos.find((p) => p.id === productoId)
  if (!producto || producto.stock <= 0) {
    mostrarAlerta("Producto no disponible", "danger")
    return
  }

  const itemExistente = carritoActual.find((item) => item.id === productoId)

  if (itemExistente) {
    if (itemExistente.cantidad < producto.stock) {
      itemExistente.cantidad++
    } else {
      mostrarAlerta("No hay suficiente stock", "warning")
      return
    }
  } else {
    carritoActual.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
    })
  }

  actualizarCarrito()
  mostrarAlerta(`${producto.nombre} agregado al carrito`, "success")
}

function actualizarCarrito() {
  const carritoItems = document.getElementById("carrito-items")
  const carritoTotal = document.getElementById("carrito-total")
  const btnProcesar = document.getElementById("btn-procesar-venta")

  if (carritoActual.length === 0) {
    carritoItems.innerHTML = "<p>El carrito está vacío</p>"
    carritoTotal.innerHTML = "<strong>Total: €0.00</strong>"
    btnProcesar.disabled = true
    return
  }

  const total = carritoActual.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  carritoItems.innerHTML = carritoActual
    .map(
      (item) => `
        <div class="card" style="margin-bottom: 0.5rem; padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${item.nombre}</strong><br>
                    ${formatearMoneda(item.precio)} x ${item.cantidad}
                </div>
                <div>
                    <button class="btn btn-secondary" onclick="cambiarCantidad('${item.id}', -1)" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">-</button>
                    <span style="margin: 0 0.5rem;">${item.cantidad}</span>
                    <button class="btn btn-secondary" onclick="cambiarCantidad('${item.id}', 1)" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">+</button>
                    <button class="btn btn-danger" onclick="eliminarDelCarrito('${item.id}')" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">×</button>
                </div>
            </div>
            <div style="text-align: right; margin-top: 0.5rem;">
                <strong>${formatearMoneda(item.precio * item.cantidad)}</strong>
            </div>
        </div>
    `,
    )
    .join("")

  carritoTotal.innerHTML = `<strong>Total: ${formatearMoneda(total)}</strong>`
  btnProcesar.disabled = false
}

function cambiarCantidad(productoId, cambio) {
  const item = carritoActual.find((item) => item.id === productoId)
  const producto = productos.find((p) => p.id === productoId)

  if (!item || !producto) return

  const nuevaCantidad = item.cantidad + cambio

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(productoId)
    return
  }

  if (nuevaCantidad > producto.stock) {
    mostrarAlerta("No hay suficiente stock", "warning")
    return
  }

  item.cantidad = nuevaCantidad
  actualizarCarrito()
}

function eliminarDelCarrito(productoId) {
  carritoActual = carritoActual.filter((item) => item.id !== productoId)
  actualizarCarrito()
}

function limpiarCarrito() {
  carritoActual = []
  document.getElementById("cliente-nombre").value = ""
  actualizarCarrito()
}

function procesarVenta() {
  if (carritoActual.length === 0) {
    mostrarAlerta("El carrito está vacío", "danger")
    return
  }

  const clienteNombre = document.getElementById("cliente-nombre").value.trim()
  const total = carritoActual.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  // Crear registro de venta
  const venta = {
    id: generarId(),
    fecha: new Date().toISOString(),
    cliente: clienteNombre || "Cliente Anónimo",
    items: [...carritoActual],
    total: total,
  }

  // Actualizar stock de productos
  carritoActual.forEach((item) => {
    const producto = productos.find((p) => p.id === item.id)
    if (producto) {
      producto.stock -= item.cantidad
    }
  })

  // Guardar venta
  ventas.push(venta)

  // Actualizar cliente si se proporcionó nombre
  if (clienteNombre) {
    const cliente = clientes.find((c) => c.nombre.toLowerCase() === clienteNombre.toLowerCase())
    if (cliente) {
      cliente.compras.push(venta.id)
      cliente.totalCompras += total
      cliente.ultimaCompra = venta.fecha
    } else {
      clientes.push({
        id: generarId(),
        nombre: clienteNombre,
        telefono: "",
        email: "",
        compras: [venta.id],
        totalCompras: total,
        ultimaCompra: venta.fecha,
        fechaRegistro: venta.fecha,
      })
    }
  }

  // Guardar datos
  guardarDatos()

  // Limpiar carrito
  limpiarCarrito()

  // Recargar productos (para actualizar stock)
  cargarProductosPOS()

  mostrarAlerta(`Venta procesada correctamente. Total: ${formatearMoneda(total)}`, "success")
}

function guardarDatos() {
  // Implementación de guardarDatos
  localStorage.setItem("productos", JSON.stringify(productos))
  localStorage.setItem("ventas", JSON.stringify(ventas))
  localStorage.setItem("clientes", JSON.stringify(clientes))
}

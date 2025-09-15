// clientes.js - Módulo de gestión de clientes

let clientes = []
let ventas = []

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function guardarDatos() {
  localStorage.setItem("clientes", JSON.stringify(clientes))
  localStorage.setItem("ventas", JSON.stringify(ventas))
}

function mostrarAlerta(mensaje, tipo) {
  const alerta = document.createElement("div")
  alerta.className = `alert alert-${tipo}`
  alerta.textContent = mensaje
  document.body.appendChild(alerta)
  setTimeout(() => alerta.remove(), 3000)
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(valor)
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getClientesHTML() {
  return `
        <div class="grid grid-2">
            <div class="form-container">
                <h2>Registrar Cliente</h2>
                <form id="form-cliente" onsubmit="agregarCliente(event)">
                    <div class="form-group">
                        <label for="cliente-nombre">Nombre *</label>
                        <input type="text" id="cliente-nombre" placeholder="Nombre completo del cliente" required>
                    </div>
                    <div class="form-group">
                        <label for="cliente-telefono">Teléfono</label>
                        <input type="tel" id="cliente-telefono" placeholder="Número de teléfono">
                    </div>
                    <div class="form-group">
                        <label for="cliente-email">Email</label>
                        <input type="email" id="cliente-email" placeholder="correo@ejemplo.com">
                    </div>
                    <button type="submit" class="btn">Registrar Cliente</button>
                    <button type="button" class="btn btn-secondary" onclick="limpiarFormularioCliente()">Limpiar</button>
                </form>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Buscar Cliente</h2>
                </div>
                <div class="form-group">
                    <input type="text" id="buscar-cliente" placeholder="Buscar por nombre o teléfono..." 
                           onkeyup="buscarClientes()" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px;">
                </div>
                <div id="resumen-clientes">
                    <!-- El resumen se cargará aquí -->
                </div>
            </div>
        </div>
        
        <div class="table-container" style="margin-top: 2rem;">
            <h2 style="padding: 1rem; margin: 0; background: #f8f9fa; color: #2d5a27;">Lista de Clientes</h2>
            <div id="tabla-clientes">
                <!-- La tabla se cargará aquí -->
            </div>
        </div>
        
        <!-- Modal para historial de compras -->
        <div id="modal-historial" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div class="card" style="width: 90%; max-width: 800px; max-height: 90%; overflow-y: auto;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 class="card-title" id="modal-titulo">Historial de Compras</h2>
                    <button class="btn btn-secondary" onclick="cerrarModalHistorial()" style="padding: 0.5rem 1rem;">×</button>
                </div>
                <div id="modal-contenido">
                    <!-- El contenido se cargará aquí -->
                </div>
            </div>
        </div>
    `
}

function inicializarClientes() {
  console.log("Inicializando módulo Clientes")
  clientes = JSON.parse(localStorage.getItem("clientes")) || []
  ventas = JSON.parse(localStorage.getItem("ventas")) || []
  cargarTablaClientes()
  cargarResumenClientes()
}

function agregarCliente(event) {
  event.preventDefault()

  const nombre = document.getElementById("cliente-nombre").value.trim()
  const telefono = document.getElementById("cliente-telefono").value.trim()
  const email = document.getElementById("cliente-email").value.trim()

  if (!nombre) {
    mostrarAlerta("El nombre del cliente es requerido", "danger")
    return
  }

  // Verificar si el cliente ya existe
  const clienteExistente = clientes.find(
    (c) =>
      c.nombre.toLowerCase() === nombre.toLowerCase() ||
      (telefono && c.telefono === telefono) ||
      (email && c.email.toLowerCase() === email.toLowerCase()),
  )

  if (clienteExistente) {
    mostrarAlerta("Ya existe un cliente con esos datos", "warning")
    return
  }

  const nuevoCliente = {
    id: generarId(),
    nombre: nombre,
    telefono: telefono,
    email: email,
    compras: [],
    totalCompras: 0,
    ultimaCompra: null,
    fechaRegistro: new Date().toISOString(),
  }

  clientes.push(nuevoCliente)
  guardarDatos()

  // Actualizar interfaz
  cargarTablaClientes()
  cargarResumenClientes()
  limpiarFormularioCliente()

  mostrarAlerta(`Cliente "${nombre}" registrado correctamente`, "success")
}

function limpiarFormularioCliente() {
  document.getElementById("form-cliente").reset()
}

function cargarTablaClientes(clientesFiltrados = null) {
  const tablaClientes = document.getElementById("tabla-clientes")
  const clientesAMostrar = clientesFiltrados || clientes

  if (clientesAMostrar.length === 0) {
    tablaClientes.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p>${clientesFiltrados ? "No se encontraron clientes" : "No hay clientes registrados"}</p>
            </div>
        `
    return
  }

  // Ordenar clientes por fecha de registro (más recientes primero)
  const clientesOrdenados = [...clientesAMostrar].sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro))

  tablaClientes.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Total Compras</th>
                    <th>Núm. Compras</th>
                    <th>Última Compra</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${clientesOrdenados
                  .map(
                    (cliente) => `
                    <tr>
                        <td><strong>${cliente.nombre}</strong></td>
                        <td>${cliente.telefono || "-"}</td>
                        <td>${cliente.email || "-"}</td>
                        <td><strong>${formatearMoneda(cliente.totalCompras)}</strong></td>
                        <td>${cliente.compras.length}</td>
                        <td>${cliente.ultimaCompra ? formatearFecha(cliente.ultimaCompra) : "Nunca"}</td>
                        <td>
                            <button class="btn" onclick="verHistorialCompras('${cliente.id}')" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">
                                Ver Historial
                            </button>
                            <button class="btn btn-danger" onclick="eliminarCliente('${cliente.id}')" style="padding: 0.25rem 0.5rem; margin: 0.1rem;">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `
}

function cargarResumenClientes() {
  const resumenClientes = document.getElementById("resumen-clientes")

  const totalClientes = clientes.length
  const clientesConCompras = clientes.filter((c) => c.compras.length > 0).length
  const promedioComprasPorCliente =
    totalClientes > 0 ? (clientes.reduce((total, c) => total + c.compras.length, 0) / totalClientes).toFixed(1) : 0

  // Cliente más frecuente
  const clienteMasFrecuente =
    clientes.length > 0 ? clientes.reduce((a, b) => (a.compras.length > b.compras.length ? a : b)) : null

  resumenClientes.innerHTML = `
        <div class="grid grid-2">
            <div class="card">
                <h3>Total Clientes</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #4a7c59;">${totalClientes}</p>
            </div>
            <div class="card">
                <h3>Con Compras</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #4a7c59;">${clientesConCompras}</p>
            </div>
            <div class="card">
                <h3>Promedio Compras</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #4a7c59;">${promedioComprasPorCliente}</p>
            </div>
            <div class="card">
                <h3>Más Frecuente</h3>
                <p style="font-size: 1rem; font-weight: bold; color: #4a7c59;">
                    ${clienteMasFrecuente ? clienteMasFrecuente.nombre : "N/A"}
                </p>
                ${clienteMasFrecuente ? `<p>${clienteMasFrecuente.compras.length} compras</p>` : ""}
            </div>
        </div>
    `
}

function buscarClientes() {
  const termino = document.getElementById("buscar-cliente").value.toLowerCase().trim()

  if (!termino) {
    cargarTablaClientes()
    return
  }

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(termino) ||
      cliente.telefono.includes(termino) ||
      cliente.email.toLowerCase().includes(termino),
  )

  cargarTablaClientes(clientesFiltrados)
}

function verHistorialCompras(clienteId) {
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  const ventasDelCliente = ventas.filter((v) => cliente.compras.includes(v.id))

  document.getElementById("modal-titulo").textContent = `Historial de Compras - ${cliente.nombre}`

  const modalContenido = document.getElementById("modal-contenido")

  if (ventasDelCliente.length === 0) {
    modalContenido.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p>Este cliente no tiene compras registradas</p>
            </div>
        `
  } else {
    // Ordenar ventas por fecha (más recientes primero)
    const ventasOrdenadas = [...ventasDelCliente].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    modalContenido.innerHTML = `
            <div style="padding: 1rem;">
                <div class="grid grid-3" style="margin-bottom: 2rem;">
                    <div class="card">
                        <h4>Total Compras</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #4a7c59;">${formatearMoneda(cliente.totalCompras)}</p>
                    </div>
                    <div class="card">
                        <h4>Número de Compras</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #4a7c59;">${ventasDelCliente.length}</p>
                    </div>
                    <div class="card">
                        <h4>Compra Promedio</h4>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #4a7c59;">
                            ${formatearMoneda(cliente.totalCompras / ventasDelCliente.length)}
                        </p>
                    </div>
                </div>
                
                <h3>Historial de Compras</h3>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${ventasOrdenadas
                      .map(
                        (venta) => `
                        <div class="card" style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <strong>${formatearFecha(venta.fecha)}</strong>
                                <strong>${formatearMoneda(venta.total)}</strong>
                            </div>
                            <div>
                                <h4>Productos:</h4>
                                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                                    ${venta.items
                                      .map(
                                        (item) => `
                                        <li>${item.nombre} x${item.cantidad} - ${formatearMoneda(item.precio * item.cantidad)}</li>
                                    `,
                                      )
                                      .join("")}
                                </ul>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `
  }

  document.getElementById("modal-historial").classList.remove("hidden")
}

function cerrarModalHistorial() {
  document.getElementById("modal-historial").classList.add("hidden")
}

function eliminarCliente(clienteId) {
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return

  if (!confirm(`¿Estás seguro de eliminar el cliente "${cliente.nombre}"?`)) {
    return
  }

  clientes = clientes.filter((c) => c.id !== clienteId)
  guardarDatos()

  cargarTablaClientes()
  cargarResumenClientes()

  mostrarAlerta(`Cliente "${cliente.nombre}" eliminado`, "success")
}

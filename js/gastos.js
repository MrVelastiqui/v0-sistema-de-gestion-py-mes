// gastos.js - Módulo de gestión de gastos

let expenses = [] // Declare the expenses variable

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5) // Declare the generarId function
}

function mostrarAlerta(mensaje, tipo) {
  alert(mensaje) // Declare the mostrarAlerta function
}

function formatearMoneda(monto) {
  return monto.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) // Declare the formatearMoneda function
}

function formatearFecha(fecha) {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return new Date(fecha).toLocaleDateString("es-ES", options) // Declare the formatearFecha function
}

function getGastosHTML() {
  return `
        <div class="grid grid-2">
            <div class="form-container">
                <h2>Nuevo Gasto</h2>
                <form id="form-gasto" onsubmit="agregarGasto(event)">
                    <div class="form-group">
                        <label for="gasto-fecha">Fecha *</label>
                        <input type="date" id="gasto-fecha" required>
                    </div>
                    <div class="form-group">
                        <label for="gasto-concepto">Concepto *</label>
                        <input type="text" id="gasto-concepto" placeholder="Descripción del gasto" required>
                    </div>
                    <div class="form-group">
                        <label for="gasto-monto">Monto *</label>
                        <input type="number" id="gasto-monto" step="0.01" min="0" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="gasto-categoria">Categoría *</label>
                        <select id="gasto-categoria" required>
                            <option value="">Seleccionar categoría</option>
                            <option value="Ingredientes">Ingredientes</option>
                            <option value="Alquiler">Alquiler</option>
                            <option value="Servicios">Servicios (luz, agua, gas)</option>
                            <option value="Suministros">Suministros</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Transporte">Transporte</option>
                            <option value="Equipamiento">Equipamiento</option>
                            <option value="Personal">Personal</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="gasto-notas">Notas</label>
                        <textarea id="gasto-notas" rows="3" placeholder="Notas adicionales (opcional)"></textarea>
                    </div>
                    <button type="submit" class="btn">Registrar Gasto</button>
                    <button type="button" class="btn btn-secondary" onclick="limpiarFormularioGasto()">Limpiar</button>
                </form>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Resumen de Gastos</h2>
                </div>
                <div id="resumen-gastos">
                    <!-- El resumen se cargará aquí -->
                </div>
            </div>
        </div>
        
        <div class="table-container" style="margin-top: 2rem;">
            <h2 style="padding: 1rem; margin: 0; background: #f8f9fa; color: #2d5a27;">Historial de Gastos</h2>
            <div id="tabla-gastos">
                <!-- La tabla se cargará aquí -->
            </div>
        </div>
    `
}

function inicializarGastos() {
  console.log("Inicializando módulo Gastos")

  // Cargar datos desde localStorage
  const storedExpenses = localStorage.getItem("expenses")
  if (storedExpenses) {
    expenses = JSON.parse(storedExpenses)
  }

  // Establecer fecha actual por defecto
  const fechaInput = document.getElementById("gasto-fecha")
  if (fechaInput) {
    fechaInput.value = new Date().toISOString().split("T")[0]
  }

  cargarTablaGastos()
  cargarResumenGastos()
}

function agregarGasto(event) {
  event.preventDefault()

  const fecha = document.getElementById("gasto-fecha").value
  const concepto = document.getElementById("gasto-concepto").value.trim()
  const monto = Number.parseFloat(document.getElementById("gasto-monto").value)
  const categoria = document.getElementById("gasto-categoria").value
  const notas = document.getElementById("gasto-notas").value.trim()

  if (!fecha || !concepto || !monto || monto <= 0 || !categoria) {
    mostrarAlerta("Por favor completa todos los campos requeridos", "danger")
    return
  }

  const nuevoGasto = {
    id: generarId(),
    fecha: fecha,
    concepto: concepto,
    monto: monto,
    categoria: categoria,
    notas: notas,
    fechaCreacion: new Date().toISOString(),
  }

  expenses.push(nuevoGasto) // Use expenses array instead of gastos
  guardarDatos()

  // Actualizar interfaz
  cargarTablaGastos()
  cargarResumenGastos()
  limpiarFormularioGasto()

  mostrarAlerta(`Gasto registrado: ${concepto} - ${formatearMoneda(monto)}`, "success")
}

function limpiarFormularioGasto() {
  document.getElementById("form-gasto").reset()
  // Restablecer fecha actual
  document.getElementById("gasto-fecha").value = new Date().toISOString().split("T")[0]
}

function cargarTablaGastos() {
  const tablaGastos = document.getElementById("tabla-gastos")

  if (expenses.length === 0) {
    // Use expenses array instead of gastos
    tablaGastos.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p>No hay gastos registrados</p>
            </div>
        `
    return
  }

  // Ordenar gastos por fecha (más recientes primero)
  const gastosOrdenados = [...expenses].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // Use expenses array

  tablaGastos.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Categoría</th>
                    <th>Monto</th>
                    <th>Notas</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${gastosOrdenados
                  .map(
                    (gasto) => `
                    <tr>
                        <td>${formatearFecha(gasto.fecha)}</td>
                        <td><strong>${gasto.concepto}</strong></td>
                        <td><span class="badge">${gasto.categoria}</span></td>
                        <td><strong>${formatearMoneda(gasto.monto)}</strong></td>
                        <td>${gasto.notas || "-"}</td>
                        <td>
                            <button class="btn btn-danger" onclick="eliminarGasto('${gasto.id}')" style="padding: 0.25rem 0.5rem;">
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

function cargarResumenGastos() {
  const resumenGastos = document.getElementById("resumen-gastos")

  const totalGastos = expenses.reduce((total, gasto) => total + gasto.monto, 0) // Use expenses array
  const totalRegistros = expenses.length // Use expenses array

  // Gastos del mes actual
  const fechaActual = new Date()
  const gastosDelMes = expenses.filter((gasto) => {
    // Use expenses array
    const fechaGasto = new Date(gasto.fecha)
    return fechaGasto.getMonth() === fechaActual.getMonth() && fechaGasto.getFullYear() === fechaActual.getFullYear()
  })
  const totalGastosDelMes = gastosDelMes.reduce((total, gasto) => total + gasto.monto, 0)

  // Categoría con más gastos
  const gastosPorCategoria = {}
  expenses.forEach((gasto) => {
    // Use expenses array
    gastosPorCategoria[gasto.categoria] = (gastosPorCategoria[gasto.categoria] || 0) + gasto.monto
  })

  const categoriaMayorGasto =
    Object.keys(gastosPorCategoria).length > 0
      ? Object.keys(gastosPorCategoria).reduce((a, b) => (gastosPorCategoria[a] > gastosPorCategoria[b] ? a : b))
      : "N/A"

  resumenGastos.innerHTML = `
        <div class="grid grid-2">
            <div class="card">
                <h3>Total Gastos</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #dc3545;">${formatearMoneda(totalGastos)}</p>
            </div>
            <div class="card">
                <h3>Gastos del Mes</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #dc3545;">${formatearMoneda(totalGastosDelMes)}</p>
            </div>
            <div class="card">
                <h3>Total Registros</h3>
                <p style="font-size: 2rem; font-weight: bold; color: #4a7c59;">${totalRegistros}</p>
            </div>
            <div class="card">
                <h3>Mayor Categoría</h3>
                <p style="font-size: 1.2rem; font-weight: bold; color: #4a7c59;">${categoriaMayorGasto}</p>
                ${categoriaMayorGasto !== "N/A" ? `<p>${formatearMoneda(gastosPorCategoria[categoriaMayorGasto])}</p>` : ""}
            </div>
        </div>
    `
}

function eliminarGasto(gastoId) {
  const gasto = expenses.find((g) => g.id === gastoId) // Use expenses array
  if (!gasto) return

  if (!confirm(`¿Estás seguro de eliminar el gasto "${gasto.concepto}"?`)) {
    return
  }

  expenses = expenses.filter((g) => g.id !== gastoId) // Use expenses array
  guardarDatos()

  cargarTablaGastos()
  cargarResumenGastos()

  mostrarAlerta(`Gasto "${gasto.concepto}" eliminado`, "success")
}

function guardarDatos() {
  localStorage.setItem("expenses", JSON.stringify(expenses)) // Save to expenses key in localStorage
}

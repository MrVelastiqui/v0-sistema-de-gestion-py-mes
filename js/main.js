// main.js - Inicialización y navegación principal

// Variables globales para almacenamiento
let productos = []
let gastos = []
let clientes = []
let ventas = []

// Funciones para generar HTML de cada módulo
function getPOSHTML() {
  return "<h2>Punto de Venta</h2>"
}

function getInventarioHTML() {
  return "<h2>Inventario</h2>"
}

function getGastosHTML() {
  return "<h2>Gastos</h2>"
}

function getClientesHTML() {
  return "<h2>Clientes</h2>"
}

// Funciones de inicialización para cada módulo
function inicializarPOS() {
  console.log("Inicializando POS")
}

function inicializarInventario() {
  console.log("Inicializando Inventario")
}

function inicializarGastos() {
  console.log("Inicializando Gastos")
}

function inicializarClientes() {
  console.log("Inicializando Clientes")
}

// Inicialización del sistema
document.addEventListener("DOMContentLoaded", () => {
  console.log("Sistema PyME iniciado")

  // Cargar datos desde localStorage
  cargarDatos()

  // Configurar navegación
  configurarNavegacion()

  // Cargar módulo inicial (POS)
  cargarModulo("pos")
})

// Función para cargar datos desde localStorage
function cargarDatos() {
  try {
    productos = JSON.parse(localStorage.getItem("productos")) || []
    gastos = JSON.parse(localStorage.getItem("gastos")) || []
    clientes = JSON.parse(localStorage.getItem("clientes")) || []
    ventas = JSON.parse(localStorage.getItem("ventas")) || []

    console.log("Datos cargados:", { productos: productos.length, gastos: gastos.length, clientes: clientes.length })
  } catch (error) {
    console.error("Error cargando datos:", error)
    mostrarAlerta("Error cargando datos del sistema", "danger")
  }
}

// Función para guardar datos en localStorage
function guardarDatos() {
  try {
    localStorage.setItem("productos", JSON.stringify(productos))
    localStorage.setItem("gastos", JSON.stringify(gastos))
    localStorage.setItem("clientes", JSON.stringify(clientes))
    localStorage.setItem("ventas", JSON.stringify(ventas))
    console.log("Datos guardados correctamente")
  } catch (error) {
    console.error("Error guardando datos:", error)
    mostrarAlerta("Error guardando datos", "danger")
  }
}

// Configurar navegación entre módulos
function configurarNavegacion() {
  const navButtons = document.querySelectorAll(".nav-btn")

  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modulo = this.getAttribute("data-module")

      // Actualizar botones activos
      navButtons.forEach((btn) => btn.classList.remove("active"))
      this.classList.add("active")

      // Cargar módulo
      cargarModulo(modulo)
    })
  })
}

// Función para cargar módulos dinámicamente
function cargarModulo(modulo) {
  const mainContent = document.getElementById("main-content")

  switch (modulo) {
    case "pos":
      mainContent.innerHTML = getPOSHTML()
      if (typeof inicializarPOS === "function") {
        inicializarPOS()
      }
      break
    case "inventario":
      mainContent.innerHTML = getInventarioHTML()
      if (typeof inicializarInventario === "function") {
        inicializarInventario()
      }
      break
    case "gastos":
      mainContent.innerHTML = getGastosHTML()
      if (typeof inicializarGastos === "function") {
        inicializarGastos()
      }
      break
    case "clientes":
      mainContent.innerHTML = getClientesHTML()
      if (typeof inicializarClientes === "function") {
        inicializarClientes()
      }
      break
    default:
      mainContent.innerHTML = "<h2>Módulo no encontrado</h2>"
  }
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = "success") {
  const alertaExistente = document.querySelector(".alert")
  if (alertaExistente) {
    alertaExistente.remove()
  }

  const alerta = document.createElement("div")
  alerta.className = `alert alert-${tipo}`
  alerta.textContent = mensaje

  const mainContent = document.getElementById("main-content")
  mainContent.insertBefore(alerta, mainContent.firstChild)

  // Remover alerta después de 3 segundos
  setTimeout(() => {
    if (alerta.parentNode) {
      alerta.remove()
    }
  }, 3000)
}

// Función para generar ID único
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Función para formatear fecha
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Función para formatear moneda
function formatearMoneda(cantidad) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cantidad)
}

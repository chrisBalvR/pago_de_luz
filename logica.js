// === VARIABLES DOM ===
const inputs = {
  monto: document.getElementById("monto"),
  anteriorA: document.getElementById("anteriorA"),
  actualA: document.getElementById("actualA"),
  consumoA: document.getElementById("consumoA"),
  anteriorB: document.getElementById("anteriorB"),
  actualB: document.getElementById("actualB"),
  consumoB: document.getElementById("consumoB"),
  anteriorC: document.getElementById("anteriorC"),
  actualC: document.getElementById("actualC"),
  consumoC: document.getElementById("consumoC"),
  calcular: document.getElementById("calcular")
};

const modal = document.getElementById("resultadoModal");
const modalBody = document.querySelector(".modal-body");
const cerrarModal = document.querySelector(".cerrar");

// === UTILIDADES ===
function calcularConsumo(anterior, actual) {
  const a = parseInt(anterior);
  const b = parseInt(actual);
  if (isNaN(a) || isNaN(b)) return 0;
  if (b < a) {
    alert("La lectura actual no puede ser menor que la anterior.");
    return null;
  }
  return b - a;
}

function redondearMonto(num) {
  return Math.round(num * 20) / 20; // redondea a múltiplos de 0.05
}

function formatearMoneda(valor) {
  return valor.toFixed(2);
}

function obtenerPeriodo() {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  const fecha = new Date();
  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();
  const inicio = meses[(mes - 1 + 12) % 12];
  const fin = meses[mes];
  return `${inicio} - ${fin} de ${anio}`;
}

function obtenerFechaHora() {
  const fecha = new Date();
  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }) + " - " + fecha.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

// === ACTUALIZAR CONSUMOS ===
function actualizarConsumos() {
  const consumoA = calcularConsumo(inputs.anteriorA.value, inputs.actualA.value);
  const consumoB = calcularConsumo(inputs.anteriorB.value, inputs.actualB.value);
  const consumoC = calcularConsumo(inputs.anteriorC.value, inputs.actualC.value);

  inputs.consumoA.value = consumoA !== null ? `${consumoA} kWh` : "";
  inputs.consumoB.value = consumoB !== null ? `${consumoB} kWh` : "";
  inputs.consumoC.value = consumoC !== null ? `${consumoC} kWh` : "";
}

["anteriorA", "actualA", "anteriorB", "actualB", "anteriorC", "actualC"].forEach(id => {
  inputs[id].addEventListener("input", actualizarConsumos);
});

// === FORMATEO AUTOMÁTICO DE MONTO

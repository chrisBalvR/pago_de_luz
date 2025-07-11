// Elementos del DOM
const formulario = document.getElementById('formulario');
const montoInput = document.getElementById('monto');
const anteriorA = document.getElementById('anteriorA');
const actualA = document.getElementById('actualA');
const consumoA = document.getElementById('consumoA');
const anteriorB = document.getElementById('anteriorB');
const actualB = document.getElementById('actualB');
const consumoB = document.getElementById('consumoB');
const anteriorC = document.getElementById('anteriorC');
const actualC = document.getElementById('actualC');
const consumoC = document.getElementById('consumoC');
const modal = document.getElementById('modal');
const periodoTexto = document.getElementById('periodo');
const fechaHora = document.getElementById('fechaHora');
const tablaResultados = document.getElementById('tablaResultados');
const cerrarModal = document.getElementById('cerrarModal');

// Autoformatear monto con 2 decimales
montoInput.addEventListener('blur', () => {
  let valor = parseFloat(montoInput.value);
  if (!isNaN(valor)) {
    montoInput.value = valor.toFixed(2);
  }
});

// Calcular consumo por medidor
function calcularConsumo(anterior, actual, campo) {
  const val1 = parseFloat(anterior.value);
  const val2 = parseFloat(actual.value);
  if (!isNaN(val1) && !isNaN(val2)) {
    const consumo = Math.max(val2 - val1, 0);
    const redondeado = Math.round(consumo);
    campo.value = `${redondeado} kWh consumidos`;
    return redondeado;
  }
  campo.value = "";
  return 0;
}

// Eventos para cálculos automáticos
[anteriorA, actualA].forEach(input => input.addEventListener('input', () => calcularConsumo(anteriorA, actualA, consumoA)));
[anteriorB, actualB].forEach(input => input.addEventListener('input', () => calcularConsumo(anteriorB, actualB, consumoB)));
[anteriorC, actualC].forEach(input => input.addEventListener('input', () => calcularConsumo(anteriorC, actualC, consumoC)));

// Cálculo del período automático
function obtenerPeriodoActual() {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const año = hoy.getFullYear();
  const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
  const añoPeriodo = mesActual === 0 ? año - 1 : año;
  return `${meses[mesAnterior]} - ${meses[mesActual]} de ${añoPeriodo}`;
}

function obtenerFechaHoraActual() {
  const hoy = new Date();
  return hoy.toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });
}

function redondearADecimo(valor) {
  return Math.round(valor * 10) / 10;
}

// Lógica principal del formulario
formulario.addEventListener('submit', (e) => {
  e.preventDefault();

  const total = parseFloat(montoInput.value);
  if (isNaN(total) || total <= 0) return alert("Ingrese un monto válido.");

  const consumoValores = {
    A: calcularConsumo(anteriorA, actualA, consumoA),
    B: calcularConsumo(anteriorB, actualB, consumoB),
    C: calcularConsumo(anteriorC, actualC, consumoC)
  };

  const sumaTotal = consumoValores.A + consumoValores.B + consumoValores.C;

  if (sumaTotal === 0) return alert("Todos los consumos son cero.");

  // Comisión tentativa de S/1 - considerando consumos redondeados
  const pagaA = consumoValores.A >= 2;
  const pagaB = consumoValores.B >= 2;
  let comisionTentativa = 1;
  let descuentoC = 0;

  if (pagaA && pagaB) descuentoC = comisionTentativa / 2;
  else if (pagaA || pagaB) descuentoC = comisionTentativa;

  // Reparto proporcional inicial
  const preliminar = {};
  let redondeado = {};
  let totalRedondeado = 0;

  for (let medidor in consumoValores) {
    const consumo = consumoValores[medidor];
    const porcentaje = consumo / sumaTotal;
    let pago = porcentaje * total;
    if (medidor === 'C') pago -= descuentoC;
    if (pago < 0) pago = 0;
    preliminar[medidor] = {
      consumo: consumo,
      porcentaje: (porcentaje * 100).toFixed(0),
      pagoReal: pago
    };
    redondeado[medidor] = redondearADecimo(pago);
    totalRedondeado += redondeado[medidor];
  }

  // Ajustar si hay diferencia para cuadrar con el monto total
  let diferencia = Math.round((total - totalRedondeado) * 100) / 100;

  if (diferencia !== 0) {
    const orden = Object.keys(preliminar).sort((a, b) => preliminar[b].pagoReal - preliminar[a].pagoReal);
    for (let medidor of orden) {
      let ajuste = redondearADecimo(redondeado[medidor] + diferencia);
      if (ajuste >= 0) {
        redondeado[medidor] = ajuste;
        break;
      }
    }
  }

  // Mostrar en tabla
  tablaResultados.innerHTML = "";
  for (let medidor of ['A', 'B', 'C']) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${medidor}</td>
      <td>${preliminar[medidor].consumo} kWh</td>
      <td>${preliminar[medidor].porcentaje} %</td>
      <td>S/ ${redondeado[medidor].toFixed(2)}</td>
    `;
    tablaResultados.appendChild(fila);
  }

  periodoTexto.textContent = obtenerPeriodoActual();
  fechaHora.textContent = obtenerFechaHoraActual();
  modal.classList.remove('oculto');
});

cerrarModal.addEventListener('click', () => {
  modal.classList.add('oculto');
});

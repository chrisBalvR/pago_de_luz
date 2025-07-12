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

// === FUNCIONES DE APOYO ===
function calcularConsumo(anterior, actual) {
  const consumo = parseInt(actual) - parseInt(anterior);
  return isNaN(consumo) || consumo < 0 ? 0 : consumo;
}

function redondearDosDecimales(num) {
  return Math.round(num * 100) / 100;
}

function obtenerPeriodoActual() {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const ahora = new Date();
  const mes = ahora.getMonth();
  const anio = ahora.getFullYear();
  const mesInicio = meses[(mes - 1 + 12) % 12];
  const mesFin = meses[mes];
  return `${mesInicio} - ${mesFin} de ${anio}`;
}

function obtenerFechaHora() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) + ' - ' + ahora.toLocaleTimeString('es-PE', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

// === EVENTOS DE CÁLCULO DE CONSUMO AUTOMÁTICO ===
['anteriorA','actualA','anteriorB','actualB','anteriorC','actualC'].forEach(id => {
  inputs[id].addEventListener('input', () => {
    const a = calcularConsumo(inputs.anteriorA.value, inputs.actualA.value);
    const b = calcularConsumo(inputs.anteriorB.value, inputs.actualB.value);
    const c = calcularConsumo(inputs.anteriorC.value, inputs.actualC.value);

    inputs.consumoA.value = a > 0 ? `${a} kWh` : '';
    inputs.consumoB.value = b > 0 ? `${b} kWh` : '';
    inputs.consumoC.value = c > 0 ? `${c} kWh` : '';
  });
});

// === EVENTO PRINCIPAL: CALCULAR PAGOS ===
inputs.calcular.addEventListener("click", function (e) {
  e.preventDefault();

  const montoTotal = parseFloat(inputs.monto.value);
  const consumo = {
    A: calcularConsumo(inputs.anteriorA.value, inputs.actualA.value),
    B: calcularConsumo(inputs.anteriorB.value, inputs.actualB.value),
    C: calcularConsumo(inputs.anteriorC.value, inputs.actualC.value),
  };

  const totalConsumo = consumo.A + consumo.B + consumo.C;

  if (totalConsumo === 0 || isNaN(montoTotal)) {
    alert("Por favor, ingresa datos válidos.");
    return;
  }

  // LÓGICA DE COMISIÓN
  let comision = 1; // valor tentativo base
  const elegibles = [consumo.A >= 2, consumo.B >= 2];
  const aportantes = elegibles.filter(Boolean).length;

  if (aportantes === 2) comision = 1;
  else if (aportantes === 1) comision = 1;
  else comision = 0;

  // DISTRIBUCIÓN DEL MONTO (incluyendo comisión)
  const montoSinComision = montoTotal - comision;
  const reparto = {};
  let acumulado = 0;
  ["A", "B"].forEach(key => {
    reparto[key] = consumo[key] > 0 ? redondearDosDecimales((consumo[key] / totalConsumo) * montoSinComision) : 0;
    acumulado += reparto[key];
  });
  // Medidor C paga el resto
  reparto.C = redondearDosDecimales(montoTotal - acumulado);

  // Mostrar datos en consola (temporal)
  console.log("Periodo:", obtenerPeriodoActual());
  console.log("Fecha y hora:", obtenerFechaHora());
  console.log("Consumos:", consumo);
  console.log("Reparto:", reparto);
  console.log("Comisión aplicada:", comision);
});

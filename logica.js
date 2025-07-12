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
const cerrarModal = document.getElementById("cerrarModal");

// === FORMATO MONTO RECIBO ===
inputs.monto.addEventListener("blur", () => {
  let valor = parseFloat(inputs.monto.value);
  if (!isNaN(valor) && valor > 0) {
    inputs.monto.value = valor.toFixed(2);
  } else {
    inputs.monto.value = "";
  }
});

// === CALCULO CONSUMO CON TIMER DE SEGURIDAD ===
let temporizadores = {};

function calcularConsumoSeguro(anterior, actual) {
  const numAnterior = parseInt(anterior, 10);
  const numActual = parseInt(actual, 10);

  if (isNaN(numAnterior) || isNaN(numActual)) return null;

  if (numActual < numAnterior) {
    alert("La lectura actual no puede ser menor que la anterior.");
    return "error";
  } else if (numActual === numAnterior) {
    alert("Lectura sin consumo registrado.");
    return 0;
  } else {
    return numActual - numAnterior;
  }
}

["A", "B", "C"].forEach((letra) => {
  const anterior = inputs[`anterior${letra}`];
  const actual = inputs[`actual${letra}`];
  const consumo = inputs[`consumo${letra}`];

  const calcular = () => {
    const resultado = calcularConsumoSeguro(anterior.value, actual.value);

    if (resultado === "error") {
      actual.value = "";
      consumo.value = "";
    } else if (resultado !== null) {
      consumo.value = `${resultado} kWh`;
    }
  };

  actual.addEventListener("input", () => {
    clearTimeout(temporizadores[letra]);
    temporizadores[letra] = setTimeout(calcular, 500);
  });
});

// === OBTENER PERIODO ===
function obtenerPeriodoActual() {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  const ahora = new Date();
  const mes = ahora.getMonth();
  const anio = ahora.getFullYear();
  const mesInicio = meses[(mes - 1 + 12) % 12];
  const mesFin = meses[mes];
  return `${mesInicio} - ${mesFin} de ${anio}`;
}

// === OBTENER FECHA Y HORA ===
function obtenerFechaHora() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) + ' - ' + ahora.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// === CALCULAR Y MOSTRAR RESULTADOS ===
inputs.calcular.addEventListener("click", function (e) {
  e.preventDefault();

  const montoTotal = parseFloat(inputs.monto.value);
  if (isNaN(montoTotal) || montoTotal <= 0) {
    alert("Por favor, ingresa un monto válido mayor a cero.");
    return;
  }

  const consumo = {
    A: parseInt(inputs.consumoA.value) || 0,
    B: parseInt(inputs.consumoB.value) || 0,
    C: parseInt(inputs.consumoC.value) || 0
  };

  const totalConsumo = consumo.A + consumo.B + consumo.C;
  if (totalConsumo === 0) {
    alert("Los consumos registrados no son válidos. Verifica las lecturas.");
    return;
  }

  // === EVALUAR QUIÉN PAGA COMISIÓN ===
  let comision = 0;
  const elegibles = [consumo.A >= 2, consumo.B >= 2];
  const aportantes = elegibles.filter(Boolean).length;
  if (aportantes > 0) comision = 1;

  const montoSinComision = montoTotal - comision;
  const repartoBruto = {};
  let acumulado = 0;

  ["A", "B"].forEach(key => {
    repartoBruto[key] = parseFloat(((consumo[key] / totalConsumo) * montoSinComision).toFixed(2));
    acumulado += repartoBruto[key];
  });

  repartoBruto.C = parseFloat((montoTotal - acumulado).toFixed(2));

  // === REDONDEOS FINALES ===
  const repartoFinal = {};
  let totalFinal = 0;

  ["A", "B", "C"].forEach(key => {
    repartoFinal[key] = Math.round(repartoBruto[key] * 20) / 20; // Redondeo a múltiplos de 0.05
    totalFinal += repartoFinal[key];
  });

  // Ajustar diferencias si el total no da exacto
  const diferencia = parseFloat((montoTotal - totalFinal).toFixed(2));
  repartoFinal.C += diferencia;

  // === CONSTRUIR TABLA ===
  let tablaHTML = `
    <h3 class="modal-title">Resumen del Reparto del Pago de Luz</h3>
    <p class="modal-periodo"><strong>${obtenerPeriodoActual()}</strong></p>
    <p class="modal-fecha">${obtenerFechaHora()}</p>
    <table class="tabla-modal">
      <thead>
        <tr>
          <th><i class="fas fa-home" style="color:#007BFF;"></i></th>
          <th><i class="fas fa-bolt" style="color:#007BFF;"></i></th>
          <th><i class="fas fa-percent" style="color:#007BFF;"></i></th>
          <th><i class="fas fa-coins" style="color:#007BFF;"></i></th>
        </tr>
      </thead>
      <tbody>
        ${["A", "B", "C"].map(key => `
          <tr>
            <td>Medidor ${key}</td>
            <td>${consumo[key]} kWh</td>
            <td>${Math.round((consumo[key] / totalConsumo) * 100)}%</td>
            <td>S/ ${repartoFinal[key].toFixed(2)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;

  modalBody.innerHTML = tablaHTML;
  modal.classList.add("mostrar");
});

// === BOTÓN PARA CERRAR MODAL ===
cerrarModal.addEventListener("click", () => {
  modal.classList.remove("mostrar");
});

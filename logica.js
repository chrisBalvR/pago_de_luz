
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
  calcular: document.getElementById("calcular"),
};

const modal = document.getElementById("resultadoModal");
const modalBody = document.querySelector(".modal-body");
const modalCerrar = document.querySelector(".modal-cerrar");

// === FORMATEAR MONTO CON DOS DECIMALES ===
inputs.monto.addEventListener("blur", () => {
  const valor = parseFloat(inputs.monto.value);
  if (!isNaN(valor) && valor > 0) {
    inputs.monto.value = valor.toFixed(2);
  } else {
    alert("Por favor, ingresa un monto válido mayor a cero.");
    inputs.monto.value = "";
    inputs.monto.focus();
  }
});

// === FUNCIONES DE UTILIDAD ===
function calcularConsumo(anterior, actual) {
  const ant = anterior.trim();
  const act = actual.trim();

  if (ant.length === 6 && act.length === 6) {
    const numAnterior = parseInt(ant);
    const numActual = parseInt(act);
    if (numActual < numAnterior) {
      alert("La lectura actual no puede ser menor que la anterior.");
      return null;
    } else if (numActual === numAnterior) {
      alert("Lectura sin consumo registrado.");
      return 0;
    }
    return numActual - numAnterior;
  }
  return null;
}

function redondearDiezCentimos(num) {
  return Math.round(num * 10) / 10;
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

// === ACTUALIZAR CONSUMO AUTOMÁTICO ===
["anteriorA", "actualA", "anteriorB", "actualB", "anteriorC", "actualC"].forEach((id) => {
  inputs[id].addEventListener("input", () => {
    const a = calcularConsumo(inputs.anteriorA.value, inputs.actualA.value);
    const b = calcularConsumo(inputs.anteriorB.value, inputs.actualB.value);
    const c = calcularConsumo(inputs.anteriorC.value, inputs.actualC.value);

    inputs.consumoA.value = a !== null && a >= 0 ? `${a} kWh` : "";
    inputs.consumoB.value = b !== null && b >= 0 ? `${b} kWh` : "";
    inputs.consumoC.value = c !== null && c >= 0 ? `${c} kWh` : "";
  });
});

// === CÁLCULO PRINCIPAL ===
inputs.calcular.addEventListener("click", function (e) {
  e.preventDefault();

  const montoTotal = parseFloat(inputs.monto.value);
  if (isNaN(montoTotal) || montoTotal <= 0) {
    alert("Monto inválido.");
    return;
  }

  const consumo = {
    A: calcularConsumo(inputs.anteriorA.value, inputs.actualA.value),
    B: calcularConsumo(inputs.anteriorB.value, inputs.actualB.value),
    C: calcularConsumo(inputs.anteriorC.value, inputs.actualC.value)
  };

  if (Object.values(consumo).some((v) => v === null)) {
    return;
  }

  const totalConsumo = consumo.A + consumo.B + consumo.C;
  if (totalConsumo === 0) {
    alert("Los tres medidores marcan cero consumo.");
    return;
  }

  // === EVALUACIÓN DE COMISIÓN ===
  let comision = 0;
  const elegibles = [consumo.A >= 2, consumo.B >= 2];
  const aportantes = elegibles.filter(Boolean).length;
  if (aportantes > 0) comision = 1;

  const montoSinComision = montoTotal - comision;
  const reparto = {};
  let acumulado = 0;

  ["A", "B"].forEach((key) => {
    const monto = consumo[key] > 0
      ? redondearDiezCentimos((consumo[key] / totalConsumo) * montoSinComision)
      : 0;
    reparto[key] = monto;
    acumulado += monto;
  });

  reparto.C = redondearDiezCentimos(montoTotal - acumulado);

  // === CONSTRUIR TABLA MODAL ===
  let tablaHTML = `
    <h3 class="modal-title">Resumen del Reparto del Pago de Luz</h3>
    <p class="modal-periodo"><strong>${obtenerPeriodoActual()}</strong></p>
    <p class="modal-fecha">${obtenerFechaHora()}</p>
    <table class="tabla-modal">
      <thead>
        <tr>
          <th><i class="fas fa-home icon-blue"></i></th>
          <th><i class="fas fa-bolt icon-blue"></i></th>
          <th><i class="fas fa-percent icon-blue"></i></th>
          <th><i class="fas fa-coins icon-blue"></i></th>
        </tr>
      </thead>
      <tbody>
        ${["A", "B", "C"].map((key) => `
          <tr>
            <td>Medidor ${key}</td>
            <td>${consumo[key]} kWh</td>
            <td>${Math.round((consumo[key] / totalConsumo) * 100)}%</td>
            <td>S/ ${reparto[key].toFixed(2)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;

  modalBody.innerHTML = tablaHTML;
  modal.classList.add("mostrar");
});

// === CERRAR MODAL ===
modalCerrar.addEventListener("click", () => {
  modal.classList.remove("mostrar");
});

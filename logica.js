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
const modalClose = document.querySelector(".modal-cerrar");

function formatMonto() {
  let valor = parseFloat(inputs.monto.value);
  if (!isNaN(valor) && valor > 0) {
    inputs.monto.value = valor.toFixed(2);
  }
}

inputs.monto.addEventListener("input", formatMonto);

function calcularConsumo(anterior, actual) {
  const ant = parseInt(anterior);
  const act = parseInt(actual);
  if (actual.length === anterior.length) {
    if (act < ant) {
      return "error";
    } else if (act === ant) {
      return "igual";
    } else {
      return act - ant;
    }
  }
  return null; // aún escribiendo
}

function redondearDosDecimales(num) {
  return Math.round(num * 100) / 100;
}

function redondearMoneda(num) {
  return Math.ceil(num * 20) / 20; // redondear a múltiplos de 0.05
}

function obtenerPeriodoActual() {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  const ahora = new Date();
  const mes = ahora.getMonth();
  const anio = ahora.getFullYear();
  const mesInicio = meses[(mes - 1 + 12) % 12];
  const mesFin = meses[mes];
  return `${mesInicio} - ${mesFin} de ${anio}`;
}

function obtenerFechaHora() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) + ' - ' + ahora.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function mostrarConsumo(key) {
  const anterior = inputs[`anterior${key}`].value;
  const actual = inputs[`actual${key}`].value;
  const consumo = calcularConsumo(anterior, actual);

  const campo = inputs[`consumo${key}`];

  if (consumo === "error") {
    campo.value = "";
    alert(`⚠️ En el medidor ${key}, la lectura actual no puede ser menor que la anterior.`);
  } else if (consumo === "igual") {
    campo.value = "0 kWh";
    alert(`ℹ️ En el medidor ${key}, no hay consumo registrado este mes.`);
  } else if (typeof consumo === "number") {
    campo.value = `${consumo} kWh`;
  } else {
    campo.value = "";
  }
}

// Eventos blur para validar después de escribir completo
["A", "B", "C"].forEach(key => {
  inputs[`actual${key}`].addEventListener("blur", () => mostrarConsumo(key));
});

inputs.calcular.addEventListener("click", function (e) {
  e.preventDefault();
  formatMonto(); // asegura formato correcto al calcular

  const montoTotal = parseFloat(inputs.monto.value);
  if (isNaN(montoTotal) || montoTotal <= 0) {
    alert("Por favor, ingresa un monto válido mayor a cero.");
    return;
  }

  const consumo = {
    A: calcularConsumo(inputs.anteriorA.value, inputs.actualA.value),
    B: calcularConsumo(inputs.anteriorB.value, inputs.actualB.value),
    C: calcularConsumo(inputs.anteriorC.value, inputs.actualC.value)
  };

  // Verificación completa
  for (let key of ["A", "B", "C"]) {
    if (consumo[key] === "error") {
      alert(`⚠️ Lectura inválida en el medidor ${key}.`);
      return;
    } else if (consumo[key] === null) {
      alert(`Por favor, completa las lecturas del medidor ${key}.`);
      return;
    } else if (consumo[key] === "igual") {
      consumo[key] = 0;
    }
  }

  const totalConsumo = consumo.A + consumo.B + consumo.C;
  if (totalConsumo === 0) {
    alert("Los consumos registrados no son válidos. Verifica las lecturas.");
    return;
  }

  // Evaluar comisión
  const elegibles = [consumo.A >= 2, consumo.B >= 2];
  const aportantes = elegibles.filter(Boolean).length;
  let comision = aportantes > 0 ? 1 : 0;

  const montoSinComision = montoTotal - comision;
  const reparto = {};
  let acumulado = 0;

  ["A", "B"].forEach(key => {
    reparto[key] = consumo[key] > 0 ? redondearMoneda((consumo[key] / totalConsumo) * montoSinComision) : 0;
    acumulado += reparto[key];
  });

  reparto.C = redondearMoneda(montoTotal - acumulado);

  let tablaHTML = `
    <h3 class="modal-title">Resumen del Reparto del Pago de Luz</h3>
    <p class="modal-periodo"><strong style="font-size: 1.1rem;">${obtenerPeriodoActual()}</strong></p>
    <p class="modal-fecha">${obtenerFechaHora()}</p>
    <table class="tabla-modal">
      <thead>
        <tr>
          <th><i class="fas fa-home icon-modal"></i></th>
          <th><i class="fas fa-bolt icon-modal"></i></th>
          <th><i class="fas fa-percent icon-percent icon-modal"></i></th>
          <th><i class="fas fa-coins icon-modal"></i></th>
        </tr>
      </thead>
      <tbody>
        ${["A", "B", "C"].map(key => `
          <tr>
            <td>Medidor ${key}</td>
            <td>${consumo[key]} kWh</td>
            <td>${((consumo[key] / totalConsumo) * 100).toFixed(0)}%</td>
            <td>S/ ${reparto[key].toFixed(2)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <button class="modal-cerrar" onclick="document.getElementById('resultadoModal').classList.remove('mostrar')">Cerrar</button>
  `;

  modalBody.innerHTML = tablaHTML;
  modal.classList.add("mostrar");
});

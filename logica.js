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

const mensajes = {
  A: document.getElementById("mensajeA"),
  B: document.getElementById("mensajeB"),
  C: document.getElementById("mensajeC")
};

const modal = document.getElementById("resultadoModal");
const modalBody = document.querySelector(".modal-body");
const cerrarModal = document.getElementById("cerrarModal");

// === FUNCIONES AUXILIARES ===
function calcularConsumo(anterior, actual) {
  const a = parseInt(anterior);
  const b = parseInt(actual);
  if (isNaN(a) || isNaN(b)) return null;
  if (b < a) return -1;
  return b - a;
}

function obtenerPeriodoActual() {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  const hoy = new Date();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  const mesInicio = meses[(mes - 1 + 12) % 12];
  const mesFin = meses[mes];
  return `${mesInicio} - ${mesFin} de ${anio}`;
}

function obtenerFechaHora() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' - ' +
    ahora.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function redondearMoneda(num) {
  return Math.round(num * 20) / 20; // Redondea a múltiplos de 0.05
}

function limpiarMensajes() {
  Object.values(mensajes).forEach(p => p.textContent = "");
}

// === EVENTOS DE CAMPO DE MONTO ===
inputs.monto.addEventListener("blur", () => {
  let valor = parseFloat(inputs.monto.value);
  if (!isNaN(valor) && valor > 0) {
    inputs.monto.value = valor.toFixed(2);
  }
});

// === VALIDACIÓN DE LECTURAS ===
['A', 'B', 'C'].forEach(medidor => {
  inputs[`actual${medidor}`].addEventListener("input", () => {
    limpiarMensajes();

    const anterior = inputs[`anterior${medidor}`].value;
    const actual = inputs[`actual${medidor}`].value;
    const resultado = calcularConsumo(anterior, actual);

    if (resultado === -1) {
      mensajes[medidor].textContent = "⚠️ La lectura actual debe ser mayor o igual que la anterior.";
      inputs[`consumo${medidor}`].value = "";
    } else if (resultado === 0) {
      mensajes[medidor].textContent = "⚠️ Consumo cero registrado.";
      inputs[`consumo${medidor}`].value = "0 kWh";
    } else if (resultado > 0) {
      inputs[`consumo${medidor}`].value = `${resultado} kWh`;
    }
  });
});

// === BOTÓN CALCULAR ===
inputs.calcular.addEventListener("click", function (e) {
  e.preventDefault();
  limpiarMensajes();

  const montoTotal = parseFloat(inputs.monto.value);
  if (isNaN(montoTotal) || montoTotal <= 0) {
    alert("Por favor, ingresa un monto válido mayor a cero.");
    return;
  }

  // Consumos
  const consumo = {
    A: calcularConsumo(inputs.anteriorA.value, inputs.actualA.value),
    B: calcularConsumo(inputs.anteriorB.value, inputs.actualB.value),
    C: calcularConsumo(inputs.anteriorC.value, inputs.actualC.value)
  };

  if ([consumo.A, consumo.B, consumo.C].includes(null) || [consumo.A, consumo.B, consumo.C].includes(-1)) {
    alert("Verifica todas las lecturas. Algunos valores son incorrectos.");
    return;
  }

  const totalConsumo = consumo.A + consumo.B + consumo.C;
  if (totalConsumo === 0) {
    alert("No se ha registrado consumo. Verifica las lecturas.");
    return;
  }

  // Evaluación de comisión
  const elegibles = [];
  if (consumo.A >= 2) elegibles.push("A");
  if (consumo.B >= 2) elegibles.push("B");
  const comision = elegibles.length > 0 ? 1 : 0;

  // Reparto proporcional
  const montoSinComision = montoTotal - comision;
  const repartoOriginal = {};
  let acumulado = 0;

  ["A", "B"].forEach(key => {
    repartoOriginal[key] = redondearMoneda((consumo[key] / totalConsumo) * montoSinComision);
    acumulado += repartoOriginal[key];
  });

  repartoOriginal.C = redondearMoneda(montoTotal - acumulado);

  // Ajustar comisión a C
  if (comision === 1) {
    repartoOriginal.C = redondearMoneda(repartoOriginal.C - 1);
    elegibles.forEach(key => {
      repartoOriginal[key] = redondearMoneda(repartoOriginal[key] + 0.5);
    });
  }

  // === VENTANA MODAL ===
  const tablaHTML = `
    <h3 class="modal-title">Resumen del Reparto del Pago de Luz</h3>
    <p class="modal-periodo">${obtenerPeriodoActual()}</p>
    <p class="modal-fecha">${obtenerFechaHora()}</p>
    <table class="tabla-modal">
      <thead>
        <tr>
          <th><i class="fas fa-home"></i></th>
          <th><i class="fas fa-bolt"></i></th>
          <th><i class="fas fa-percent icon-percent"></i></th>
          <th><i class="fas fa-coins"></i></th>
        </tr>
      </thead>
      <tbody>
        ${["A", "B", "C"].map(key => `
          <tr>
            <td>Medidor ${key}</td>
            <td>${consumo[key]} kWh</td>
            <td>${Math.round((consumo[key] / totalConsumo) * 100)}%</td>
            <td>S/ ${repartoOriginal[key].toFixed(2)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  modalBody.innerHTML = tablaHTML;
  modal.classList.add("mostrar");
});

// === CIERRE MODAL ===
cerrarModal.addEventListener("click", () => {
  modal.classList.remove("mostrar");
});

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
const cerrarModal = document.getElementById("cerrarModal");

// CERRAR MODAL
cerrarModal.addEventListener("click", () => {
  modal.classList.remove("mostrar");
});

// === VALIDACIÓN Y FORMATO DEL MONTO ===
inputs.monto.addEventListener("blur", () => {
  const valor = parseFloat(inputs.monto.value);
  if (!isNaN(valor) && valor > 0) {
    const redondeado = Math.floor(valor * 10) / 10;
    inputs.monto.value = redondeado.toFixed(2);
  } else {
    inputs.monto.value = "";
  }
});

// === FUNCIONES AUXILIARES ===
function calcularConsumo(anterior, actual) {
  const ant = anterior.trim();
  const act = actual.trim();

  if (ant.length === 0 || act.length === 0) return "";

  if (act.length < ant.length) return "";

  const valAnt = parseInt(ant);
  const valAct = parseInt(act);
  const diff = valAct - valAnt;

  if (isNaN(diff)) return "";
  if (diff < 0) return "ERROR";

  return diff === 0 ? "0" : diff.toString();
}

function redondearMonto(monto) {
  return (Math.round(monto * 20) / 20).toFixed(2);
}

function obtenerPeriodoActual() {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
  const fecha = new Date();
  const mesFin = fecha.getMonth();
  const mesInicio = (mesFin - 1 + 12) % 12;
  const anio = fecha.getFullYear();
  return `${meses[mesInicio]} - ${meses[mesFin]} de ${anio}`;
}

function obtenerFechaHora() {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' - ' +
    ahora.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// === EVENTOS DE CAMBIO EN LECTURAS ===
["anteriorA", "actualA", "anteriorB", "actualB", "anteriorC", "actualC"].forEach(id => {
  const medidor = id.slice(-1); // A, B o C
  const consumoInput = document.getElementById("consumo" + medidor);

  inputs[id].addEventListener("input", () => {
    const anterior = inputs["anterior" + medidor].value;
    const actual = inputs["actual" + medidor].value;
    const resultado = calcularConsumo(anterior, actual);

    if (resultado === "ERROR") {
      consumoInput.value = "";
      alert(`⚠️ Error: La lectura actual del Medidor ${medidor} no puede ser menor que la anterior.`);
      return;
    }

    if (resultado !== "") {
      consumoInput.value = `${resultado} kWh`;
    } else {
      consumoInput.value = "";
    }
  });
});

// === EVENTO PRINCIPAL: CALCULAR ===
inputs.calcular.addEventListener("click", (e) => {
  e.preventDefault();

  const montoBruto = parseFloat(inputs.monto.value);
  if (isNaN(montoBruto) || montoBruto <= 0) {
    alert("⚠️ Ingrese un monto válido.");
    return;
  }

  const consumo = {
    A: parseInt(calcularConsumo(inputs.anteriorA.value, inputs.actualA.value)) || 0,
    B: parseInt(calcularConsumo(inputs.anteriorB.value, inputs.actualB.value)) || 0,
    C: parseInt(calcularConsumo(inputs.anteriorC.value, inputs.actualC.value)) || 0,
  };

  const totalKwh = consumo.A + consumo.B + consumo.C;
  if (totalKwh === 0) {
    alert("⚠️ No hay consumo registrado. Verifique las lecturas.");
    return;
  }

  // === EVALUACIÓN DE COMISIÓN ===
  let comision = 0;
  const pagaComisionA = consumo.A >= 2;
  const pagaComisionB = consumo.B >= 2;

  if (pagaComisionA && pagaComisionB) comision = 1;
  else if (pagaComisionA || pagaComisionB) comision = 1;
  else comision = 0;

  // === CÁLCULO DE MONTOS SIN REDONDEAR ===
  const montoSinComision = montoBruto - comision;
  let montoA = (consumo.A / totalKwh) * montoSinComision;
  let montoB = (consumo.B / totalKwh) * montoSinComision;
  let montoC = (consumo.C / totalKwh) * montoSinComision;

  // === APLICAR REDONDEO A MÚLTIPLOS DE 0.10 ===
  montoA = parseFloat(redondearMonto(montoA));
  montoB = parseFloat(redondearMonto(montoB));
  montoC = parseFloat(redondearMonto(montoC));

  // === AJUSTAR DIFERENCIA POR REDONDEO ===
  const suma = montoA + montoB + montoC;
  const diferencia = (montoBruto - suma).toFixed(2);
  if (Math.abs(diferencia) >= 0.01) {
    montoC = parseFloat((montoC + parseFloat(diferencia)).toFixed(2));
  }

  const porcentajes = {
    A: Math.round((consumo.A / totalKwh) * 100),
    B: Math.round((consumo.B / totalKwh) * 100),
    C: Math.round((consumo.C / totalKwh) * 100),
  };

  // === CONSTRUIR MODAL ===
  let tabla = `
    <h3 class="modal-title">Resumen del Reparto del Pago de Luz</h3>
    <p class="modal-periodo">${obtenerPeriodoActual()}</p>
    <p class="modal-fecha">${obtenerFechaHora()}</p>

    <table class="tabla-modal">
      <thead>
        <tr>
          <th><i class="fas fa-home"></i></th>
          <th><i class="fas fa-bolt"></i></th>
          <th><i class="fas fa-percent"></i></th>
          <th><i class="fas fa-coins"></i></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>A</td>
          <td>${consumo.A} kWh</td>
          <td>${porcentajes.A}%</td>
          <td>S/ ${montoA.toFixed(2)}</td>
        </tr>
        <tr>
          <td>B</td>
          <td>${consumo.B} kWh</td>
          <td>${porcentajes.B}%</td>
          <td>S/ ${montoB.toFixed(2)}</td>
        </tr>
        <tr>
          <td>C</td>
          <td>${consumo.C} kWh</td>
          <td>${porcentajes.C}%</td>
          <td>S/ ${montoC.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  modalBody.innerHTML = tabla;
  modal.classList.add("mostrar");
});

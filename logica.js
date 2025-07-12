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

inputs.monto.addEventListener("blur", () => {
  let valor = parseFloat(inputs.monto.value);
  if (!isNaN(valor) && valor > 0) {
    inputs.monto.value = valor.toFixed(2);
  }
});

function calcularConsumo(anterior, actual) {
  const consumo = Math.round(parseFloat(actual)) - Math.round(parseFloat(anterior));
  return isNaN(consumo) || consumo < 0 ? 0 : consumo;
}

function redondearDecimaSuperior(num) {
  return Math.ceil(num * 10) / 10;
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

inputs.calcular.addEventListener("click", function (e) {
  e.preventDefault();

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

  const totalConsumo = consumo.A + consumo.B + consumo.C;
  if (totalConsumo === 0) {
    alert("Los consumos registrados no son válidos. Verifica las lecturas.");
    return;
  }

  // Paso 1: Reparto proporcional sin comisión
  const repartoBase = {};
  Object.keys(consumo).forEach(key => {
    repartoBase[key] = (consumo[key] / totalConsumo) * montoTotal;
  });

  // Paso 2: Evaluación de comisión
  let comision = 0;
  const aportantes = [];
  if (consumo.A >= 2) aportantes.push("A");
  if (consumo.B >= 2) aportantes.push("B");

  if (aportantes.length === 2) {
    comision = 1;
  } else if (aportantes.length === 1) {
    comision = 1;
  }

  // Paso 3: Ajustes por comisión
  const repartoFinal = { ...repartoBase };
  if (comision > 0) {
    const ajuste = comision / aportantes.length;
    aportantes.forEach(key => {
      repartoFinal[key] += ajuste;
    });
    repartoFinal.C -= comision;
  }

  // Paso 4: Redondeo final
  const montosRedondeados = {};
  let sumaTemporal = 0;
  ["A", "B"].forEach(key => {
    montosRedondeados[key] = redondearDecimaSuperior(repartoFinal[key]);
    sumaTemporal += montosRedondeados[key];
  });
  montosRedondeados.C = redondearDecimaSuperior(montoTotal - sumaTemporal);

  let tablaHTML = `
    <h3 class="modal-title">Resumen del Reparto del Pago de Luz</h3>
    <p class="modal-periodo periodo-destacado">${obtenerPeriodoActual()}</p>
    <p class="modal-fecha">${obtenerFechaHora()}</p>
    <table class="tabla-modal">
      <thead>
        <tr>
          <th><i class="fas fa-home icon-header"></i></th>
          <th><i class="fas fa-bolt icon-header"></i></th>
          <th><i class="fas fa-percent icon-header"></i></th>
          <th><i class="fas fa-coins icon-header"></i></th>
        </tr>
      </thead>
      <tbody>
        ${["A", "B", "C"].map(key => `
          <tr>
            <td>Medidor ${key}</td>
            <td>${consumo[key]} kWh</td>
            <td>${((consumo[key] / totalConsumo) * 100).toFixed(0)}%</td>
            <td>S/ ${montosRedondeados[key].toFixed(2)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;

  modalBody.innerHTML = tablaHTML;
  modal.classList.add("mostrar");
});

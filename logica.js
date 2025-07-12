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
const btnCerrar = document.querySelector(".cerrar");

// === FORMATO AUTOMÁTICO MONTO ===
inputs.monto.addEventListener("blur", () => {
  let valor = parseFloat(inputs.monto.value);
  if (!isNaN(valor) && valor > 0) {
    inputs.monto.value = valor.toFixed(2);
  } else {
    inputs.monto.value = "";
  }
});

// === CALCULAR CONSUMO CON VALIDACIÓN ===
function calcularConsumo(anterior, actual) {
  const a = anterior.trim();
  const b = actual.trim();

  if (a.length > 0 && b.length > 0 && a.length === b.length) {
    const valA = parseInt(a);
    const valB = parseInt(b);

    if (isNaN(valA) || isNaN(valB)) return -1;

    if (valB < valA) return "error";
    if (valB === valA) return "igual";

    return valB - valA;
  }

  return -1;
}

// === REDONDEO A LA DÉCIMA MÁS CERCANA ===
function redondearDecimal(num) {
  return Math.round(num * 10) / 10;
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
  return ahora.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) + ' - ' +
         ahora.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// === VALIDAR Y MOSTRAR CONSUMO AUTOMÁTICO ===
["anteriorA","actualA","anteriorB","actualB","anteriorC","actualC"].forEach((campo, idx) => {
  document.getElementById(campo).addEventListener("input", () => {
    const consumoA = calcularConsumo(inputs.anteriorA.value, inputs.actualA.value);
    const consumoB = calcularConsumo(inputs.anteriorB.value, inputs.actualB.value);
    const consumoC = calcularConsumo(inputs.anteriorC.value, inputs.actualC.value);

    if (consumoA === "error") {
      alert("⚠️ Lectura A: La lectura actual no puede ser menor que la anterior");
      inputs.actualA.value = "";
      inputs.consumoA.value = "";
    } else if (consumoA === "igual") {
      alert("ℹ️ Lectura A: No hay consumo registrado este mes");
      inputs.consumoA.value = "0 kWh";
    } else if (consumoA >= 0) {
      inputs.consumoA.value = `${consumoA} kWh`;
    }

    if (consumoB === "error") {
      alert("⚠️ Lectura B: La lectura actual no puede ser menor que la anterior");
      inputs.actualB.value = "";
      inputs.consumoB.value = "";
    } else if (consumoB === "igual") {
      alert("ℹ️ Lectura B: No hay consumo registrado este mes");
      inputs.consumoB.value = "0 kWh";
    } else if (consumoB >= 0) {
      inputs.consumoB.value = `${consumoB} kWh`;
    }

    if (consumoC === "error") {
      alert("⚠️ Lectura C: La lectura actual no puede ser menor que la anterior");
      inputs.actualC.value = "";
      inputs.consumoC.value = "";
    } else if (consumoC === "igual") {
      alert("ℹ️ Lectura C: No hay consumo registrado este mes");
      inputs.consumoC.value = "0 kWh";
    } else if (consumoC >= 0) {
      inputs.consumoC.value = `${consumoC} kWh`;
    }
  });
});

// === BOTÓN CALCULAR ===
inputs.calcular.addEventListener("click", function (e) {
  e.preventDefault();

  const montoTotal = parseFloat(inputs.monto.value);
  if (isNaN(montoTotal) || montoTotal <= 0) {
    alert("⚠️ Ingrese un monto válido del recibo.");
    return;
  }

  const consumo = {
    A: calcularConsumo(inputs.anteriorA.value, inputs.actualA.value),
    B: calcularConsumo(inputs.anteriorB.value, inputs.actualB.value),
    C: calcularConsumo(inputs.anteriorC.value, inputs.actualC.value)
  };

  if (Object.values(consumo).includes("error") || Object.values(consumo).includes(-1)) {
    alert("⚠️ Verifica todas las lecturas. Asegúrate de que sean válidas.");
    return;
  }

  const totalConsumo = consumo.A + consumo.B + consumo.C;
  if (totalConsumo === 0) {
    alert("⚠️ El consumo total es cero. No hay datos para repartir.");
    return;
  }

  // Evaluar si se aplica comisión
  let comision = 0;
  const aplicaA = consumo.A >= 2;
  const aplicaB = consumo.B >= 2;
  const aportantes = [aplicaA, aplicaB].filter(Boolean).length;

  if (aportantes > 0) {
    comision = 1;
  }

  const montoSinComision = montoTotal - comision;

  // Reparto proporcional sin comision aún
  const proporcional = {
    A: redondearDecimal((consumo.A / totalConsumo) * montoSinComision),
    B: redondearDecimal((consumo.B / totalConsumo) * montoSinComision),
    C: redondearDecimal((consumo.C / totalConsumo) * montoSinComision)
  };

  let descuentoC = 0;

  if (comision === 1) {
    if (aportantes === 2) {
      proporcional.A = redondearDecimal(proporcional.A + 0.5);
      proporcional.B = redondearDecimal(proporcional.B + 0.5);
      descuentoC = 1;
    } else if (aportaA) {
      proporcional.A = redondearDecimal(proporcional.A + 1);
      descuentoC = 1;
    } else if (aportaB) {
      proporcional.B = redondearDecimal(proporcional.B + 1);
      descuentoC = 1;
    }
  }

  proporcional.C = redondearDecimal(montoTotal - (proporcional.A + proporcional.B));

  // Crear tabla
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

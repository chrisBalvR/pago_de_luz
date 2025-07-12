document.addEventListener("DOMContentLoaded", () => {
  const montoInput = document.getElementById("monto");
  const medidores = document.querySelectorAll(".medidor");
  const btnCalcular = document.getElementById("btnCalcular");
  const modalOverlay = document.getElementById("modalOverlay");
  const cerrarModal = document.getElementById("cerrarModal");
  const tablaResultados = document.getElementById("tablaResultados");
  const periodo = document.getElementById("periodo");
  const fechaHora = document.getElementById("fechaHora");

  // Formatear monto a una décima máxima
  montoInput.addEventListener("blur", () => {
    let valor = parseFloat(montoInput.value);
    if (!isNaN(valor)) {
      valor = Math.floor(valor * 10) / 10;
      montoInput.value = valor.toFixed(2);
    }
  });

  // Calcular consumo automáticamente
  medidores.forEach(medidor => {
    const anterior = medidor.querySelector(".anterior");
    const actual = medidor.querySelector(".actual");
    const consumoInput = medidor.querySelector(".consumo");
    const mensaje = medidor.querySelector(".mensaje");

    const calcular = () => {
      const ant = parseInt(anterior.value);
      const act = parseInt(actual.value);
      if (!isNaN(ant) && !isNaN(act)) {
        if (act < ant) {
          mensaje.textContent = "⚠️ La lectura actual no puede ser menor que la anterior.";
          consumoInput.value = "0 kWh";
        } else {
          const diferencia = act - ant;
          consumoInput.value = `${diferencia} kWh`;
          mensaje.textContent = diferencia === 0 ? "ℹ️ No hubo consumo." : "";
        }
      } else {
        consumoInput.value = "0 kWh";
        mensaje.textContent = "";
      }
    };

    anterior.addEventListener("input", calcular);
    actual.addEventListener("input", calcular);
  });

  // Calcular reparto
  btnCalcular.addEventListener("click", () => {
    const monto = parseFloat(montoInput.value);
    if (isNaN(monto)) {
      alert("Por favor ingresa el monto del recibo.");
      return;
    }

    const consumos = Array.from(medidores).map(medidor => {
      const texto = medidor.querySelector(".consumo").value;
      const numero = parseInt(texto.replace(" kWh", ""));
      return isNaN(numero) ? 0 : numero;
    });

    if (consumos.some((c, i) => {
      const anterior = medidores[i].querySelector(".anterior").value;
      const actual = medidores[i].querySelector(".actual").value;
      return actual === "" || anterior === "";
    })) {
      alert("Completa todas las lecturas antes de calcular.");
      return;
    }

    const totalConsumo = consumos.reduce((a, b) => a + b, 0);
    if (totalConsumo === 0) {
      alert("No hay consumo registrado. No se puede calcular.");
      return;
    }

    let repartos = consumos.map(c => (c / totalConsumo) * monto);

    // Aplicar comisión si A o B consumieron ≥ 2 kWh
    const comision = (consumos[0] >= 2 || consumos[1] >= 2) ? 1 : 0;
    if (comision === 1) {
      const totalAB = consumos[0] + consumos[1];
      if (totalAB > 0) {
        const prorrateoA = (consumos[0] / totalAB) * comision;
        const prorrateoB = (consumos[1] / totalAB) * comision;
        repartos[0] += prorrateoA;
        repartos[1] += prorrateoB;
        repartos[2] -= comision;
      }
    }

    // Mostrar resultados
    tablaResultados.innerHTML = "";
    ["A", "B", "C"].forEach((letra, i) => {
      const porcentaje = (consumos[i] / totalConsumo) * 100;
      let montoFinal = Math.ceil(repartos[i] * 10) / 10;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${letra}</td>
        <td>${consumos[i]} kWh</td>
        <td>${porcentaje.toFixed(1)}%</td>
        <td>S/ ${montoFinal.toFixed(2)}</td>
      `;
      tablaResultados.appendChild(fila);
    });

    // Mostrar período
    const hoy = new Date();
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                   "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const mesAnterior = hoy.getMonth() === 0 ? 11 : hoy.getMonth() - 1;
    const año = hoy.getFullYear();
    periodo.textContent = `${meses[mesAnterior][0].toUpperCase() + meses[mesAnterior].slice(1)} - ${meses[hoy.getMonth()][0].toUpperCase() + meses[hoy.getMonth()].slice(1)} de ${año}`;

    const dia = hoy.getDate();
    const mes = meses[hoy.getMonth()];
    const hora = hoy.getHours();
    const minutos = hoy.getMinutes().toString().padStart(2, "0");
    const ampm = hora >= 12 ? "pm" : "am";
    const hora12 = hora % 12 || 12;
    fechaHora.textContent = `${dia} de ${mes} de ${año} - ${hora12}:${minutos} ${ampm}`;

    modalOverlay.style.display = "flex";
  });

  cerrarModal.addEventListener("click", () => {
    modalOverlay.style.display = "none";
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = "none";
    }
  });
});

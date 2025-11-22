document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    selectable: true,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "",
    },
    dateClick: function (info) {
      // Al hacer clic en un día, lo seleccionamos para el formulario
      document.getElementById(
        "mensaje"
      ).textContent = `Seleccionaste el día: ${info.dateStr}`;
      document.getElementById("mensaje").style.color = "#ff3399";
      // Guardamos la fecha en un input oculto
      const inputDate = document.getElementById("fecha");
      if (!inputDate) {
        const fechaInput = document.createElement("input");
        fechaInput.type = "hidden";
        fechaInput.id = "fecha";
        fechaInput.value = info.dateStr;
        document.getElementById("form-cita").appendChild(fechaInput);
      } else {
        inputDate.value = info.dateStr;
      }
    },
  });

  calendar.render();
});

// Manejo de envío de formulario (solo mensaje por ahora)
document.getElementById("form-cita").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const correo = document.getElementById("correo").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;
  const servicio = document.getElementById("servicio").value;

  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = `Cita agendada para ${nombre} el ${fecha} a las ${hora} para ${servicio}.`;
  mensaje.style.color = "#ff3399";

  this.reset();
});

// 1. CONFIGURACIÓN DE SUPABASE
// Ya puse tu URL aquí:
const supabaseUrl = "https://jifwtgpchbipxyriirtq.supabase.co";

// --- IMPORTANTE: BORRA EL TEXTO DE ABAJO Y PEGA TU 'ANON KEY' ---
// Debe quedar algo como: const supabaseKey = 'eyJhbGciOiJIUz...';
const supabaseKey = "sb_publishable_zF5mj6Ba61zibU_19vnFPQ_a4GDaKwi";

// Inicializamos la conexión
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variables para guardar qué día y hora eligió el usuario
let currentSelection = { date: null, time: null };

document.addEventListener("DOMContentLoaded", function () {
  // Configuración del Calendario
  var calendarEl = document.getElementById("calendar");
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    firstDay: 0, // Domingo
    headerToolbar: { left: "prev", center: "title", right: "next" },

    // Al hacer CLIC en un día
    dateClick: function (info) {
      currentSelection.date = info.dateStr;
      openHoursModal(info.dateStr);
    },
  });

  calendar.render();
});

// --- FUNCIONES DE LA VENTANA MODAL ---

const overlay = document.getElementById("modal-overlay");
const modalHours = document.getElementById("modal-hours");
const modalForm = document.getElementById("modal-form");

// 1. Mostrar Horas
function openHoursModal(date) {
  document.getElementById("selected-date-span").innerText = date;
  overlay.classList.remove("hidden");
  modalHours.classList.remove("hidden");
  modalForm.classList.add("hidden");

  // Generamos horas de ejemplo (09:00 a 17:00)
  const grid = document.getElementById("hours-grid");
  grid.innerHTML = "";

  const horarios = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

  horarios.forEach((hora) => {
    let btn = document.createElement("div");
    btn.className = "time-slot";
    btn.innerText = hora;
    btn.onclick = () => {
      currentSelection.time = hora;
      showForm();
    };
    grid.appendChild(btn);
  });
}

// 2. Mostrar Formulario
function showForm() {
  modalHours.classList.add("hidden");
  modalForm.classList.remove("hidden");
  document.getElementById(
    "summary-info"
  ).innerText = `${currentSelection.date} a las ${currentSelection.time}`;
}

// 3. Cerrar todo
function closeModal() {
  overlay.classList.add("hidden");
}

function backToHours() {
  modalForm.classList.add("hidden");
  modalHours.classList.remove("hidden");
}

// --- GUARDAR EN SUPABASE ---

document
  .getElementById("booking-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault(); // Evitar que la página se recargue

    const btn = document.querySelector(".btn-confirm");
    btn.innerText = "Guardando...";
    btn.disabled = true;

    // Recoger datos de los inputs
    const datos = {
      fecha: currentSelection.date,
      hora: currentSelection.time,
      nombre: document.getElementById("inp-name").value,
      telefono: document.getElementById("inp-phone").value,
      correo: document.getElementById("inp-email").value,
      comprobante: document.getElementById("inp-comprobante").value,
    };

    // Enviar a la tabla 'citas' de Supabase
    const { error } = await supabase.from("citas").insert([datos]);

    if (error) {
      alert("Error al guardar: " + error.message);
      btn.innerText = "CONFIRMAR";
      btn.disabled = false;
    } else {
      alert("¡Cita Agendada Correctamente!");
      closeModal();
      document.getElementById("booking-form").reset();
      btn.innerText = "CONFIRMAR";
      btn.disabled = false;
    }
  });

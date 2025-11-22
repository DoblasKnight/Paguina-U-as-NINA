// 1. CONFIGURACIÓN DE SUPABASE
const supabaseUrl = "https://qjdqrhpufbeacizkvoiz.supabase.co";
const supabaseKey = "sb_publishable_a_gj9sXQ5lFoCe1421fBdg_J0LXe5ou"; // Tu llave actual

// Inicializamos la conexión
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variables para guardar qué día y hora eligió el usuario
let currentSelection = { date: null, time: null };

document.addEventListener("DOMContentLoaded", function () {
  var calendarEl = document.getElementById("calendar");
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    firstDay: 0, // Domingo
    headerToolbar: { left: "prev", center: "title", right: "next" },

    // Al hacer CLIC en un día
    dateClick: function (info) {
      // Validación opcional: No dejar agendar en el pasado
      let clickedDate = new Date(info.dateStr);
      let today = new Date();
      today.setHours(0, 0, 0, 0); // Quitamos la hora para comparar solo fecha

      if (clickedDate < today) {
        alert("No puedes agendar en una fecha pasada.");
        return;
      }

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

// 1. Mostrar Horas (CON BLOQUEO DE OCUPADAS)
async function openHoursModal(date) {
  document.getElementById("selected-date-span").innerText = date;
  overlay.classList.remove("hidden");
  modalHours.classList.remove("hidden");
  modalForm.classList.add("hidden");

  const grid = document.getElementById("hours-grid");
  // Mensaje de carga mientras consultamos a Supabase
  grid.innerHTML = '<p style="color:white;">Verificando disponibilidad...</p>';

  // --- PASO A: Consultar citas existentes en esa fecha ---
  const { data: citasOcupadas, error } = await supabase
    .from("citas")
    .select("hora")
    .eq("fecha", date);

  // Creamos una lista simple de horas ocupadas. Ej: ['09:00', '10:00']
  const horasBloqueadas = citasOcupadas ? citasOcupadas.map((c) => c.hora) : [];

  // --- PASO B: Generar los botones ---
  grid.innerHTML = ""; // Limpiar mensaje de carga
  const horarios = [
    "09:00",
    "10:00",
    "11:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  horarios.forEach((hora) => {
    let btn = document.createElement("div");
    btn.className = "time-slot";
    btn.innerText = hora;

    // Si la hora está en la lista de bloqueadas...
    if (horasBloqueadas.includes(hora)) {
      btn.classList.add("booked"); // Agregamos clase para estilo (rojo)
      btn.innerText += " (Ocupado)";
      btn.style.backgroundColor = "#330000"; // Rojo oscuro
      btn.style.color = "#ff4444"; // Texto rojo claro
      btn.style.borderColor = "#ff4444";
      btn.style.opacity = "0.6";
      btn.style.cursor = "not-allowed";
      // No le ponemos evento onclick, así que no hace nada
    } else {
      // Si está libre, asignamos el evento clic
      btn.onclick = () => {
        currentSelection.time = hora;
        showForm();
      };
    }
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

// --- GUARDAR EN SUPABASE (CON IMAGEN) ---

document
  .getElementById("booking-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault(); // Evitar recarga

    const btn = document.querySelector(".btn-confirm");
    const originalText = btn.innerText;
    btn.innerText = "Subiendo Comprobante...";
    btn.disabled = true;

    // --- PASO 1: SUBIR IMAGEN ---
    const fileInput = document.getElementById("inp-comprobante");
    const file = fileInput.files[0];

    if (!file) {
      alert("Debes seleccionar la imagen del comprobante.");
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }

    // Nombre único para el archivo: tiempo_nombre.jpg
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, "")}`;

    // Subir al bucket 'comprobantes'
    const { error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(fileName, file);

    if (uploadError) {
      alert("Error subiendo imagen: " + uploadError.message);
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }

    // Obtener la URL pública de la imagen
    const { data: urlData } = supabase.storage
      .from("comprobantes")
      .getPublicUrl(fileName);

    const imagenUrl = urlData.publicUrl;

    // --- PASO 2: GUARDAR DATOS EN LA TABLA ---
    btn.innerText = "Confirmando Cita...";

    const datos = {
      fecha: currentSelection.date,
      hora: currentSelection.time,
      nombre: document.getElementById("inp-name").value,
      telefono: document.getElementById("inp-phone").value,
      correo: document.getElementById("inp-email").value,
      comprobante: imagenUrl, // Guardamos el LINK, no el archivo
    };

    const { error: dbError } = await supabase.from("citas").insert([datos]);

    if (dbError) {
      alert("Error al guardar datos: " + dbError.message);
    } else {
      alert("¡Cita Agendada Exitosamente!");
      closeModal();
      document.getElementById("booking-form").reset();
      // Opcional: recargar para actualizar el calendario visualmente
      // location.reload();
    }

    btn.innerText = originalText;
    btn.disabled = false;
  });

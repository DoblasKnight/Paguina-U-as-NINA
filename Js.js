const supabaseUrl = "https://jifwtgpchbipxyriirtq.supabase.co";
const supabaseKey = "sb_publishable_zF5mj6Ba61zibU_19vnFPQ_a4GDaKwi";
// Inicializamos la conexión
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variables para guardar qué día y hora eligió el usuario
let currentSelection = { date: null, time: null };

// --- VARIABLE GLOBAL PARA FULLCALENDAR (CRÍTICO PARA REDIBUJO) ---
let calendar;
// -----------------------------------------------------------------

// <--- NUEVA VARIABLE GLOBAL PARA ALMACENAR EL ROL --->
let userRole = "client";
// ----------------------------------------------------

// --- ELEMENTOS DE LA UI ---
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const calendarContainer = document.getElementById("calendar-container"); // Contenedor del calendario
const overlay = document.getElementById("modal-overlay"); // Overlay para modales de reserva
const modalHours = document.getElementById("modal-hours");
const modalForm = document.getElementById("modal-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");
const signupForm = document.getElementById("signup-form");
const showSignupBtn = document.getElementById("show-signup-btn");
const showLoginBtn = document.getElementById("show-login-btn");

// <--- NUEVOS ELEMENTOS DE NAVEGACIÓN Y VISTAS DE ADMINISTRADOR --->
const adminNav = document.getElementById("admin-nav"); // Barra de navegación Admin
const calendarView = document.getElementById("calendar-view"); // Contenedor principal del calendario
const cronogramaView = document.getElementById("cronograma-view"); // Contenedor de la vista de cronograma (tabla)
const navCalendarBtn = document.getElementById("nav-calendar-btn"); // Botón 'Calendario'
const navCronogramaBtn = document.getElementById("nav-cronograma-btn"); // Botón 'Cronograma / Clientes'
const cronogramaDetails = document.getElementById("cronograma-details"); // Div donde se inyecta la tabla
// -----------------------------------------------------------------

// <--- ELEMENTOS DEL MODAL DE CARGA/NOTIFICACIÓN --->
const loadingOverlay = document.getElementById("loading-modal-overlay"); // Overlay de carga
const loadingMessage = document.getElementById("loading-message"); // Mensaje del modal de carga
// ----------------------------------------------------

// --- FUNCIONES DE MODAL DE CARGA Y NOTIFICACIÓN ---

/**
 * Muestra el modal de carga con un mensaje específico.
 */
function showLoading(message) {
  const spinner = document.querySelector(".spinner");
  if (spinner) spinner.style.display = "block";

  loadingMessage.innerText = message;
  loadingOverlay.classList.remove("hidden");
}

/**
 * Muestra un modal genérico de notificación (éxito, error, info).
 * Reemplaza la lógica de alert().
 */
function showNotificationModal(message, isError = false, duration = 3000) {
  // Si la función de carga se está mostrando, la ocultamos y reconfiguramos para notificación
  const spinner = document.querySelector(".spinner");
  if (spinner) spinner.style.display = "none";

  loadingMessage.innerText = message;

  // Configuramos el estilo para éxito o error
  const box = document.getElementById("loading-box");
  if (isError) {
    box.style.border = "2px solid var(--neon-pink)";
    box.style.boxShadow = "0 0 15px var(--neon-pink)";
  } else {
    box.style.border = "2px solid var(--neon-cyan)";
    box.style.boxShadow = "0 0 15px var(--neon-cyan)";
  }

  loadingOverlay.classList.remove("hidden");

  // Oculta automáticamente
  if (duration > 0) {
    setTimeout(() => {
      hideLoading();
    }, duration);
  }
}

/**
 * Oculta el modal de carga/notificación y resetea estilos.
 */
function hideLoading() {
  loadingOverlay.classList.add("hidden");
  // Reseteamos el estilo del modal
  const box = document.getElementById("loading-box");
  box.style.border = "";
  box.style.boxShadow = "";
}

// --- FUNCIONES DE AUTENTICACIÓN Y ROLES ---

async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error al obtener perfil:", error.message);
    return "client";
  }
  return data.role;
}

/**
 * Verifica el estado de la sesión, obtiene el ROL del usuario y actualiza la UI
 * para mostrar la navegación de administrador o la vista de cliente.
 */
async function checkUserSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = await fetchUserProfile(user.id);

    // 1. Asignar rol y mostrar contenedores principales
    userRole = role;
    authContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");

    console.log("Usuario autenticado:", user.email, "ROL:", userRole);

    // 2. LÓGICA DE ROLES: Control de Navegación y Vistas
    if (userRole === "admin") {
      console.log("Modo Administración activado. Mostrando navegación.");
      adminNav.classList.remove("hidden"); // Muestra la barra de navegación

      // Por defecto, mostramos la vista de Calendario
      calendarView.classList.remove("hidden");
      cronogramaView.classList.add("hidden");
    } else {
      console.log("Modo Cliente/Reserva activado. Ocultando navegación.");
      adminNav.classList.add("hidden"); // Oculta la barra de navegación

      // El cliente solo ve la vista de Calendario/Reserva
      calendarView.classList.remove("hidden");
      cronogramaView.classList.add("hidden");
    }

    // 3. Mostrar el calendario (ya está dentro de calendarView)
    calendarContainer.classList.remove("hidden");

    // 4. Corrección de calendario: fuerza el redibujo y recarga de eventos
    if (calendar) {
      calendar.refetchEvents(); // Carga las citas según el nuevo userRole
      setTimeout(() => {
        calendar.updateSize();
      }, 50);
    }
  } else {
    // Usuario no logueado: Ocultamos app, navegación y calendario
    userRole = "client";
    authContainer.classList.remove("hidden");
    appContainer.classList.add("hidden");
    calendarContainer.classList.add("hidden");

    // CRÍTICO: Asegurarse de que la navegación de admin esté oculta al cerrar sesión
    if (adminNav) {
      adminNav.classList.add("hidden");
    }
  }
}

/**
 * Maneja el inicio de sesión.
 */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const loginBtn = document.getElementById("login-btn");

  loginBtn.innerText = "Iniciando...";
  loginBtn.disabled = true;

  showLoading("Iniciando sesión...");

  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  hideLoading();

  if (error) {
    showNotificationModal(
      "Error de inicio de sesión: " + error.message,
      true,
      5000
    );
  } else {
    showNotificationModal("¡Bienvenido!", false, 3000);
    checkUserSession();
  }

  loginBtn.innerText = "Iniciar Sesión";
  loginBtn.disabled = false;
}

/**
 * Maneja el registro de nuevos usuarios.
 */
async function handleSignUp(e) {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const signupBtn = document.getElementById("signup-btn");

  signupBtn.innerText = "Registrando...";
  signupBtn.disabled = true;

  showLoading("Creando cuenta...");

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {},
    },
  });

  hideLoading();

  if (error) {
    showNotificationModal("Error de registro: " + error.message, true, 5000);
  } else if (
    data.user &&
    data.user.identities &&
    data.user.identities.length > 0
  ) {
    // Registro exitoso, si no requiere confirmación por email, inicia sesión
    showNotificationModal("¡Cuenta creada exitosamente! Bienvenido.");
    checkUserSession();
  } else if (data.user && !data.user.identities) {
    // Supabase por defecto envía un correo de confirmación.
    showNotificationModal(
      "¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar tu cuenta y poder iniciar sesión.",
      false,
      7000
    );

    // Volvemos al login después de la alerta
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  } else {
    showNotificationModal(
      "Ocurrió un error inesperado al registrar la cuenta.",
      true
    );
  }

  signupBtn.innerText = "Registrarse";
  signupBtn.disabled = false;
}

/**
 * Cierra la sesión del usuario.
 */
async function handleLogout() {
  showLoading("Cerrando sesión...");

  const { error } = await supabase.auth.signOut();

  hideLoading();

  if (error) {
    showNotificationModal("Error al cerrar sesión: " + error.message, true);
  } else {
    showNotificationModal("Sesión cerrada.");
    checkUserSession();
  }
}

/**
 * Carga TODAS las citas para el admin y las renderiza en una tabla HTML.
 */
async function renderCronograma() {
  cronogramaDetails.innerHTML =
    '<p class="loading-message">Cargando citas...</p>';

  // Consulta para obtener todas las citas ordenadas por fecha y hora
  const { data: citas, error } = await supabase
    .from("citas")
    .select("fecha, hora, nombre, telefono, correo")
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) {
    cronogramaDetails.innerHTML = `<p class="error-message">Error al cargar datos: ${error.message}</p>`;
    return;
  }

  if (citas.length === 0) {
    cronogramaDetails.innerHTML =
      '<p class="no-data-message">No hay citas agendadas.</p>';
    return;
  }

  // Generar la tabla HTML
  let tableHTML = `
        <table class="cronograma-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                </tr>
            </thead>
            <tbody>
    `;

  citas.forEach((cita) => {
    tableHTML += `
            <tr>
                <td>${cita.fecha}</td>
                <td>${cita.hora}</td>
                <td>${cita.nombre}</td>
                <td>${cita.telefono}</td>
                <td>${cita.correo}</td>
            </tr>
        `;
  });

  tableHTML += `
            </tbody>
        </table>
    `;

  cronogramaDetails.innerHTML = tableHTML;
}

// --- FUNCIONES DE LA VENTANA MODAL (CON LÓGICA DE ROLES) ---

/**
 * Muestra las horas disponibles, cargando más detalles si el usuario es 'admin'.
 */
async function openHoursModal(date) {
  document.getElementById("selected-date-span").innerText = date;
  overlay.classList.remove("hidden");
  modalHours.classList.remove("hidden");
  modalForm.classList.add("hidden");

  const grid = document.getElementById("hours-grid");
  grid.innerHTML = '<p style="color:white;">Verificando disponibilidad...</p>';

  // --- PASO A: Consultar citas existentes en esa fecha (Lógica de Roles) ---
  // Si es ADMIN, obtenemos el nombre y teléfono para la vista de gestión
  const { data: citasOcupadas, error } = await supabase
    .from("citas")
    .select(userRole === "admin" ? "hora, nombre, telefono" : "hora")
    .eq("fecha", date);

  if (error) {
    console.error("Error al cargar citas:", error.message);
    grid.innerHTML = '<p style="color:red;">Error al cargar datos.</p>';
    return;
  }

  // Mapeamos las citas por hora para fácil acceso
  const citasPorHora = {};
  if (citasOcupadas) {
    citasOcupadas.forEach((cita) => {
      citasPorHora[cita.hora] = cita;
    });
  }

  // --- PASO B: Generar los botones ---
  grid.innerHTML = "";
  const horarios = [
    "06:00 AM",
    "08:30 AM",
    "11:00 AM",
    "06:00 PM",
    "15:00",
    "16:00",
    "17:00",
  ];

  horarios.forEach((hora) => {
    const cita = citasPorHora[hora];
    const isBooked = !!cita;

    let btn = document.createElement("div");
    btn.className = "time-slot";
    btn.innerText = hora;

    if (isBooked) {
      btn.classList.add("booked");

      if (userRole === "admin") {
        // VISTA ADMIN: Muestra detalles y permite clic para ver info
        btn.innerText = `${hora} - Reservado: ${cita.nombre}`;

        btn.onclick = () => {
          // Usamos el modal de notificación para mostrar detalles de la cita
          showNotificationModal(
            `Detalles:\nCliente: ${cita.nombre}\nTeléfono: ${cita.telefono}\nFecha: ${date} Hora: ${hora}`,
            false,
            7000 // Dejamos el modal visible más tiempo para que lo lea
          );
        };

        // Estilos para ADMIN (lo hace cliqueable y visible)
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      } else {
        // VISTA CLIENTE: Bloquea la hora completamente
        btn.innerText += " (Reservado)";
        btn.style.cursor = "not-allowed";
        btn.style.pointerEvents = "none"; // Deshabilita el clic para agendar
      }
    } else {
      // Si está LIBRE (para ambos roles), asignamos el evento clic para agendar
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

document
  .getElementById("booking-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.querySelector(".btn-confirm");
    const originalText = btn.innerText;
    btn.innerText = "Subiendo Comprobante...";
    btn.disabled = true;

    // --- PASO 1: SUBIR IMAGEN ---
    const fileInput = document.getElementById("inp-comprobante");
    const file = fileInput.files[0];

    if (!file) {
      showNotificationModal(
        "Debes seleccionar la imagen del comprobante.",
        true
      );
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }

    showLoading("Subiendo comprobante...");

    const fileName = `${Date.now()}_${file.name.replace(/\s/g, "")}`;

    const { error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(fileName, file);

    hideLoading();

    if (uploadError) {
      showNotificationModal(
        "Error subiendo imagen: " + uploadError.message,
        true,
        5000
      );
      btn.innerText = originalText;
      btn.disabled = false;
      return;
    }

    const { data: urlData } = supabase.storage
      .from("comprobantes")
      .getPublicUrl(fileName);

    const imagenUrl = urlData.publicUrl;

    btn.innerText = "Confirmando Cita...";
    showLoading("Confirmando cita...");

    const datos = {
      fecha: currentSelection.date,
      hora: currentSelection.time,
      nombre: document.getElementById("inp-name").value,
      telefono: document.getElementById("inp-phone").value,
      correo: document.getElementById("inp-email").value,
      comprobante: imagenUrl,
    };

    const { error: dbError } = await supabase.from("citas").insert([datos]);

    hideLoading();

    if (dbError) {
      showNotificationModal(
        "Error al guardar datos: " + dbError.message,
        true,
        5000
      );
    } else {
      showNotificationModal("¡Cita Agendada Exitosamente!");
      closeModal();
      document.getElementById("booking-form").reset();
    }

    btn.innerText = originalText;
    btn.disabled = false;
  });

// --- LÓGICA PRINCIPAL Y EVENT LISTENERS ---

document.addEventListener("DOMContentLoaded", function () {
  // 1. Asignar Event Listeners de Autenticación
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignUp);
  }

  // Manejo de la alternancia entre Login y Registro
  if (showSignupBtn) {
    showSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
    });
  }
  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    });
  }

  // <--- LISTENERS DE NAVEGACIÓN ADMIN --->
  if (navCalendarBtn) {
    navCalendarBtn.addEventListener("click", () => {
      calendarView.classList.remove("hidden");
      cronogramaView.classList.add("hidden");
      navCalendarBtn.classList.add("active");
      navCronogramaBtn.classList.remove("active");
      calendar.updateSize(); // Para redibujar el calendario
    });
  }

  if (navCronogramaBtn) {
    navCronogramaBtn.addEventListener("click", () => {
      calendarView.classList.add("hidden");
      cronogramaView.classList.remove("hidden");
      navCalendarBtn.classList.remove("active");
      navCronogramaBtn.classList.add("active");

      // Cargar los datos solo si se hace clic y eres admin
      if (userRole === "admin") {
        renderCronograma();
      }
    });
  }
  // ----------------------------------------

  // 2. Verificar el estado de la sesión
  checkUserSession();

  // 3. Inicializar FullCalendar
  var calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    firstDay: 0,
    headerToolbar: { left: "prev", center: "title", right: "next" },
    showNonCurrentDates: true,
    events: async function (fetchInfo, successCallback, failureCallback) {
      // Esta función recarga los eventos del calendario
      const { data: citas, error } = await supabase
        .from("citas")
        .select("fecha, hora");

      if (error) {
        console.error("Error cargando eventos:", error);
        failureCallback(error);
        return;
      }

      // Convertir los datos a formato de FullCalendar
      const events = citas.map((cita) => ({
        title: userRole === "admin" ? "RESERVADO" : "Ocupado",
        start: cita.fecha,
        extendedProps: {
          time: cita.hora, // Guardamos la hora para el modal
        },
        // Personalización de estilos según el rol
        color: userRole === "admin" ? "var(--neon-pink)" : "#333", // Admin ve más color
        display: "block",
      }));

      successCallback(events);
    },

    dateClick: function (info) {
      let clickedDate = new Date(info.dateStr);
      let today = new Date();
      today.setHours(0, 0, 0, 0);

      if (clickedDate < today) {
        showNotificationModal("No puedes agendar en una fecha pasada.", true);
        return;
      }

      currentSelection.date = info.dateStr;
      openHoursModal(info.dateStr);
    },
  });

  calendar.render();
});

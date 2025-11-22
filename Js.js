document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth",
    },
    dateClick: function (info) {
      selectedDate = info.dateStr;
      openModal(selectedDate);
    },
    events: [],
  });

  calendar.render();

  let selectedDate = "";

  window.openModal = function (date) {
    const hours = [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
    ];
    const container = document.getElementById("hoursContainer");
    container.innerHTML = "";

    hours.forEach((hour) => {
      const btn = document.createElement("button");
      btn.textContent = hour;

      btn.onclick = function () {
        const title = prompt("Ingrese el recordatorio:");
        if (title) {
          calendar.addEvent({
            title: title,
            start: date + "T" + hour,
          });
        }
        closeModal();
      };

      container.appendChild(btn);
    });

    document.getElementById("hourModal").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  };

  window.closeModal = function () {
    document.getElementById("hourModal").style.display = "none";
    document.getElementById("overlay").style.display = "none";
  };
});

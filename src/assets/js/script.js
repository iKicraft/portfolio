'use strict';

// Función de toggle de clases
const elementToggleFunc = function (elem) {
	if (elem) elem.classList.toggle("active");
};

// Sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn && sidebar) {
	sidebarBtn.addEventListener("click", function () {
		elementToggleFunc(sidebar);
	});
}

// Custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

if (select) {
	select.addEventListener("click", function () {
		elementToggleFunc(this);
	});
}

selectItems.forEach((item) => {
	item.addEventListener("click", function () {
		const selectedValue = this.innerText.toLowerCase();
		if (selectValue) selectValue.innerText = this.innerText;
		elementToggleFunc(select);
		filterFunc(selectedValue);
	});
});

// Filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {
	filterItems.forEach((item) => {
		if (selectedValue === "all" || selectedValue === item.dataset.category) {
			item.classList.add("active");
		} else {
			item.classList.remove("active");
		}
	});
};

let lastClickedBtn = filterBtn[0];

filterBtn.forEach((btn) => {
	btn.addEventListener("click", function () {
		const selectedValue = this.innerText.toLowerCase();
		if (selectValue) selectValue.innerText = this.innerText;

		filterFunc(selectedValue);

		lastClickedBtn.classList.remove("active");
		this.classList.add("active");
		lastClickedBtn = this;
	});
});

// Formulario de contacto
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

if (form) {
	formInputs.forEach((input) => {
		input.addEventListener("input", function () {
			if (form.checkValidity()) {
				formBtn.removeAttribute("disabled");
			} else {
				formBtn.setAttribute("disabled", "");
			}
		});
	});
}

// Variables de navegación
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// Evento para cada enlace del navbar
navigationLinks.forEach((enlace) => {
  enlace.addEventListener("click", () => {
    // Quitar clase "active" de todos los enlaces y secciones
    navigationLinks.forEach((link) => link.classList.remove("active"));
    pages.forEach((seccion) => seccion.classList.remove("active"));

    // Agregar clase "active" al enlace y sección seleccionados
    enlace.classList.add("active");

    // Normalizar el nombre de la página
    const paginaSeleccionada = enlace.textContent.trim().toLowerCase();
    const paginaObjetivo = document.querySelector(`[data-page="${paginaSeleccionada}"]`);

    if (paginaObjetivo) {
      paginaObjetivo.classList.add("active");
    } else {
      console.error(`No se encontró la sección con data-page="${paginaSeleccionada}"`);
    }

    // Desplazar al inicio de la página
    window.scrollTo(0, 0);
  });
});


// Pop-Ups para los proyectos
document.addEventListener("DOMContentLoaded", function () {
	const elementosProyecto = document.querySelectorAll(".clients-item");
	const modalProyecto = document.getElementById("project-modal");
	const imagenModal = document.getElementById("modal-img");
	const tituloModal = document.getElementById("modal-title");
	const descripcionModal = document.getElementById("modal-info");
	const botonCerrar = document.querySelector(".close-btn");

	if (elementosProyecto.length > 0 && modalProyecto) {
		elementosProyecto.forEach((proyecto) => {
			proyecto.addEventListener("click", () => {
				const rutaImagen = proyecto.querySelector("img").src;
				const tituloImagen = proyecto.querySelector("img").alt;
				const textoDescripcion = proyecto.getAttribute("data-info");

				imagenModal.src = rutaImagen;
				imagenModal.alt = tituloImagen;
				tituloModal.textContent = tituloImagen;
				descripcionModal.textContent = textoDescripcion;

				modalProyecto.style.display = "flex";
			});
		});

		botonCerrar.addEventListener("click", () => {
			modalProyecto.classList.add("hide");
			setTimeout(() => {
				modalProyecto.style.display = "none";
				modalProyecto.classList.remove("hide");
			}, 200);
		});

		window.addEventListener("click", (evento) => {
			if (evento.target === modalProyecto) {
				modalProyecto.classList.add("hide");
				setTimeout(() => {
					modalProyecto.style.display = "none";
					modalProyecto.classList.remove("hide");
				}, 200);
			}
		});
	}
});

// Brief tremble effect every ~3 seconds on avatar, skills, services, and projects
document.addEventListener("DOMContentLoaded", function () {
  const avatar = document.querySelector('.avatar-box img');
  const skillCards = document.querySelectorAll('.skills-item .content-card');
  const serviceCards = document.querySelectorAll('.service-item .content-card');
  const projectItems = document.querySelectorAll('.clients-item');
  const shakeClasses = ['shake-1', 'shake-2', 'shake-3', 'shake-4'];

  function applyShake(el, index) {
    if (!el) return;
    const cls = shakeClasses[index % shakeClasses.length];
    el.classList.add(cls);
    const onEnd = function () {
      el.classList.remove(cls);
      el.removeEventListener('animationend', onEnd);
    };
    el.addEventListener('animationend', onEnd);
  }

  function cycleShake() {
    // Build potential targets
    const targets = [];
    if (avatar) targets.push({ type: 'avatar', el: avatar });
    if (skillCards && skillCards.length) targets.push({ type: 'skills', els: Array.from(skillCards) });
    if (serviceCards && serviceCards.length) targets.push({ type: 'services', els: Array.from(serviceCards) });
    if (projectItems && projectItems.length) targets.push({ type: 'projects', els: Array.from(projectItems) });

    // Shuffle targets to randomize which groups animate
    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }

    const groupsToShake = Math.random() < 0.6 ? 1 : 2; // 60% chance to shake 1 group, 40% to shake 2
    for (let i = 0; i < groupsToShake && i < targets.length; i++) {
      const g = targets[i];
      if (g.el) {
        const idx = Math.floor(Math.random() * shakeClasses.length);
        applyShake(g.el, idx);
      } else if (g.els && g.els.length) {
        const el = g.els[Math.floor(Math.random() * g.els.length)];
        const idx = Math.floor(Math.random() * shakeClasses.length);
        applyShake(el, idx);
      }
    }
  }

  // Initial delay before first tremble, then every 3 seconds
  setTimeout(cycleShake, 1200);
  setInterval(cycleShake, 3000);
});

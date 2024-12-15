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

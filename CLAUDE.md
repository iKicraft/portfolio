# CLAUDE.md

Reglas de trabajo para este repositorio (portfolio personal). Léelas antes de tocar código.

## Qué es este proyecto

- Portfolio personal estático: **HTML + CSS + JavaScript vanilla**, sin build tool, sin
  bundler, sin `package.json` ni gestor de paquetes.
- Basado originalmente en la plantilla "vCard - Personal portfolio" (ver [src/README.md](src/README.md)),
  personalizado con datos y proyectos propios.
- Estructura principal:
  - [src/index.html](src/index.html) — página principal (734 líneas).
  - [src/assets/css/style.css](src/assets/css/style.css) — estilos (2607 líneas).
  - [src/assets/js/script.js](src/assets/js/script.js) — interactividad (209 líneas).
  - `src/assets/images/`, `src/assets/icons/`, `src/assets/certs/` — recursos estáticos.
  - `src/cv_online/` — versión HTML del CV, independiente del portfolio principal.
  - `CV.pdf` (raíz y `src/`) — currículum en PDF.
- No hay tests, linter ni CI configurados en el repo. No asumir que existen.

## Reglas generales

1. **No asumir nada que no esté verificado en el código.** Si algo no es evidente
   (estructura, dependencias, convenciones, propósito de un bloque), preguntar antes
   de actuar en lugar de adivinar.
2. **No tocar código si hay dudas.** Ante cualquier ambigüedad sobre qué cambiar, cómo
   hacerlo, o si podría romper algo visual/funcional, preguntar primero. Nunca "probar
   a ver si funciona" directamente sobre el repo real.
3. **Cambios quirúrgicos.** Editar solo lo que se pidió. No refactorizar, reordenar ni
   "mejorar" código no solicitado en el mismo cambio.
4. **Confirmar antes de acciones difíciles de revertir**: borrar archivos, reescribir
   historial de git, hacer `push` o `force push`, sobrescribir imágenes/assets.
5. **Preguntar antes de instalar herramientas nuevas** (linters, bundlers, frameworks)
   si no fueron pedidas explícitamente — este proyecto es intencionalmente simple.

## Codificación y texto

- **Todos los archivos de texto deben guardarse en UTF-8 con BOM.**
- **Usar tildes y acentos correctamente en todo texto en español** (código, comentarios,
  contenido HTML visible, commits): á, é, í, ó, ú, ñ, ü, ¿, ¡, etc. Nunca reemplazar por
  versiones sin tilde.
- Si un archivo existente está en otra codificación (por ejemplo, el `README.md` de la
  raíz está en UTF-16), no cambiar su codificación sin confirmar con el usuario primero.
- Verificar que el editor/herramienta no rompa tildes existentes al guardar (evitar
  mojibake tipo `Ã©`, `Ã±`).

## Git

- No hacer `commit` ni `push` salvo que el usuario lo pida explícitamente.
- Si se pide commitear, usar mensajes claros; no mezclar cambios no relacionados.
- Hay una rama remota adicional (`añadiendo-skills-al-perfil-1f48c`) además de `main`;
  confirmar en qué rama trabajar si no es obvio.

## Al dudar

Preguntar. Siempre es preferible una pregunta de más que un cambio incorrecto sobre un
sitio en producción.

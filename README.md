# Cómo actualizar las preguntas del formulario

El formulario se genera automáticamente a partir de un único archivo:

```
questions.yaml
```

No hay que tocar ningún otro archivo para añadir, cambiar o reordenar preguntas.
En cuanto el cambio se sube a GitHub, el formulario se actualiza solo.

---

## La estructura básica

Cada **paso** del formulario tiene este aspecto:

```yaml
- titulo: "Rotondas"
  preguntas:
    - id: num_rotondas
      pregunta: "¿Cuántas rotondas hay en vuestro pueblo o ciudad?"
      ejemplo: "Número aproximado"
```

- **titulo** → el título que aparece en grande en esa pantalla
- **pregunta** → el texto de la pregunta que ve el usuario
- **ejemplo** → texto en gris dentro del campo (desaparece al escribir)
- **id** → nombre interno, ver más abajo

---

## Agrupar preguntas en la misma pantalla

Si un paso tiene varias `preguntas:`, todas aparecen juntas en la misma pantalla:

```yaml
- titulo: "Rotondas"
  preguntas:
    - id: num_rotondas
      pregunta: "¿Cuántas rotondas hay en vuestro pueblo o ciudad?"
      ejemplo: "Número aproximado"
    - id: rotonda_polemica
      pregunta: "¿Alguna controvertida por algún motivo?"
      ejemplo: "La que más comentarios genera"
```

Para que vayan en pantallas separadas, ponlas en bloques distintos:

```yaml
- titulo: "Rotondas"
  preguntas:
    - id: num_rotondas
      pregunta: "¿Cuántas rotondas hay en vuestro pueblo o ciudad?"
      ejemplo: "Número aproximado"

- titulo: "Proyectos polémicos"
  preguntas:
    - id: rotonda_polemica
      pregunta: "¿Alguna controvertida por algún motivo?"
      ejemplo: "La que más comentarios genera"
```

---

## Añadir una pregunta nueva

1. Decide si va sola (nuevo bloque) o junto a otra (añadir al bloque existente)
2. Copia un bloque existente y pégalo donde quieras
3. Cambia `titulo`, `pregunta` y `ejemplo`
4. Pon un `id` nuevo, en minúsculas y sin espacios (ej: `baile_tipico`)

El `id` nuevo creará automáticamente una columna nueva en Google Sheets
la primera vez que alguien envíe el formulario.

---

## Cambiar el texto de una pregunta

Edita directamente el texto después de `pregunta:`. El `id` no cambia.

---

## Reordenar pasos

Corta y pega el bloque entero (desde el `-` de `- titulo:` hasta antes del siguiente `-`).

---

## Lo único que NO se debe cambiar: el `id`

El `id` es el nombre de la columna en Google Sheets.
Si cambias un `id` de una pregunta que ya tiene respuestas guardadas,
esas respuestas quedarán huérfanas en la columna vieja y la nueva
columna aparecerá vacía.

Si necesitas cambiar un `id` por alguna razón, avisa antes para
renombrar también la columna en Google Sheets.

---

## Cómo subir los cambios a GitHub

Si editas el archivo directamente en GitHub (opción más sencilla):

1. Abre el archivo `questions.yaml` en el repositorio
2. Haz clic en el lápiz (✏️ Edit this file)
3. Haz los cambios
4. Abajo del todo, haz clic en **Commit changes**
5. En unos segundos el formulario ya está actualizado

Si editas en tu ordenador, guarda el archivo y haz un `git push` normal.

---

## Resumen rápido

| Quiero...                        | Hago...                                      |
|----------------------------------|----------------------------------------------|
| Cambiar el texto de una pregunta | Edito `pregunta:` en el bloque correspondiente |
| Cambiar el ejemplo en gris       | Edito `ejemplo:`                             |
| Añadir una pregunta              | Copio un bloque, cambio `titulo`, `pregunta`, `ejemplo` e `id` |
| Eliminar una pregunta            | Borro el bloque entero                       |
| Agrupar dos preguntas            | Las pongo bajo el mismo `- titulo:`          |
| Separar dos preguntas            | Las pongo en bloques distintos               |
| Reordenar                        | Corto y pego el bloque donde quiera          |
| Ver los cambios                  | Subo a GitHub, abro el formulario            |

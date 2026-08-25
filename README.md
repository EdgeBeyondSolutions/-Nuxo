# Nuxo — CRM de prospectos

Un CRM personal inspirado en la filosofía de Zoho: pipeline por etapas (kanban), lista de
prospectos con filtros, ficha de contacto con timeline de actividad y tareas de seguimiento —
sin la lentitud de un CRM tradicional. Sin build step — HTML/CSS/JS plano — listo para GitHub
Pages. Los datos se sincronizan en la nube vía Firebase para que accedas desde cualquier
dispositivo.

## 1. Crea tu proyecto de Firebase (gratis, ~5 min)

Esta parte la tienes que hacer tú (crear cuentas no es algo que pueda hacer por ti):

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) e inicia sesión con
   tu cuenta de Google.
2. **Crear un proyecto** → dale un nombre (ej. "nuxo-crm") → puedes desactivar Google Analytics,
   no lo necesitas.
3. En el menú lateral ve a **Build → Authentication** → pestaña **Sign-in method** → activa
   **Email/Password**.
4. Ve a **Build → Firestore Database** → **Create database** → elige la región más cercana →
   inicia en **production mode**.
5. Una vez creada, ve a la pestaña **Rules** y reemplaza el contenido con esto (solo tú,
   autenticado, puedes leer/escribir tus propios datos):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   Publica los cambios.

6. Ve a **Project settings** (ícono de engranaje) → baja hasta **Your apps** → clic en el ícono
   `</>` (Web) → dale un nombre a la app → **Register app**.
7. Copia el objeto `firebaseConfig` que te muestra y pégalo en
   [`js/firebase-config.js`](js/firebase-config.js), reemplazando los valores de ejemplo.

## 2. Pruébalo localmente

Los módulos ES necesitan servirse por HTTP (no `file://`). Desde esta carpeta:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`. Crea tu cuenta desde la pantalla de login ("¿Primera vez? Crea tu
cuenta") con tu correo y una contraseña.

## 3. Publícalo en GitHub Pages

```bash
git init
git add .
git commit -m "Nuxo: CRM de prospectos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/nuxo.git
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Source → Deploy from a branch → main / (root)**. En un par
de minutos tu app estará en `https://TU_USUARIO.github.io/nuxo/`.

> `js/firebase-config.js` contiene claves públicas del cliente de Firebase (no son secretos —
> están protegidas por las reglas de seguridad de Firestore del paso 1.5), así que es seguro
> subirlo a un repo público.

## Cómo funciona

- **Dashboard** — vista rápida: prospectos totales, valor en pipeline, ganados este mes, tareas
  vencidas, y distribución por etapa.
- **Pipeline** — tablero kanban: arrastra un prospecto entre columnas para cambiar su etapa (se
  registra automáticamente en su timeline de actividad).
- **Prospectos** — tabla con búsqueda, filtro por etapa/fuente y orden por columna. Clic en una
  fila abre la ficha completa.
- **Ficha de prospecto** — datos de contacto editables, timeline de notas/llamadas/emails/
  reuniones, y tareas de seguimiento con checkbox.
- **Tareas** — vista global de pendientes, vencidas y completadas, cruzando todos los prospectos.

## Atajos de teclado

- `N` — nuevo prospecto
- `/` — buscar
- `Esc` — cerrar cualquier panel/modal

## Fuera de alcance (v1)

Etapas de pipeline personalizables desde la UI, multi-usuario/equipos, reportes avanzados,
integraciones de email, importación masiva de contactos (CSV) — se pueden agregar después.

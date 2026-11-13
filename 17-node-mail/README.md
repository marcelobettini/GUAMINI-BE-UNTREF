# ✉️ Registro con confirmación por email

### Express + MySQL + Nodemailer, paso a paso

En este tutorial vas a construir algo que usaste cientos de veces como usuario pero quizás nunca armaste desde adentro: **el "Confirmá tu email" que te llega después de registrarte en una página.**

Al terminar vas a entender:

- cómo un programa Node.js **envía emails de verdad** (ese es el tema estrella: **Nodemailer**),
- por qué la cuenta **no se crea** cuando te registrás, sino cuando hacés clic en el link,
- cómo se guardan contraseñas y tokens **sin comprometer a nadie** si se filtra la base de datos,
- cómo se **testea** código que manda emails sin mandar ni uno.

> 💡 **Cómo usar este tutorial:** leelo en orden, con el código abierto al lado. Cada sección te dice en qué archivo mirar. Si algo no funciona, andá directo a la sección de **errores frecuentes** (la 3.11): probablemente ya te pasó a alguien antes.

---

## Índice

1. [La idea general](#1-la-idea-general)
2. [Preparar el entorno](#2-preparar-el-entorno)
3. [Configurar el envío de emails (SMTP)](#3-configurar-el-envío-de-emails-smtp)
4. [Recorrido por el código, capa por capa](#4-recorrido-por-el-código-capa-por-capa)
5. [Probarlo a mano, de punta a punta](#5-probarlo-a-mano-de-punta-a-punta)
6. [Los tests](#6-los-tests)
7. [Seguridad: las decisiones y el porqué](#7-seguridad-las-decisiones-y-el-porqué)
8. [Limitaciones conocidas (sí, hay)](#8-limitaciones-conocidas-sí-hay)
9. [¿Y ahora qué? Ideas para seguir](#9-y-ahora-qué-ideas-para-seguir)
10. [Mini glosario](#10-mini-glosario)

---

## 1. La idea general

### El problema

Imaginá que alguien se registra con el email `ana@mail.com`. ¿Cómo sabemos que **realmente es Ana** y no alguien escribiendo el email de otra persona?

La solución clásica: **le mandamos un mensaje a esa casilla con un link secreto**. Sólo quien pueda leer esa casilla puede hacer clic. Si hace clic, queda demostrado que el email es suyo.

### El flujo completo

```
 Cliente                  API                        MySQL            Servidor SMTP
 (Postman, front)                                                     (Mailpit, Yahoo...)
    |                      |                           |                    |
    | 1. POST /register    |                           |                    |
    |--------------------->|                           |                    |
    |                      | 2. guarda un registro     |                    |
    |                      |    PENDIENTE + token      |                    |
    |                      |-------------------------->|                    |
    |                      | 3. manda el email con     |                    |
    |                      |    el link                |                    |
    |                      |------------------------------------------------>|
    |<---- 202 "revisá tu email"                                            |
    |                                                                       |
    |   (Ana abre su casilla y hace clic en el link)                        |
    |                                                                       |
    | 4. GET /confirm?token=...                                             |
    |--------------------->|                           |                    |
    |                      | 5. crea la CUENTA REAL    |                    |
    |                      |    y borra la pendiente   |                    |
    |                      |-------------------------->|                    |
    |<---- 201 "cuenta confirmada"                                          |
```

### La decisión clave: dos tablas

Fijate que hay **dos tablas**:

| Tabla | Qué guarda |
|---|---|
| `pending_registrations` | gente que **se registró pero todavía no confirmó** |
| `users` | **cuentas reales**, ya confirmadas |

Podrías preguntarte: *¿no sería más simple una sola tabla `users` con una columna `status` (`pendiente` / `confirmado`)?*

Es más simple de escribir, pero tiene una trampa. Cada consulta que escribas en el futuro (login, listados, búsquedas) tendría que **acordarse** de filtrar por `status`. El día que alguien se olvide, una cuenta que nadie confirmó puede entrar al sistema.

Con dos tablas ese error es **imposible**: `users` sólo contiene cuentas reales, punto.

> 🧠 **¿Y con JWT?** Otra idea sería meter los datos del registro dentro de un token JWT y mandarlo en el link, sin guardar nada en la base. Problema: una vez emitido, **no podés invalidarlo ni reemplazarlo** (por ejemplo, si el usuario pide un segundo link). Y estarías mandando información por email. Descartado.

### Qué endpoints tiene la API

| Método y ruta | Para qué | Respuesta OK |
|---|---|---|
| `POST /api/auth/register` | registrarse | `202 Accepted` |
| `GET /api/auth/confirm?token=...` | confirmar la cuenta (el link del email) | `201 Created` |
| `POST /api/auth/resend-confirmation` | pedir un link nuevo | `202 Accepted` |

Y los códigos de error:

| Código | Cuándo |
|---|---|
| `400` | datos inválidos, o link inválido/vencido/ya usado |
| `429` | demasiados intentos (rate limit) |
| `502` | no se pudo enviar el email (el SMTP falló) |

> ❓ **¿Por qué `202` y no `201` al registrarse?** `202 Accepted` significa "recibí tu pedido, queda algo pendiente". Es exactamente lo que pasa: todavía **no** se creó ninguna cuenta. El `201 Created` lo reservamos para cuando de verdad se crea (al confirmar).

---

## 2. Preparar el entorno

### 2.1 Qué necesitás instalado

- **Node.js 24 o superior** (`node -v` para comprobarlo).
- **MySQL** corriendo en tu máquina.
- **Mailpit**: un servidor de email *de mentira* para desarrollar (lo explicamos en 3.5). Se instala con `winget install axllent.mailpit`.

### 2.2 Instalar el proyecto

```bash
npm install
```

### 2.3 Qué hace cada dependencia

| Paquete | Para qué lo usamos |
|---|---|
| `express` | el servidor HTTP |
| `sequelize` + `mysql2` | hablar con MySQL sin escribir SQL a mano (ORM + driver) |
| `nodemailer` | ⭐ **enviar los emails** |
| `bcryptjs` | guardar contraseñas de forma segura (hash). Está escrito 100 % en JavaScript, así que no hay que compilar nada en Windows |
| `zod` | validar lo que nos mandan los clientes (¿es un email? ¿la clave es muy corta?) |
| `helmet` | agrega cabeceras HTTP de seguridad con una sola línea |
| `express-rate-limit` | frena a quien llama demasiadas veces seguidas |
| `jest` + `supertest` | los tests |

### 2.4 Módulos ES: la regla de las extensiones

En `package.json` vas a ver `"type": "module"`. Eso significa que usamos `import` / `export` (y no `require`). Hay una regla que te va a morder al principio:

> ⚠️ **En los imports relativos hay que escribir la extensión `.js`.**
>
> ```js
> import { env } from './env.js';   // ✅
> import { env } from './env';      // ❌ error
> ```

### 2.5 ¿Y `dotenv`? No lo necesitamos

Las variables de entorno (`.env`) sirven para **no escribir contraseñas dentro del código**. Antes hacía falta instalar `dotenv` para leerlas. Hoy Node trae `process.loadEnvFile()`. Mirá `src/config/env.js`:

1. intenta leer el archivo `.env` (si no existe, no pasa nada: en producción las variables las define la plataforma);
2. **convierte los valores a su tipo real**: en un `.env` todo es texto, así que `"3000"` se vuelve el número `3000` y `"true"` el booleano `true`;
3. da valores por defecto cómodos para desarrollo.

> 📝 **Una simplificación a propósito:** acá *no* validamos que el `.env` esté completo. En un proyecto real lo harías, pero queremos que te concentres en Nodemailer, no en validar configuración.

### 2.6 Crear las tablas

Abrí `db/schema.sql` en tu cliente de MySQL (Workbench, DBeaver, consola...) y ejecutalo completo. Crea dos bases (`node_email` para desarrollar, `node_email_test` para los tests) y las dos tablas.

Qué significa cada columna:

**`users`**

| Columna | Para qué |
|---|---|
| `id` | identificador automático |
| `email` | el email (**único**: no puede haber dos cuentas iguales) |
| `passwordHash` | la contraseña *transformada* con bcrypt (nunca en claro) |
| `confirmedAt` | cuándo confirmó |
| `createdAt`, `updatedAt` | los pone Sequelize solo |

**`pending_registrations`**: lo mismo, más:

| Columna | Para qué |
|---|---|
| `tokenHash` | el token del link, **transformado con SHA-256** (64 caracteres hex). Único |
| `expiresAt` | cuándo vence el link |

Y dos índices que conviene entender:

- `UNIQUE (email)`: sólo puede haber **un** registro pendiente por email. Si alguien se registra de nuevo, reemplaza al anterior.
- `INDEX (expiresAt)`: hace rápida la búsqueda de registros vencidos para borrarlos.

> La base `node_email_test` no necesita tablas: los tests las crean y destruyen solos.

### 2.7 Los archivos `.env`

Copiá las plantillas y completá tus datos:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

En ambos completá `DB_USER` y `DB_PASS` con tu usuario de MySQL.

| Variable | Qué significa |
|---|---|
| `PORT` | puerto de tu API (3000) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | cómo conectarse a MySQL |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | cómo conectarse al servidor de email (sección 3) |
| `MAIL_FROM` | el remitente que verá quien reciba el email |
| `APP_BASE_URL` | la dirección base para armar el link del email |
| `TOKEN_TTL_HOURS` | cuántas horas dura el link (24) |
| `BCRYPT_ROUNDS` | qué tan "costoso" es el hash. 12 en desarrollo; en `.env.test` es 4 para que los tests sean rápidos |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MIN` | máximo de llamadas permitidas por ventana de minutos |

> 🔒 **Regla de oro:** `.env` y `.env.test` **nunca** se suben a Git (ya están en `.gitignore`). Lo que sí se sube es `.env.example`, que es la plantilla **sin secretos**.

---

## 3. Configurar el envío de emails (SMTP)

Esta es la sección más importante del tutorial. Tomate tu tiempo.

### 3.1 ¿Qué es SMTP y qué hace Nodemailer?

Pensalo como el correo postal:

- **Nodemailer** es **vos**, armando la carta.
- El **servidor SMTP** es **la oficina de correos**: recibe la carta y se encarga de entregarla.

> Nodemailer **no envía el email por sí mismo**. Se lo *entrega* a un servidor SMTP, y ese servidor lo hace llegar a destino.

Todo esto vive en un único archivo: `src/services/mailer.js`.

- `nodemailer.createTransport({...})` crea el **transporte**: la conexión configurada hacia el servidor SMTP (dirección, puerto, cifrado, credenciales). Se crea **una sola vez** y se reutiliza, porque abrir una conexión nueva por cada email sería lento.
- `transporter.sendMail({ from, to, subject, html, text })` envía un mensaje.
- `transporter.verify()` hace una **conexión de prueba**. Al arrancar, `src/server.js` lo llama: si algo está mal configurado, te enterás **al instante** y no cuando el primer usuario se registre.

### 3.2 Las variables, una por una

| Variable | Qué es | De dónde sale | Si la ponés mal |
|---|---|---|---|
| `SMTP_HOST` | la dirección del servidor de correo | la documentación del proveedor (`localhost` con Mailpit) | `ENOTFOUND` o `ECONNREFUSED` |
| `SMTP_PORT` | el puerto al que conectarse | el proveedor (465, 587, 25...; 1025 en Mailpit) | `ECONNREFUSED` o `ETIMEDOUT` |
| `SMTP_SECURE` | si la conexión es cifrada desde el primer byte | depende del puerto (ver 3.3) | `wrong version number` |
| `SMTP_USER` | tu usuario en el servidor | el panel del proveedor (vacío en Mailpit) | `EAUTH` / `535` |
| `SMTP_PASS` | tu contraseña SMTP | el panel del proveedor (vacía en Mailpit) | `EAUTH` / `535` |
| `MAIL_FROM` | el remitente, con formato `"Nombre <correo@dominio>"` | una cuenta o dominio **tuyo** | el proveedor lo reescribe o rechaza |
| `APP_BASE_URL` | la dirección con la que el usuario abrirá el link | tu dominio público | el link del email no lleva a ningún lado |

### 3.3 `SMTP_SECURE` y los puertos

Esto confunde a casi todos la primera vez, así que va con una regla de bolsillo:

| Puerto | `SMTP_SECURE` | Qué pasa |
|---|---|---|
| **465** | `true` | la conexión nace **cifrada** (TLS) |
| **587** | `false` | nace sin cifrar y **sube a TLS** con STARTTLS si el servidor lo ofrece |
| 25 | `false` | igual que 587, pero muchos proveedores de internet y de nube **lo bloquean** |
| 1025 | `false` | el de Mailpit (sin cifrado, porque es local) |

> ⚠️ **Error típico:** poner `SMTP_SECURE=true` con el puerto 587 produce `wrong version number`. Regla: **465 → `true`, 587 → `false`**.

### 3.4 `SMTP_USER` y `SMTP_PASS`

- **Con Mailpit van vacíos.** No hay autenticación. El código lo contempla: si `SMTP_USER` está vacío, `mailer.js` no envía credenciales.
- **Con un proveedor real, casi nunca es tu contraseña de siempre.** Se usan **contraseñas de aplicación**, **API keys** o credenciales SMTP específicas. ¿Por qué? Porque si se filtran, las revocás sin cambiar la contraseña de tu cuenta.

### 3.5 `MAIL_FROM` y por qué tu email puede caer en spam

Formato: `"Nombre <correo@dominio>"`. En el `.env` va **entre comillas** porque tiene espacios y los símbolos `<` `>`:

```
MAIL_FROM="Mi App <no-reply@miapp.local>"
```

Con un proveedor real, el remitente suele **tener que coincidir con la cuenta autenticada** o con un dominio que hayas verificado. Si no coincide, el proveedor lo reescribe o directamente lo rechaza.

Y si enviás desde **un dominio propio**, necesitás tres registros DNS o tus emails terminan en spam:

- **SPF**: lista qué servidores tienen permiso para enviar en nombre de tu dominio.
- **DKIM**: una firma criptográfica que prueba que el mensaje no fue alterado.
- **DMARC**: le dice al receptor qué hacer si SPF o DKIM fallan.

### 3.6 `APP_BASE_URL`: la trampa del `localhost`

Es la dirección con la que **el usuario** abre el link del email. **No** es la de tu servidor.

- `http://localhost:3000` funciona **sólo si abrís el email en la misma computadora** donde corre la API. Para clase y desarrollo está perfecto.
- En producción tiene que ser tu dirección pública, por ejemplo `https://miapp.com`.

> Detalle: `src/config/env.js` le quita la barra final (`http://x.com/` → `http://x.com`) para que el link nunca quede con una doble barra `//api/auth/confirm`. Hay un test que lo verifica, y por eso `.env.test` termina en `/` a propósito.

### 3.7 Opción A, para desarrollar: Mailpit ⭐ (la recomendada)

Mailpit es un **servidor SMTP de mentira con una bandeja de entrada web**. Recibe todo lo que le mandes… y **no lo envía a ningún lado**. Perfecto para desarrollar: nunca le mandás un email por accidente a una persona real.

**Instalación en Windows:**

```powershell
winget install axllent.mailpit
```

Después **cerrá y volvé a abrir la terminal** (para que Windows actualice el PATH) y ejecutá:

```powershell
mailpit
```

- SMTP escuchando en el puerto `1025`.
- Bandeja web en 👉 http://localhost:8025

Tu `.env` queda así:

```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Mi App <no-reply@miapp.local>"
APP_BASE_URL=http://localhost:3000
```

> 🧭 Si después de instalar el comando `mailpit` "no se encuentra", casi seguro es el PATH. Cerrá todas las terminales y abrí una nueva. Si sigue igual, ejecutá el `.exe` con su ruta completa (está en `%LOCALAPPDATA%\Microsoft\WinGet\Packages\axllent.mailpit_Microsoft.Winget.Source_8wekyb3d8bbwe\`).

**Otras opciones parecidas:** *Ethereal* (una cuenta de prueba que genera el propio Nodemailer; necesita internet) y *Mailtrap* (una bandeja de pruebas en la nube; necesita crear cuenta).

### 3.8 Opción B: enviar de verdad con tu cuenta de Gmail o Yahoo

Ideal para el momento mágico de **ver llegar un email real** a tu celular.

#### Gmail

1. Activá la **verificación en dos pasos** en tu cuenta de Google.
2. Creá una **contraseña de aplicación** (16 caracteres) en la configuración de seguridad de la cuenta.
3. Completá el `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true                  # o 587 con false
SMTP_USER=tu.direccion@gmail.com
SMTP_PASS=abcdefghijklmnop        # la contraseña de aplicación, sin espacios
MAIL_FROM="Mi App <tu.direccion@gmail.com>"
```

#### Yahoo

Funciona igual que Gmail: **también exige contraseña de aplicación**, tu contraseña normal no sirve.

1. En tu cuenta de Yahoo, entrá a **Seguridad de la cuenta**.
2. Elegí **Generar contraseña de aplicación** y copiá la clave que te da.
3. Completá el `.env`:

```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_SECURE=true                  # o 587 con false
SMTP_USER=tu.direccion@yahoo.com
SMTP_PASS=la-contraseña-de-aplicacion
MAIL_FROM="Mi App <tu.direccion@yahoo.com>"
```

#### Cosas que tenés que saber (valen para ambos)

- ❌ **La contraseña normal no funciona.** Los proveedores dejaron de aceptarla para programas externos.
- 🔁 El proveedor suele **reescribir el `From`** a tu cuenta autenticada. Por eso ponemos tu misma dirección en `MAIL_FROM`.
- 📉 Las cuentas personales tienen un **límite diario de envíos** (en Gmail, del orden de 500 destinatarios por día; mirá el valor vigente). Sirve para aprender, **no para producción**.
- 🔐 **Nunca** subas el `.env` ni la contraseña de aplicación a un repositorio. Si se filtra, **revocala** desde el panel de tu cuenta.
- 🚀 Existe una alternativa más robusta, **OAuth2**, que Nodemailer también soporta. Queda como "siguiente paso": acá no la implementamos.

### 3.9 Opción C: otros proveedores

> ⚠️ Estas políticas **cambian seguido**. Antes de usarlos, mirá la documentación oficial vigente de cada proveedor.

| Proveedor | Host | Puerto / `SMTP_SECURE` | `SMTP_USER` | `SMTP_PASS` | Antes de empezar |
|---|---|---|---|---|---|
| Outlook / Microsoft 365 | `smtp.office365.com` | 587 / `false` | tu dirección | tu contraseña (o contraseña de app) | Microsoft está **deshabilitando la autenticación básica** por SMTP; puede requerir habilitarla o usar OAuth2 |
| SendGrid | `smtp.sendgrid.net` | 587 / `false` | literalmente `apikey` | tu API key | verificar el remitente |
| Amazon SES | `email-smtp.<región>.amazonaws.com` | 587 / `false` | credenciales SMTP propias (**no** son las claves IAM) | idem | verificar tu identidad y salir del *sandbox* |
| Mailgun | `smtp.mailgun.org` | 587 / `false` | algo como `postmaster@tu-dominio` | contraseña SMTP del dominio | verificar el dominio |
| Brevo | `smtp-relay.brevo.com` | 587 / `false` | tu login SMTP | tu clave SMTP | verificar el remitente |

### 3.10 ¿Cuál uso?

- 🧪 **Mailpit** → para desarrollar y practicar. Es lo que vas a usar el 95 % del tiempo.
- 👀 **Gmail o Yahoo** → para ver llegar **un email real** en un proyecto chico.
- 🏢 **Un proveedor transaccional** (SES, SendGrid, Mailgun, Brevo) con **dominio propio verificado** → para producción.

¿Por qué no producción con una cuenta personal? Porque hay límites diarios, puede dañar la reputación de tu cuenta y el proveedor **puede bloquearla** si detecta envíos automáticos.

### 3.11 ¿Quedó bien configurado? Errores frecuentes

Al ejecutar `npm start`, `verifyTransport()` te avisa enseguida si algo anda mal. Guía de supervivencia:

| Ves esto | Qué pasa | Cómo se arregla |
|---|---|---|
| `ECONNREFUSED` | no hay nadie escuchando en ese host/puerto | ¿Mailpit está corriendo? ¿`SMTP_HOST` y `SMTP_PORT` están bien? |
| `EAUTH` / `535` | usuario o contraseña incorrectos | en Gmail/Yahoo usá la **contraseña de aplicación** |
| `wrong version number` | combinación mal hecha de `SMTP_SECURE` y puerto | **465 → `true`**, **587 → `false`** |
| `ETIMEDOUT` | un firewall o tu proveedor de internet bloquea el puerto | probá con el 587 |
| el email llega a spam, o no llega | `MAIL_FROM` no verificado, o faltan SPF/DKIM | usá un remitente verificado |

### 3.12 Detalles que te pueden hacer perder una hora

- Los valores con **espacios**, `<`, `>` o `#` van **entre comillas** (el `#` inicia un comentario).
- **Sin espacios** alrededor del `=`: `PORT=3000`, no `PORT = 3000`.
- El `.env` se lee **una sola vez, al arrancar**. Si lo cambiás, **reiniciá el servidor**.

---

## 4. Recorrido por el código, capa por capa

Una API bien organizada separa responsabilidades. Cada archivo hace **una cosa**. Seguimos el camino de una request, de afuera hacia adentro:

```
request → app.js → rutas → validate → controller → services → modelos → MySQL
                                                       └──→ mailer → SMTP
```

### 4.1 Configuración

- **`src/config/env.js`**: ya lo vimos (2.5). Exporta un objeto `env` con todo tipado.
- **`src/config/database.js`**: crea la conexión de Sequelize a MySQL.

### 4.2 Modelos: `src/models/`

Un **modelo** es la representación de una tabla en código.

- `User.js` → la tabla `users` (cuentas reales).
- `PendingRegistration.js` → la tabla `pending_registrations`.

Dos detalles interesantes (están comentados en el código):

- En la base **guardamos el hash del token, nunca el token**. Si alguien lee tu base de datos, no puede armar links de confirmación válidos.
- Los modelos deben **coincidir con `db/schema.sql`**. Los tests recrean las tablas desde los modelos.

### 4.3 El mailer: `src/services/mailer.js` ⭐

Es **el único archivo que conoce a Nodemailer**. ¿Por qué aislarlo? Porque si mañana cambiás de librería o de proveedor, tocás un archivo y listo. Y porque los tests pueden reemplazarlo fácilmente.

Exporta cuatro cosas:

| Export | Para qué |
|---|---|
| `sendMail({ to, subject, html, text })` | envía un email |
| `verifyTransport()` | la conexión de prueba (se usa al arrancar) |
| `setTransporter(t)` | permite **inyectar un transporte falso** (los tests lo usan) |
| `EmailDeliveryError` | un error propio |

¿Por qué un error propio? Si el SMTP falla, Nodemailer lanza errores con formas internas raras. Los envolvemos en `EmailDeliveryError`, y el resto de la app sólo conoce *ese* error. Más adelante, el manejador de errores lo traduce a un `502`.

### 4.4 Las plantillas: `src/services/emailTemplates.js`

Son **funciones puras**: reciben datos y devuelven `{ subject, html, text }`. No tocan la red ni la base, así que se prueban con un simple `expect`.

Hay tres emails:

1. `confirmationEmail` → el de bienvenida con el link.
2. `resendEmail` → cuando pedís un link nuevo.
3. `accountExistsEmail` → cuando alguien intenta registrar un email que **ya tiene cuenta** (el dueño se entera, y el atacante no ve diferencia; más en la sección 7).

Tres detalles que valen oro:

- **HTML y texto plano.** Mandamos las dos versiones. Algunos clientes de correo no muestran HTML, y los filtros de spam desconfían de los emails que sólo traen HTML.
- **Estilos inline** (`style="..."` en cada etiqueta). Los clientes de correo **ignoran** `<style>` y las hojas de estilo externas. Sí, el HTML de emails es como el de 2005.
- **Escape de caracteres** (`escapeHtml`). Cualquier valor que se inserta en el HTML pasa por acá, para que un `<` o un `"` no rompa (ni inyecte) marcado.

### 4.5 El corazón: `src/services/registration.js`

Toda la lógica de negocio. No sabe nada de HTTP: recibe datos, hace cosas, devuelve resultados. Por eso se puede testear sin levantar un servidor.

#### El token

```js
const token = crypto.randomBytes(32).toString('hex');   // 64 caracteres aleatorios
const tokenHash = hashToken(token);                       // SHA-256 → esto va a la base
```

- Al usuario le llega **el token** (en el link).
- En la base queda **el hash**.
- Cuando vuelve con el link, calculamos el hash de lo que trae y lo **buscamos por igualdad**.

¿Por qué SHA-256 y no bcrypt (como en la contraseña)? Porque bcrypt es *lento a propósito* para frenar a quien adivina contraseñas humanas, que son predecibles. Un token de 256 bits aleatorios **no se puede adivinar**, así que no hace falta lentitud. Además bcrypt no permite buscar por igualdad.

#### `register({ email, password })`

1. **Normaliza el email**: `"  Ana@Mail.COM "` → `"ana@mail.com"`. Sin esto, la misma persona podría registrarse dos veces con distinto formato.
2. **Borra las pendientes vencidas** ("limpieza oportunista": cada registro aprovecha para ordenar la casa; así evitamos montar un proceso aparte).
3. **¿Ya existe una cuenta real con ese email?** No toca nada y le manda un aviso al dueño. Termina.
4. Si no: calcula el **hash de la contraseña** (bcrypt) y genera el token.
5. **`upsert`** en `pending_registrations`: si no había nada, inserta; si ya había una pendiente, la **reemplaza** (el token anterior deja de valer). Es una sola operación atómica, así que dos registros simultáneos no chocan entre sí.
6. **Envía el email.** Si falla, la pendiente **queda guardada**: el usuario puede pedir un reenvío cuando el SMTP vuelva.

#### `resendConfirmation({ email })`

Si hay una pendiente para ese email: genera un **token nuevo** (el anterior queda inservible) y manda el email. Si no hay, no hace nada y no falla.

#### `confirm(token)` — la parte más linda

Todo ocurre dentro de una **transacción** (todo o nada):

1. Busca la pendiente por `tokenHash` **y que no haya vencido**, con `lock: UPDATE`.
2. Si no la encuentra → `InvalidTokenError`.
3. Crea el `User` con el **mismo hash de contraseña** (no hay que recalcularlo).
4. Borra la pendiente.

> 🧠 **¿Para qué sirve el `lock`?** Imaginá que Ana hace **doble clic** y llegan dos requests casi a la vez. Con el lock, la segunda **espera** a que la primera termine; para entonces la pendiente ya no existe, y la segunda recibe un error limpio. **Nunca se crean dos cuentas.** Hay un test que dispara dos `confirm` en paralelo para comprobarlo.

Un detalle más: el token **inexistente, vencido o ya usado** produce **el mismo error**. Si distinguiéramos entre ellos, le regalaríamos información a quien prueba tokens al azar.

### 4.6 Middlewares: `src/middlewares/`

Un **middleware** es una función que se ejecuta *antes* del controlador y puede dejar pasar la request (`next()`) o cortarla.

- **`validate.js`**: recibe un esquema de **zod** y valida el cuerpo (o la query). Si falla → `400`. Si pasa, deja el resultado **ya limpio** en `req.validated`.
- **`rateLimit.js`**: limita cuántas veces una misma IP puede llamar en una ventana de tiempo. Se usa en `register` y `resend-confirmation`, porque **cada llamada envía un email**: sin límite, alguien podría usar tu API para bombardear de correos la casilla de un tercero.
- **`errorHandler.js`**: el **único lugar** donde los errores se convierten en respuestas HTTP:

  | Error | Respuesta |
  |---|---|
  | `InvalidTokenError` | `400` |
  | `EmailDeliveryError` | `502` |
  | error del cliente (ej. JSON mal formado) | `400` |
  | cualquier otro | `500` genérico |

  Los detalles internos (mensajes de SQL, del SMTP, el stack) se **imprimen en la consola del servidor pero nunca se devuelven** al cliente.

> 🔎 **Un truco de Express:** el manejador de errores se reconoce por tener **4 parámetros** `(err, req, res, next)`. Aunque no uses `next`, tiene que estar.

### 4.7 Controllers: `src/controllers/auth.controller.js`

Son **finitos a propósito**: toman los datos ya validados, llaman al servicio y responden. Nada de lógica de negocio acá. Fijate que no hay `try/catch`: **Express 5 captura solo los errores de las funciones `async`** y los manda al `errorHandler`.

También verás un mensaje `GENERIC` en las respuestas de `register` y `resend`: es siempre el mismo, exista o no el email (por qué, en la sección 7).

### 4.8 Rutas: `src/routes/auth.routes.js`

Un `express.Router()` normal, con las tres rutas y los **esquemas de zod**:

- **email**: se le hace `trim` y `toLowerCase` **antes** de validar el formato, y se limita a 255 caracteres.
- **password**: entre 8 y **72** caracteres. ¿Por qué 72? Porque bcrypt **ignora todo lo que pase de 72 bytes**. Preferimos rechazarlo antes que truncarlo en silencio.
- **token**: exactamente 64 caracteres hexadecimales. Si no tiene ese formato, ni siquiera consultamos la base.

### 4.9 `app.js` vs `server.js`

Esta separación parece un detalle, pero es clave:

- **`src/app.js`** *arma* la aplicación (helmet, JSON, rate limit, rutas, 404, manejador de errores) **pero no llama a `listen()`**. Así `supertest` puede usarla en los tests sin ocupar ningún puerto.
- **`src/server.js`** es el **arranque real**: verifica la conexión con MySQL, crea las tablas que falten (`sync()`, que **nunca modifica** las existentes), verifica el SMTP y recién entonces escucha. Si algo falla, **se detiene al instante** con un mensaje claro: "fallar rápido" es mejor que fallar en silencio.

---

## 5. Probarlo a mano, de punta a punta

¡La parte divertida! Vas a ver todo el flujo funcionando.

### Preparación

1. En una terminal: `mailpit` (queda corriendo).
2. En **otra** terminal: `npm start`.
   Tenés que ver: `API escuchando en http://localhost:3000`.
3. Abrí http://localhost:8025 en el navegador (la bandeja de Mailpit, vacía por ahora).

### Paso 1: registrarse

En PowerShell:

```powershell
curl.exe -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{\"email\":\"ana@mail.com\",\"password\":\"secreto123\"}'
```

✅ **Esperado:** `HTTP/1.1 202`. En Mailpit aparece el email. Y en MySQL:

```sql
SELECT * FROM users;                   -- vacío: ¡todavía no hay cuenta!
SELECT * FROM pending_registrations;   -- 1 fila
```

Mirá la fila: `tokenHash` es el hash, no el token. Y `passwordHash` no se parece en nada a `secreto123`.

### Paso 2: confirmar

Abrí el email en Mailpit y hacé clic en el botón (o copiá el link y usá `curl.exe -i "<link>"`).

✅ **Esperado:** `201`. Ahora `users` tiene **1 fila** y `pending_registrations` está **vacía**.

### Paso 3: probar los casos raros

- **Reabrí el mismo link** → `400`. Ya se usó.
- **Registrá de nuevo `ana@mail.com`** → `202`, **la misma respuesta de antes**. Pero en Mailpit llega otro email: *"Intento de registro con tu email"*. Ahí está la protección anti-enumeración funcionando.

### Paso 4: que falle el email

1. **Detené Mailpit** (Ctrl+C).
2. Registrá otro email → `502`. (¡Pero ojo!: el registro pendiente **sí quedó guardado**.)
3. **Volvé a levantar Mailpit.**
4. Pedí el reenvío:

```powershell
curl.exe -i -X POST http://localhost:3000/api/auth/resend-confirmation -H "Content-Type: application/json" -d '{\"email\":\"otro@mail.com\"}'
```

✅ **Esperado:** `202` y el email llega.

> 🏁 **Checkpoint:** si pasaste los cuatro pasos, ¡tu API funciona completa!

---

## 6. Los tests

```bash
npm test
```

### Cómo funciona el script de test

Mirá el script `test` en `package.json`:

```
node --env-file=.env.test --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand
```

- **`--env-file=.env.test`**: Node carga las variables de test **antes** de arrancar Jest. Tiene que hacerse desde la línea de comandos: Jest le da a cada test una copia aislada de `process.env`, así que cargarlas desde adentro no funcionaría.
- **`--experimental-vm-modules`**: Jest lo necesita para ejecutar módulos ES.
- **`--runInBand`**: los tests corren uno a la vez. Comparten la misma base de datos, así que en paralelo se pisarían.

### La barrera de seguridad `_test`

Los tests **borran las tablas** (`sync({ force: true })`). ¡Imaginá hacerlo sobre tu base de desarrollo! Por eso `setupDb()` en `tests/helpers.js` **se niega a correr** si el nombre de la base no termina en `_test`.

### ¿Cómo se testea código que manda emails?

**Sin mandar ninguno.** En `tests/helpers.js`:

- `installFakeTransport()` reemplaza el transporte SMTP por un **mock** (una función espía de Jest). El código real de `mailer.js` **sí se ejecuta**; sólo cambia el destino final.
- `extractToken(mail)` saca el token del link del email "enviado". Como la base guarda sólo el hash, el test necesita leer el token **del mismo lugar que el usuario**: el email.

> 📝 Nota: en módulos ES, `jest` no es una variable global, por eso en `helpers.js` se importa con `import { jest } from '@jest/globals'`.

### Qué cubre cada archivo

| Archivo | Qué comprueba |
|---|---|
| `models.test.js` | que email sea único en las dos tablas |
| `mailer.test.js` | que envía con el remitente configurado y que envuelve los fallos en `EmailDeliveryError` |
| `emailTemplates.test.js` | link presente en HTML y texto, escape de caracteres, asuntos distintos, sin links en el aviso de cuenta existente |
| `registration.test.js` | **la lógica**: normalización, reemplazo de pendientes, vencimiento, borrado de vencidas, fallo de SMTP, **doble clic simultáneo** |
| `auth.api.test.js` | **HTTP**: códigos de respuesta, JSON mal formado, contraseña de más de 72, rate limit (429), 404 |

> 🎯 **Desafío:** elegí una línea de `src/services/registration.js`, rompela a propósito (por ejemplo, quitá `.toLowerCase()`) y corré `npm test`. ¿Qué test falla? Ese test está haciendo su trabajo.

---

## 7. Seguridad: las decisiones y el porqué

Cada decisión de esta lista está en el código **con un comentario que explica el porqué**.

### 🔑 Token aleatorio, hasheado en la base, con vencimiento

- 32 bytes de `crypto.randomBytes` → imposible de adivinar.
- En la base, **sólo el hash**: una filtración de la base no regala links válidos.
- Vence a las **24 horas**.

### 🔒 Contraseñas con bcryptjs

- Nunca se guardan en claro. Se guarda el **hash**.
- Se rechazan las de más de **72 caracteres**, el límite de bcrypt.
- El **mismo hash** viaja de `pending_registrations` a `users`: la contraseña real no se vuelve a manejar.

### 🕵️ Anti-enumeración

*Enumerar* es descubrir **qué emails están registrados**. Si tu API respondiera "ese email ya existe", cualquiera podría armar una lista de usuarios.

Por eso `register` y `resend-confirmation` responden **exactamente lo mismo** exista o no el email. El dueño legítimo se entera igual: le llega un email (el aviso de cuenta existente).

> ⚠️ **Limitación honesta:** el *tiempo* de respuesta sí difiere, porque el camino de "ya existe" no calcula bcrypt (que es lento). Un atacante muy paciente podría medirlo. Para un proyecto de aprendizaje lo aceptamos, pero es bueno que lo sepas.

### 🚦 Rate limit

Cada llamada a `register`/`resend` dispara un email. Sin límite, tu API sería una **herramienta para hacer spam**. Dos cosas a tener en cuenta:

- Detrás de un proxy o balanceador, tenés que configurar `trust proxy` en Express; si no, todas las requests parecerán venir de la misma IP.
- Nuestro contador vive **en la memoria del proceso**. Con varias instancias del servidor haría falta un almacén compartido (como Redis).

### 🪖 Helmet y límite de cuerpo

`helmet()` agrega cabeceras HTTP de seguridad. Y `express.json({ limit: '10kb' })` corta cuerpos gigantes: los de esta API son diminutos.

---

## 8. Limitaciones conocidas (sí, hay)

Ningún proyecto es perfecto. Conocer las debilidades de lo que construís es parte de ser buen desarrollador. Estas son las de acá:

1. **Email ajeno.** Alguien podría registrar el email de **otra persona** con una contraseña que él elige. Si la víctima, por curiosidad, confirma el email, la cuenta queda con la contraseña del atacante. *Mejora futura:* que la contraseña se defina **al confirmar**, no al registrarse.
2. **`GET /confirm` modifica datos.** Un GET debería ser "sólo lectura", y algunos **escáneres de antivirus o de email visitan los links** automáticamente, ¡gastando tu token antes de que el usuario llegue! *Mejora futura:* que el GET muestre una página con un botón, y que el botón haga un POST que confirme.
3. **Rate limit en memoria.** Se reinicia con el servidor y no se comparte entre instancias.

---

## 9. ¿Y ahora qué? Ideas para seguir

Cada una es un proyecto en sí mismo:

- 🔐 **Login y JWT**: ahora que hay cuentas confirmadas, falta poder entrar.
- 🔁 **Recuperación de contraseña**: el mismo mecanismo de token, con otro propósito.
- 📬 **Cola de emails con reintentos**: hoy, si el SMTP falla, devolvemos `502`. Una cola reintentaría sola.
- 🗃️ **Migraciones** (Umzug, sequelize-cli): para cambiar el esquema de forma controlada.
- 🐳 **Docker**: MySQL y Mailpit con un solo comando.
- 🎨 **Motor de plantillas** (MJML, Handlebars): para emails más lindos sin pelear con HTML de 2005.
- 🌐 **OAuth2 para Gmail**: enviar sin contraseña de aplicación.

---

## 10. Mini glosario

| Término | En una frase |
|---|---|
| **SMTP** | el protocolo con el que se envían los emails entre servidores |
| **Nodemailer** | la librería de Node que le entrega tus emails a un servidor SMTP |
| **Transporte** | en Nodemailer, la conexión ya configurada hacia el SMTP |
| **Mailpit** | un SMTP de mentira con bandeja web, para desarrollar |
| **STARTTLS** | empezar una conexión sin cifrar y "subirla" a cifrada |
| **Contraseña de aplicación** | una clave generada para un programa, revocable sin tocar tu contraseña real |
| **Hash** | una transformación de un solo sentido: del hash no se recupera el original |
| **bcrypt** | un hash *lento a propósito*, para contraseñas |
| **SHA-256** | un hash *rápido*, para cosas ya aleatorias como los tokens |
| **Token** | una cadena secreta que funciona como "llave" de un solo uso |
| **Middleware** | función que se ejecuta antes del controlador y puede cortar la request |
| **Transacción** | un grupo de operaciones de base de datos que se hacen **todas o ninguna** |
| **Lock** | un candado que hace esperar a otros hasta que termines |
| **Enumeración** | descubrir qué usuarios existen por las diferencias en las respuestas |
| **Rate limit** | límite de cuántas veces se puede llamar en un tiempo |
| **Mock** | una pieza falsa que reemplaza a una real durante un test |
| **SPF / DKIM / DMARC** | tres registros DNS que prueban que tus emails son legítimos |

---

¡Felicitaciones, llegaste hasta acá! 🎉 Ahora cada vez que te llegue un "Confirmá tu email", vas a saber exactamente qué está pasando del otro lado.

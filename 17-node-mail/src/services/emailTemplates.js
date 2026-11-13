// Plantillas como funciones puras: reciben datos y devuelven {subject, html, text}.
// Sin acceso a red ni a la base, así se testean con un simple expect.

const escapeHtml = (valor) =>
  String(valor).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

// Los clientes de correo ignoran <style> y CSS externo: por eso estilos inline.
function layout({ titulo, parrafos, boton }) {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`).join('');
  const accion = boton
    ? `<p style="margin:24px 0"><a href="${escapeHtml(boton.url)}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">${escapeHtml(boton.etiqueta)}</a></p>
       <p style="font-size:13px;color:#555">Si el botón no funciona, copiá este enlace en tu navegador:<br>${escapeHtml(boton.url)}</p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#111">
    <h2 style="margin:0 0 16px">${escapeHtml(titulo)}</h2>${cuerpo}${accion}</div>`;
}

// Versión en texto plano: algunos clientes no muestran HTML y los filtros de
// spam penalizan los emails que sólo traen HTML.
function plano({ titulo, parrafos, boton }) {
  return [titulo, '', ...parrafos, ...(boton ? ['', `${boton.etiqueta}: ${boton.url}`] : [])].join('\n');
}

function build(datos, subject) {
  return { subject, html: layout(datos), text: plano(datos) };
}

export function confirmationEmail({ confirmUrl }) {
  return build({
    titulo: 'Confirmá tu cuenta',
    parrafos: ['Gracias por registrarte. Confirmá tu email para activar tu cuenta.', 'El enlace vence en 24 horas.'],
    boton: { etiqueta: 'Confirmar mi cuenta', url: confirmUrl },
  }, 'Confirmá tu cuenta');
}

export function resendEmail({ confirmUrl }) {
  return build({
    titulo: 'Tu nuevo enlace de confirmación',
    parrafos: ['Pediste un nuevo enlace. El anterior dejó de funcionar.', 'Este vence en 24 horas.'],
    boton: { etiqueta: 'Confirmar mi cuenta', url: confirmUrl },
  }, 'Nuevo enlace para confirmar tu cuenta');
}

// Se envía cuando alguien intenta registrar un email que YA tiene cuenta.
// La respuesta HTTP es idéntica a un registro nuevo (anti-enumeración): el
// dueño del email se entera por acá, el que consulta la API no.
export function accountExistsEmail() {
  return build({
    titulo: 'Ya tenés una cuenta',
    parrafos: ['Alguien intentó registrarse con este email, pero ya existe una cuenta.', 'Si fuiste vos, iniciá sesión. Si no, ignorá este mensaje.'],
  }, 'Intento de registro con tu email');
}

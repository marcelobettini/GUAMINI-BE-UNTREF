import { confirmationEmail, resendEmail, accountExistsEmail } from '../src/services/emailTemplates.js';

const url = 'http://localhost:3000/api/auth/confirm?token=abc&x="1"';

test('el email de confirmación incluye el link en HTML y en texto plano', () => {
  const { subject, html, text } = confirmationEmail({ confirmUrl: url });
  expect(subject).toMatch(/confirm/i);
  expect(text).toContain(url);
  expect(html).toContain('token=abc');
});

test('el HTML escapa caracteres especiales (no inyecta marcado)', () => {
  const { html } = confirmationEmail({ confirmUrl: url });
  expect(html).toContain('&amp;');
  expect(html).toContain('&quot;');
  expect(html).not.toContain('x="1"');
});

test('los tres emails tienen asuntos distintos', () => {
  const asuntos = [
    confirmationEmail({ confirmUrl: url }).subject,
    resendEmail({ confirmUrl: url }).subject,
    accountExistsEmail().subject,
  ];
  expect(new Set(asuntos).size).toBe(3);
});

test('el aviso de cuenta existente no contiene links de confirmación', () => {
  const { html, text } = accountExistsEmail();
  expect(html + text).not.toContain('token=');
});

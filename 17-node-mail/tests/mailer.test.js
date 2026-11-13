import nodemailer from 'nodemailer';
import { sendMail, setTransporter, EmailDeliveryError } from '../src/services/mailer.js';

test('sendMail envía con el remitente configurado', async () => {
  // jsonTransport no abre red: devuelve el mensaje serializado en info.message.
  setTransporter(nodemailer.createTransport({ jsonTransport: true }));
  const info = await sendMail({ to: 'a@x.com', subject: 'Hola', html: '<p>hi</p>', text: 'hi' });
  const mensaje = JSON.parse(info.message);
  expect(mensaje.to[0].address).toBe('a@x.com');
  expect(mensaje.subject).toBe('Hola');
  expect(mensaje.from.address).toBe('no-reply@miapp.local');
});

test('envuelve los fallos del transporte en EmailDeliveryError', async () => {
  setTransporter({ sendMail: async () => { throw new Error('SMTP caído'); } });
  const promesa = sendMail({ to: 'a@x.com', subject: 's', html: 'h', text: 't' });
  await expect(promesa).rejects.toBeInstanceOf(EmailDeliveryError);
  await expect(promesa).rejects.toMatchObject({ cause: expect.objectContaining({ message: 'SMTP caído' }) });
});

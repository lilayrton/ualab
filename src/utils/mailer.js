import nodemailer from 'nodemailer';

// Verifica si hay credenciales SMTP configuradas en .env
function hasSmtpConfig() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Crea el transportador con los datos de .env
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

// Envía el mail de recuperación de contraseña.
// Sin SMTP configurado, se simula el envío mostrando el link por consola para probar.
// Nunca da errores...si el envío falla, se loguea, pero no rompe el flujo.
export async function sendPasswordResetEmail(email, resetLink, storeName = 'UALab') {
    const subject = 'Recuperación de contraseña';
    const text = `Recibimos una solicitud para restablecer la contraseña de tu cuenta de ${storeName}.\n\n` +
        `Hacé click en este enlace (válido por 1 hora):\n\n${resetLink}\n\n` +
        `Si no fuiste vos, podés ignorar este mensaje.`;

    if (!hasSmtpConfig()) {
        console.log('[MAIL SIMULADO] Para: ' + email);
        console.log('[MAIL SIMULADO] Asunto: ' + subject);
        console.log('[MAIL SIMULADO] Enlace: ' + resetLink);
        return;
    }

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: process.env.MAIL_FROM || `"${storeName}" <${process.env.SMTP_USER}>`,
            to: email,
            subject,
            text
        });
    } catch (error) {
        console.error('[MAIL ERROR] No se pudo enviar el email:', error.message);
    }
}
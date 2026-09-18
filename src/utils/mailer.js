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

// Transportador reutilizado entre envíos (crear uno por email desperdicia conexiones)
let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = createTransporter();
    }

    return transporter;
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
        await getTransporter().sendMail({
            from: buildSender(storeName),
            to: email,
            subject,
            text
        });
    } catch (error) {
        console.error('[MAIL ERROR] No se pudo enviar el email:', error.message);
    }
}

// Nombre visible del remitente según la configuración de la tienda
function buildSender(storeName) {
    return process.env.MAIL_FROM || `"${storeName}" <${process.env.SMTP_USER}>`;
}

// Arma el cuerpo del aviso con los datos de la consulta (incluye producto/variante si aplica)
function buildInquiryText(inquiry) {
    const lines = [
        'Nueva consulta recibida desde la web.',
        '',
        `Nombre: ${inquiry.name}`,
        `Email: ${inquiry.email}`
    ];

    if (inquiry.phone) {
        lines.push(`Teléfono: ${inquiry.phone}`);
    }

    if (inquiry.subject) {
        lines.push(`Asunto: ${inquiry.subject}`);
    }

    if (inquiry.productName) {
        lines.push(`Producto: ${inquiry.productName} (SKU: ${inquiry.productSku})`);
    }

    if (inquiry.variantName) {
        lines.push(`Variante: ${inquiry.variantName} (SKU: ${inquiry.variantSku})`);
    }

    lines.push('', 'Mensaje:', inquiry.message);

    return lines.join('\n');
}

// Avisa a la tienda sobre una consulta nueva. Devuelve true si el mail se envió (o se simuló).
export async function sendInquiryEmail(inquiry, { to, storeName = 'UALab' } = {}) {
    const subject = `Nueva consulta${inquiry.subject ? `: ${inquiry.subject}` : ''}`;
    const text = buildInquiryText(inquiry);

    if (!hasSmtpConfig()) {
        console.log('[MAIL SIMULADO] Aviso a tienda: ' + to);
        console.log('[MAIL SIMULADO] Asunto: ' + subject);
        console.log('[MAIL SIMULADO] Cuerpo:\n' + text);
        return true;
    }

    try {
        await getTransporter().sendMail({
            from: buildSender(storeName),
            to,
            replyTo: inquiry.email,
            subject,
            text
        });
        return true;
    } catch (error) {
        console.error('[MAIL ERROR] No se pudo enviar el aviso de consulta:', error.message);
        return false;
    }
}

// Confirma al usuario que su consulta fue recibida
export async function sendInquiryConfirmation(inquiry, { storeName = 'UALab', replyTo = '' } = {}) {
    const subject = `Recibimos tu consulta - ${storeName}`;
    const text = `Hola ${inquiry.name},\n\n` +
        `Gracias por contactarte con ${storeName}. Recibimos tu consulta y te responderemos a la brevedad.\n\n` +
        `Resumen de tu mensaje:\n${inquiry.message}`;

    if (!hasSmtpConfig()) {
        console.log('[MAIL SIMULADO] Confirmación a: ' + inquiry.email);
        return true;
    }

    try {
        await getTransporter().sendMail({
            from: buildSender(storeName),
            to: inquiry.email,
            replyTo: replyTo || undefined,
            subject,
            text
        });
        return true;
    } catch (error) {
        console.error('[MAIL ERROR] No se pudo enviar la confirmación:', error.message);
        return false;
    }
}
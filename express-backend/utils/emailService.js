const nodemailer = require('nodemailer');

// Configura il trasportatore SMTP usando le variabili d'ambiente
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,       // es. smtp.gmail.com, mail.nexustream.it oppure mailtrap
    port: process.env.EMAIL_PORT,       // es. 587 (per TLS), 465 (per SSL) o 2525 (mailtrap)
    secure: process.env.EMAIL_PORT == 465, // true per la porta 465, false per le altre
    auth: {
        user: process.env.EMAIL_USER,   // L'email di sistema 
        pass: process.env.EMAIL_PASS    // La password dell'email o una App Password (es. per Gmail)
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Errore di configurazione del Transporter:", error);
    } else {
        console.log("Il server SMTP è pronto per inviare messaggi!");
    }
});

const EmailService = {
    /**
     * Invia l'email con il link di reset all'utente
     */
    sendPasswordResetEmail: async (userEmail, token) => {
        const resetLink = `http://localhost:8100/reset-password?token=${token}`;

        // Configurazione del messaggio
        const mailOptions = {
            from: `"NexuStream Support" <${process.env.EMAIL_USER}>`, // Mittente stilizzato
            to: userEmail,                                           // Destinatario
            subject: 'Ripristino Password - NexuStream',             // Oggetto
            // Testo in puro testo (fallback per vecchi client mail)
            text: `Ciao! Hai richiesto il reset della password. Clicca sul seguente link per impostarne una nuova: ${resetLink}. Il link scadrà tra 15 minuti.`,
            // Corpo in HTML stilizzato Dark/Neon in linea con NexuStream
            html: `
                <div style="background-color: #121212; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="background-color: #222222; color: #f5f5f5; padding: 40px 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; border-top: 4px solid #b22222; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                        
                        <h2 style="color: #b22222; text-align: center; margin-top: 0; margin-bottom: 24px; font-size: 1.6rem; font-weight: 700; letter-spacing: -0.5px;">
                            NexuStream
                        </h2>
                        
                        <p style="font-size: 1rem; line-height: 1.6; color: #f5f5f5; margin-bottom: 12px;">Ciao,</p>
                        <p style="font-size: 1rem; line-height: 1.6; color: #f5f5f5; margin-bottom: 12px;">
                            Abbiamo ricevuto una richiesta di ripristino della password per il tuo account su <strong>NexuStream</strong>.
                        </p>
                        <p style="font-size: 1rem; line-height: 1.6; color: #f5f5f5; margin-bottom: 32px;">
                            Clicca sul pulsante qui sotto per impostare una nuova password. Il link rimarrà attivo per <strong>15 minuti</strong>.
                        </p>
                        
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${resetLink}" style="background-color: #b22222; color: #f5f5f5; text-decoration: none; padding: 14px 28px; font-weight: bold; font-size: 0.95rem; border-radius: 6px; display: inline-block; box-shadow: 0 3px 6px rgba(178, 34, 34, 0.2); transition: background-color 0.2s ease;">
                                Ripristina Password
                            </a>
                        </div>
                        
                        <p style="font-size: 0.8rem; color: #777777; text-align: center; border-top: 1px solid #eeeeee; padding-top: 24px; margin-bottom: 0; line-height: 1.5;">
                            Se non hai richiesto tu questo reset, puoi ignorare questa email in totale sicurezza. La tua password attuale non verrà modificata.
                        </p>
                    </div>
                </div>
            `
        };

        // Invia effettivamente la mail
        return transporter.sendMail(mailOptions);
    }
};

module.exports = EmailService;
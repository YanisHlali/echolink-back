const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

exports.sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Équipe Vérification" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "🔐 Vérifie ton adresse email",
    html: `
      <p>Salut 👋</p>
      <p>Merci de t'être inscrit. Clique sur le lien ci-dessous pour vérifier ton adresse :</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <br>
      <p>Si tu n'es pas à l'origine de cette demande, ignore ce message.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Mail de vérification envoyé à :", email);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du mail :", error);
  }
};

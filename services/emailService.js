const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port:process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendVerificationEmail = async (email, token) => {
  //const verificationLink = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;
  const verificationLink = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verificationLink}">${verificationLink}</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

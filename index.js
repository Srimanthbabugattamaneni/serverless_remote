const mailgun = require('mailgun-js');
const mysql = require('mysql');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: '10.121.184.2',
  user: 'User',
  password: '<{]hehmnOD)dq1+M',
  database: 'webapp'
};

const pool = mysql.createPool(dbConfig);

const DOMAIN = 'mg.gsbcloudservices.me'; // Your Mailgun subdomain
const mg = mailgun({ apiKey: '61e9352280b62e027268152f81499f50-f68a26c9-9e626149', domain: DOMAIN }); // Your Mailgun API key



exports.sendVerificationEmail = async (pubSubEvent, context) => {
  const message = pubSubEvent.data ? Buffer.from(pubSubEvent.data, 'base64').toString() : '{}';
  const userData = JSON.parse(message);
  const { userId, username, fullName } = userData;

  // Generate a unique verification token for the user
  const verificationToken = uuidv4();
  const verificationLink = `http://gsbcloudservices.me:5000/v1/user/verify?token=${verificationToken}`;


const emailData = {
    from: 'Your Service <noreply@mg.gsbcloudservices.me>',
    to: username, // Assuming 'username' is the email address
    subject: 'Please verify your email address',
    html: `<h1>Email Verification</h1><p>Hello ${fullName},</p><p>Please click on the link below to verify your email address:</p><a href="${verificationLink}">Verify Email</a><p>This link will expire in 2 minutes.</p>`,
  };

  try {
    // Send email
    const body = await mg.messages().send(emailData);
    console.log('Email sent:', body);

    // Update user status in the database
    await updateEmailSentStatus(userId, verificationToken);
  } catch (error) {
    console.error('An error occurred:', error);
  }


async function updateEmailSentStatus(userId, verificationToken) {
  const query = `UPDATE Users SET verificationToken = '${verificationToken}', mailSentAt = NOW() WHERE id = '${userId}'`;

  pool.getConnection((err, connection) => {
    if (err) throw err; // not connected!

    connection.query(query, [userId], (error, results) => {
      connection.release();

      if (error) {
        console.error('Error updating email sent status:', error);
        return;
      }

      console.log(`Email sent status updated for user ID: ${userId}`);
    });
  });
 }}
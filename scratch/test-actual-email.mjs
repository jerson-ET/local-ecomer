import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function testEmail() {
  console.log('Using SMTP_USER:', process.env.SMTP_USER);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('Sending test email to etjerson@gmail.com...');
    const info = await transporter.sendMail({
      from: `"Test Store via LocalEcomer" <${process.env.SMTP_USER}>`,
      to: 'etjerson@gmail.com', // Test sending to the same account first
      subject: 'Test Invoice Email',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<b>This is a test email</b> to verify SMTP configuration.',
    });
    console.log('Email sent successfully:', info.messageId);
    
    console.log('Sending test email to a different account (jerson.tovar@gmail.com)...');
    const info2 = await transporter.sendMail({
      from: `"Test Store via LocalEcomer" <${process.env.SMTP_USER}>`,
      to: 'jerson.tovar@gmail.com', // Test sending to a different account
      subject: 'Test Invoice Email to External',
      text: 'This is a test email to an external account.',
      html: '<b>This is a test email</b> to an external account.',
    });
    console.log('Email to external sent successfully:', info2.messageId);

  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();

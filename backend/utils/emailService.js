import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

// Create transporter with Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Base email template
const createEmailTemplate = (title, content, ctaUrl, ctaText) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          margin: 20px;
          padding: 0;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #2d3748;
          margin-top: 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: white;
        }
        .warning {
          background-color: #fef3cd;
          border: 1px solid #faebcc;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          color: #8a6d3b;
        }
        .code-box {
          background-color: #f8f9fa;
          border: 2px dashed #6b7280;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 18px;
          font-weight: bold;
          color: #2d3748;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔍 LostFound</div>
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
          ${
            ctaUrl && ctaText
              ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
            </div>
          `
              : ""
          }
        </div>
        <div class="footer">
          <p>© 2025 LostFound. All rights reserved.</p>
          <p>This is an automated email, please do not reply to this address.</p>
          <p>If you didn't request this email, please ignore it or contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email verification function
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = createTransporter();

    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-email/${verificationToken}`;

    const content = `
      <h2>Welcome to LostFound! 🎉</h2>
      <p>Hi there!</p>
      <p>Thank you for joining the LostFound community. We're excited to help you reunite with your lost items or help others find theirs.</p>
      <p>To get started, please verify your email address by clicking the button below:</p>
      <div class="warning">
        <strong>⚠️ Important:</strong> This verification link will expire in 24 hours for security reasons.
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔍 Verify Your LostFound Account",
      html: createEmailTemplate(
        "Verify Your Email",
        content,
        verificationUrl,
        "Verify My Email"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};

// Password reset email function
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/reset-password/${resetToken}`;

    const content = `
      <h2>Password Reset Request 🔐</h2>
      <p>Hi there!</p>
      <p>We received a request to reset the password for your LostFound account associated with this email address.</p>
      <p>If you requested this password reset, click the button below to create a new password:</p>
      <div class="warning">
        <strong>⚠️ Security Notice:</strong> This reset link will expire in 1 hour for your account security.
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
      <p><strong>If you didn't request this password reset, please ignore this email.</strong> Your account remains secure.</p>
    `;

    const mailOptions = {
      from: `"LostFound Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Reset Your LostFound Password",
      html: createEmailTemplate(
        "Reset Your Password",
        content,
        resetUrl,
        "Reset My Password"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

// Welcome email after verification
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const dashboardUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/dashboard`;

    const content = `
      <h2>Welcome to LostFound, ${userName}! 🌟</h2>
      <p>Congratulations! Your email has been verified successfully.</p>
      <p>You're now part of a community dedicated to helping people reunite with their lost belongings.</p>
      
      <h3>What you can do now:</h3>
      <ul>
        <li>📱 Report lost items with photos and detailed descriptions</li>
        <li>👀 Browse found items to see if yours is there</li>
        <li>💬 Message other users who might have found your items</li>
        <li>🏆 Help others by reporting items you've found</li>
        <li>⭐ Build your trust score by being an active community member</li>
      </ul>
      
      <p>Ready to get started? Click the button below to explore your dashboard:</p>
    `;

    const mailOptions = {
      from: `"LostFound Community" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to LostFound - Let's Get Started!",
      html: createEmailTemplate(
        "Welcome to LostFound!",
        content,
        dashboardUrl,
        "Explore Dashboard"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};

// Item match notification email
export const sendItemMatchNotification = async (
  email,
  userName,
  matchedItem
) => {
  try {
    const transporter = createTransporter();

    const itemUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/items/${matchedItem.item_id}`;

    const content = `
      <h2>Great News, ${userName}! 🎯</h2>
      <p>We found a potential match for one of your lost items!</p>
      
      <div style="border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; background-color: #f0fdf4;">
        <h3 style="color: #065f46; margin-top: 0;">📱 ${matchedItem.title}</h3>
        <p><strong>📍 Location:</strong> ${matchedItem.location}</p>
        <p><strong>📅 Date Found:</strong> ${new Date(
          matchedItem.date_found
        ).toLocaleDateString()}</p>
        <p><strong>📝 Description:</strong> ${matchedItem.description}</p>
      </div>
      
      <p>This match was found based on your item's description, location, and other details.</p>
      <p>Click the button below to view the full details and contact the person who found it:</p>
    `;

    const mailOptions = {
      from: `"LostFound Alerts" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎯 Potential Match Found for Your Lost Item!",
      html: createEmailTemplate(
        "Potential Match Found!",
        content,
        itemUrl,
        "View Match Details"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Item match notification sent to ${email}:`,
      result.messageId
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending item match notification:", error);
    return { success: false, error: error.message };
  }
};

// Message notification email
export const sendMessageNotification = async (
  email,
  userName,
  senderName,
  itemTitle
) => {
  try {
    const transporter = createTransporter();

    const messagesUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/messages`;

    const content = `
      <h2>New Message, ${userName}! 💬</h2>
      <p>You have received a new message from <strong>${senderName}</strong> about:</p>
      
      <div class="code-box">
        📱 ${itemTitle}
      </div>
      
      <p>They might have information about your lost item or want to discuss a found item you posted.</p>
      <p>Click the button below to read and respond to the message:</p>
      
      <div class="warning">
        <strong>💡 Pro Tip:</strong> Quick responses help build trust in the community and increase your chances of successful reunions!
      </div>
    `;

    const mailOptions = {
      from: `"LostFound Messages" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `💬 New Message from ${senderName} about "${itemTitle}"`,
      html: createEmailTemplate(
        "New Message Received",
        content,
        messagesUrl,
        "Read Message"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Message notification sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending message notification:", error);
    return { success: false, error: error.message };
  }
};

// Password changed confirmation email
export const sendPasswordChangeConfirmation = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const supportUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/support`;

    const content = `
      <h2>Password Changed Successfully, ${userName} ✅</h2>
      <p>This email confirms that your LostFound account password has been successfully changed.</p>
      
      <div style="border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; background-color: #f0fdf4;">
        <p style="margin: 0; color: #065f46;"><strong>✅ Change Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>If you made this change, no further action is required. Your account remains secure.</p>
      
      <div class="warning">
        <strong>⚠️ Didn't change your password?</strong> If you didn't make this change, please contact our support team immediately and consider changing your password again.
      </div>
    `;

    const mailOptions = {
      from: `"LostFound Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Password Changed Successfully - LostFound",
      html: createEmailTemplate(
        "Password Changed",
        content,
        supportUrl,
        "Contact Support"
      ),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Password change confirmation sent to ${email}:`,
      result.messageId
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending password change confirmation:", error);
    return { success: false, error: error.message };
  }
};

// Export all functions
export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendItemMatchNotification,
  sendMessageNotification,
  sendPasswordChangeConfirmation,
};

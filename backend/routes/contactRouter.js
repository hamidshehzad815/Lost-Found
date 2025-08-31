import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    
    const adminEmailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, 
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">New Contact Form Submission</h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Message</h3>
            <p style="line-height: 1.6;">${message.replace(/\n/g, "<br>")}</p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;">
              <strong>Reply to:</strong> ${email}
            </p>
          </div>
        </div>
      `,
    };

    
    const userEmailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting LostFound!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
            <h1 style="color: #10b981; margin: 0;">🔍 LostFound</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #374151;">Thank you for reaching out!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Hi ${name},
            </p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              We've received your message about "<strong>${subject}</strong>" and will get back to you as soon as possible.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Your Message</h3>
              <p style="color: #6b7280; line-height: 1.6; margin: 0;">
                ${message.replace(/\n/g, "<br>")}
              </p>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;">What's Next?</h3>
              <ul style="color: #065f46; line-height: 1.6; margin: 0;">
                <li>Our team will review your message within 2-4 hours</li>
                <li>You'll receive a detailed response via email</li>
                <li>For urgent matters, you can also reach us at +92 3127846622</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Thank you for using LostFound to help reunite people with their belongings!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 14px;">
                Best regards,<br>
                The LostFound Team
              </p>
            </div>
          </div>
        </div>
      `,
    };

    
    await Promise.all([
      transporter.sendMail(adminEmailOptions),
      transporter.sendMail(userEmailOptions),
    ]);

    res.json({
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message:
        "Sorry, there was an error sending your message. Please try again later.",
    });
  }
});

export default router;

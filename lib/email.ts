import nodemailer from 'nodemailer';

export async function sendITLaptopCollectionEmail(
    employeeEmail: string,
    collectionAddress: string,
    employeeName?: string
) {
    // Create transporter using environment variables
    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.IT_EMAIL || 'it@company.com',
        subject: `Laptop Collection Required - ${employeeEmail}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Laptop Collection Request</h2>
        <p>An employee offboarding has been initiated and requires laptop collection.</p>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Employee Details:</h3>
          <p><strong>Name:</strong> ${employeeName || 'N/A'}</p>
          <p><strong>Email:</strong> ${employeeEmail}</p>
          <p><strong>Collection Address:</strong> ${collectionAddress}</p>
        </div>
        
        <p><strong>Action Required:</strong> Please schedule a laptop collection from the address above.</p>
        
        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
          This is an automated notification from the Employee Onboarding/Offboarding System.
        </p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Failed to send IT notification email:', error);
        return { success: false, error };
    }
}

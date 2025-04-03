
import { sendEmail } from './email';

/**
 * Test email functionality by sending a simple message to the business email
 */
export async function testEmailFunctionality(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Starting email test process");
    
    const businessEmail = "info@justlegalsolutions.org";
    
    // Create a simple test email
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Test Email</h2>
        <p>This is a test email to verify that the email functionality is working correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          This is an automated test message from JLS Process Server Pro.
        </p>
      </div>
    `;
    
    // Send the test email
    console.log("Sending test email to:", businessEmail);
    const result = await sendEmail({
      to: businessEmail,
      subject: "Test Email from JLS Process Server Pro",
      body: emailBody,
      html: emailBody
    });
    
    console.log("Test email result:", result);
    
    return result;
  } catch (error) {
    console.error("Error in test email process:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during email test"
    };
  }
}

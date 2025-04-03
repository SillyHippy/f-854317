
import { ServeAttemptData } from "@/components/ServeAttempt";

// Base email interface
export interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  imageData?: string; // Base64 encoded image data
  imageFormat?: string; // Format of the image (jpeg, png, etc.)
}

// Create an email for serve attempt notifications
export const createServeEmailBody = (
  clientName: string,
  address: string,
  notes: string,
  timestamp: Date,
  coordinates: { latitude: number; longitude: number } | null,
  attemptNumber: number,
  caseNumber: string,
  caseName?: string
): string => {
  const googleMapsLink = coordinates
    ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
    : "";

  const caseDisplay = caseName && caseName !== "Unknown Case" 
    ? `${caseName} (${caseNumber})` 
    : caseNumber;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">New Serve Attempt Recorded</h2>
      
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Case:</strong> ${caseDisplay}</p>
      <p><strong>Date/Time:</strong> ${timestamp.toLocaleString()}</p>
      <p><strong>Attempt #:</strong> ${attemptNumber}</p>
      <p><strong>Location:</strong> ${address}</p>
      ${googleMapsLink ? `<p><a href="${googleMapsLink}" target="_blank">View on Google Maps</a></p>` : ''}
      
      <div style="margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #4f46e5;">Notes:</h3>
        <p style="white-space: pre-line;">${notes || "No notes provided"}</p>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated notification from JLS Process Server Pro.
      </p>
    </div>
  `;
};

// Create an email for serve attempt updates
export const createUpdateNotificationEmail = (
  clientName: string,
  caseNumber: string,
  timestamp: Date,
  oldStatus: string,
  newStatus: string,
  notes: string,
  caseName?: string
): string => {
  const caseDisplay = caseName && caseName !== "Unknown Case" 
    ? `${caseName} (${caseNumber})` 
    : caseNumber;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Serve Attempt Updated</h2>
      
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Case:</strong> ${caseDisplay}</p>
      <p><strong>Date/Time:</strong> ${timestamp.toLocaleString()}</p>
      <p><strong>Status Change:</strong> ${oldStatus} → ${newStatus}</p>
      
      <div style="margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #4f46e5;">Updated Notes:</h3>
        <p style="white-space: pre-line;">${notes || "No notes provided"}</p>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated notification from JLS Process Server Pro.
      </p>
    </div>
  `;
};

// Create an email for serve attempt deletions
export const createDeleteNotificationEmail = (
  clientName: string,
  caseNumber: string,
  timestamp: Date,
  reason?: string,
  caseName?: string
): string => {
  const caseDisplay = caseName && caseName !== "Unknown Case" 
    ? `${caseName} (${caseNumber})` 
    : caseNumber;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #e53e3e; margin-bottom: 20px;">Serve Attempt Deleted</h2>
      
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Case:</strong> ${caseDisplay}</p>
      <p><strong>Original Date/Time:</strong> ${timestamp.toLocaleString()}</p>
      
      ${reason ? `
      <div style="margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #e53e3e;">Reason:</h3>
        <p>${reason}</p>
      </div>
      ` : ''}
      
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated notification from JLS Process Server Pro.
      </p>
    </div>
  `;
};

// Function to send email using the function endpoint
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Sending email to:", emailData.to);
    
    // Format recipients for proper representation
    let recipients: string[] = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    
    // Ensure we have email addresses
    if (recipients.length === 0) {
      throw new Error("No recipients specified for email");
    }
    
    // Add the business email if not already in the list
    const businessEmail = "info@justlegalsolutions.org";
    if (!recipients.includes(businessEmail)) {
      recipients.push(businessEmail);
    }

    // Create the request payload
    const payload = {
      to: recipients,
      subject: emailData.subject,
      html: emailData.html || emailData.body,
      text: emailData.html ? undefined : emailData.body,
    };

    // Add attachments if there's image data
    if (emailData.imageData) {
      payload['attachments'] = [
        {
          filename: 'serve_evidence.jpeg',
          content: emailData.imageData,
          encoding: 'base64'
        }
      ];
    }

    console.log("Sending message to", recipients.length, "recipients with", 
      emailData.imageData ? "photo attachment" : "no attachments");

    const startTime = Date.now();
    
    // Call the function endpoint with proper headers
    const response = await fetch('/api/function/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(payload),
      // Add cache busting
      cache: 'no-store'
    });
    
    console.log(`API request completed in ${Date.now() - startTime}ms with status ${response.status}`);

    // Try to get the response as text first
    const responseText = await response.text();
    console.log("Raw response:", responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    // Try to parse as JSON if possible
    let result;
    try {
      result = JSON.parse(responseText);
      console.log("Parsed JSON result:", result);
      
      return { 
        success: true, 
        message: result.message || 'Email sent successfully' 
      };
    } catch (jsonError) {
      console.warn("Couldn't parse response as JSON:", jsonError);
      
      // Even if we can't parse JSON, if status is OK or contains success message, consider it a success
      if (response.ok || responseText.includes('success') || responseText.includes('sent successfully')) {
        return { 
          success: true, 
          message: 'Email appears to have been sent, but received non-JSON response' 
        };
      } else {
        // If the response is not OK and doesn't look like success, it's an error
        return {
          success: false,
          message: `Failed to send email: Server responded with status ${response.status} and non-JSON content`
        };
      }
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

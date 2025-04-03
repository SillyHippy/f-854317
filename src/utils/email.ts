
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

    // Call the function endpoint directly with proper headers
    const response = await fetch('/api/function/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // If the response is not OK but the error is just about parsing JSON, we can consider it a success
    // This handles cases where the server returns HTML instead of JSON but the email was sent
    if (!response.ok) {
      // Try to get error information from the response
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      let responseText;
      
      try {
        responseText = await response.text();
        
        // If the response contains "success" or "success:true", it might indicate success despite non-JSON format
        if (responseText.includes("success") && !responseText.includes("success:false")) {
          return {
            success: true,
            message: 'Email appears to have been sent (non-JSON success response)'
          };
        }
        
        errorMessage = `${errorMessage} - Response: ${responseText.substring(0, 100)}...`;
      } catch (textError) {
        // Cannot read response text
        console.error("Error reading response text:", textError);
      }
      
      throw new Error(`Failed to send email: ${errorMessage}`);
    }

    // Try to parse the response as JSON, but handle non-JSON responses
    let result;
    try {
      result = await response.json();
      console.log("Email sending result:", result);
      
      return { 
        success: true, 
        message: result.message || 'Email sent successfully' 
      };
    } catch (jsonError) {
      console.warn("Couldn't parse JSON response:", jsonError);
      
      // Check if the response status was OK (200-299)
      if (response.ok) {
        return { 
          success: true, 
          message: 'Email appears to have been sent, but received non-JSON response' 
        };
      } else {
        throw new Error('Failed to send email: Invalid response format');
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

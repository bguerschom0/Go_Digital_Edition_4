import { PDFDocument } from 'pdf-lib';

/**
 * Applies security settings to a PDF file
 * 
 * @param {File} file - The PDF file to secure
 * @returns {Promise<Blob>} - The secured PDF file as a Blob
 */
export const applyPdfSecurity = async (file) => {
  try {
    // Read the file as an ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer);
    
    // Create a random owner password
    const ownerPassword = generateRandomPassword(16);
    
    // Set PDF security options
    // userPassword: null = no password required to open the document
    // ownerPassword: required to change permissions or unlock features
    // permissions: specify what users can do with the document
    pdfDoc.encrypt({
      userPassword: null,
      ownerPassword: ownerPassword,
      permissions: {
        // Allow printing but disable other features
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false
      },
    });
    
    // Save the document
    const securedPdfBytes = await pdfDoc.save();
    
    // Convert to Blob and return
    return new Blob([securedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error securing PDF:', error);
    throw new Error('Failed to apply security to PDF. Please try a different file.');
  }
};

/**
 * Generates a random password of specified length
 * 
 * @param {number} length - The length of the password
 * @returns {string} - The generated password
 */
const generateRandomPassword = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  const charactersLength = characters.length;
  
  // Use crypto API if available for better randomness
  if (window.crypto && window.crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += characters[randomValues[i] % charactersLength];
    }
  } else {
    // Fallback to Math.random
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  }
  
  return result;
};

/**
 * Checks if a file is a PDF
 * 
 * @param {File} file - The file to check
 * @returns {boolean} - True if the file is a PDF, false otherwise
 */
export const isPdfFile = (file) => {
  return file && file.type === 'application/pdf';
};

/**
 * Returns an array of file types that can be secured
 * Currently only PDFs are supported
 * 
 * @returns {string[]} - Array of MIME types
 */
export const getSecurableFileTypes = () => {
  return ['application/pdf'];
};

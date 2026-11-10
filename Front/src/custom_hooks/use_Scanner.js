import { createWorker } from 'tesseract.js';

/**
 * Preprocesses an image using an offscreen canvas.
 * Applies color-channel thresholding to strip out red pen/marker annotations 
 * and increase contrast for text recognition.
 */
const preprocessImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Red-ignorant filter: Uses mostly Green & Blue channels.
        // Red ink turns bright white so thresholding ignores it.
        const avg = 0.5 * data[i + 1] + 0.5 * data[i + 2];
        const v = avg > 140 ? 255 : 0;
        data[i] = v;     // Red
        data[i + 1] = v; // Green
        data[i + 2] = v; // Blue
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => resolve(blob || file), 'image/png');
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Searches line-by-line for total-related keywords while excluding contact/footer lines.
 */
const parseTotalAmount = (text) => {
  const lines = text.split('\n');

  // Prioritize amounts formatted with currency symbols or explicit decimals (.XX)
  const numberRegex = /(?:₱|PHP|P)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)/gi;
  
  const totalKeywords = [
    'total', 'grand total', 'amount due', 'net total', 
    'subtotal', 'bal due', 'total amount', 'please pay', 'pay amount'
  ];
  
  const ignoreLineKeywords = [
    'tel:', 'tel', 'phone', 'fax', 'mobile', 'email', 'web', 'http', 'www', 'address'
  ];

  let keywordMatchedAmounts = [];
  let allExtractedNumbers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Skip footer lines containing phone numbers, web addresses, or emails
    if (ignoreLineKeywords.some((kw) => line.includes(kw))) {
      continue;
    }

    const matches = [...line.matchAll(numberRegex)];

    for (const match of matches) {
      const val = parseFloat(match[1].replace(/,/g, ''));

      // Allow 0.00 and above, but discard long account/reference numbers (> 500,000)
      if (!isNaN(val) && val >= 0 && val < 500000) {
        const isTotalLine = totalKeywords.some((kw) => line.includes(kw));
        
        if (isTotalLine) {
          keywordMatchedAmounts.push(val);
        } else if (val > 0) {
          allExtractedNumbers.push(val);
        }
      }
    }
  }

  // 1. If keyword line matches were found (even if 0.00), return the highest match on those lines
  if (keywordMatchedAmounts.length > 0) {
    return Math.max(...keywordMatchedAmounts);
  }

  // 2. Fallback to non-zero scanned numbers
  return allExtractedNumbers.length > 0 ? Math.max(...allExtractedNumbers) : 0;
};

/**
 * Main export function for scanning receipt images.
 */
export const scanReceiptImage = async (imageFile) => {
  let processedFile = imageFile;

  // Preprocess image files to clean up color noise and red pen marks
  if (imageFile.type && imageFile.type.startsWith('image/')) {
    try {
      processedFile = await preprocessImage(imageFile);
    } catch (e) {
      console.warn('Preprocessing failed, using original file instead.', e);
    }
  }

  const worker = await createWorker('eng');

  // Set Page Segmentation Mode to single block (mode 6) and restrict character whitelist
  await worker.setParameters({
    tessedit_pageseg_mode: '6',
    tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,₱$-: ',
  });

  const { data: { text } } = await worker.recognize(processedFile);
  await worker.terminate();

  const rawMatches = text.match(/\b(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?\b/g) || [];
  const extractedNumbers = rawMatches.map((numStr) => parseFloat(numStr.replace(/,/g, '')));
  const likelyTotal = parseTotalAmount(text);

  return {
    rawText: text,
    extractedNumbers,
    likelyTotal,
  };
};
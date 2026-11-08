import { createWorker } from 'tesseract.js';

/**
 * 
 * @param {File} imageFile
 * @returns {Promise<{rawText: string, extractedNumbers: number[]}>}
 */
export const scanReceiptImage = async (imageFile) => {

  const worker = await createWorker('eng');

  const { data: { text } } = await worker.recognize(imageFile);

  await worker.terminate();

  const matches = text.match(/\b(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?\b/g) || [];

  const extractedNumbers = matches.map((numStr) =>
    parseFloat(numStr.replace(/,/g, ''))
  );

  return {
    rawText: text,
    extractedNumbers,
  };
};
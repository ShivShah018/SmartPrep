import mammoth from 'mammoth';

export async function extractDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  if (!result.value || !result.value.trim()) {
    throw new Error('DOCX contained no extractable text.');
  }
  return result.value;
}
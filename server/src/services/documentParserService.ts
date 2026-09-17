import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import { logger } from '../utils/logger';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

export const documentParserService = {
  /**
   * Extracts raw text from an uploaded file based on its mime/extension
   */
  async extractText(filePath: string, fileType: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at: ${filePath}`);
      }

      switch (fileType.toLowerCase()) {
        case 'pdf': {
          const buffer = fs.readFileSync(filePath);
          const data = await pdfParse(buffer);
          return data.text || '';
        }

        case 'docx': {
          const result = await mammoth.extractRawText({ path: filePath });
          return result.value || '';
        }

        case 'pptx': {
          // Extract slide XML text from PPTX archive
          try {
            const zip = new AdmZip(filePath);
            const zipEntries = zip.getEntries();
            const slideTexts: string[] = [];

            for (const entry of zipEntries) {
              if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
                const xml = entry.getData().toString('utf8');
                // Strip XML tags to get raw slide text
                const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (text) slideTexts.push(text);
              }
            }

            return slideTexts.join('\n\n');
          } catch (pptxErr: any) {
            logger.warn('Failed to extract PPTX as zip XML:', pptxErr.message);
            return 'Failed to extract text from PPTX presentation.';
          }
        }

        case 'txt': {
          return fs.readFileSync(filePath, 'utf-8');
        }

        case 'image': {
          // Multimodal image extraction via Gemini
          if (env.GEMINI_API_KEY) {
            try {
              const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
              const imageBuffer = fs.readFileSync(filePath);
              const base64Image = imageBuffer.toString('base64');

              const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Image
                    }
                  },
                  {
                    text: 'Please transcribe all visible text, course names, units, topics, assignments, and exam dates from this syllabus image clearly.'
                  }
                ]
              });

              return response.text || '';
            } catch (imgErr: any) {
              logger.warn('Gemini image vision extraction failed:', imgErr.message);
            }
          }
          return 'Image text extraction unavailable without Gemini Vision.';
        }

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (err: any) {
      logger.error(`Error extracting text from ${filePath} (${fileType}):`, err.message);
      throw err;
    }
  }
};

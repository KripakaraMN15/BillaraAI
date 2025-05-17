import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const parseInvoiceBrief = async (brief: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: brief,
    config: {
      systemInstruction: "Extract invoice details from the provided text. Include client name, email, and address if mentioned. Also extract discount percentage and tax percentage if specified. Finally, extract the list of line items with description, quantity, and unitPrice. Return as a single JSON object.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clientName: { type: Type.STRING },
          clientEmail: { type: Type.STRING },
          clientAddress: { type: Type.STRING },
          taxPercent: { type: Type.NUMBER },
          discountPercent: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER }
              },
              required: ["description", "quantity", "unitPrice"]
            }
          }
        },
        required: ["items"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { items: [] };
  }
};

export const generateInvoiceEmail = async (invoiceData: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Draft a professional email for this invoice: ${JSON.stringify(invoiceData)}`,
    config: {
      systemInstruction: "You are a professional accountant. Write a polite and clear email to a client regarding their invoice. Include the invoice number, total amount, and due date. Return the email body as plain text."
    }
  });
  return response.text;
};

export const polishNotes = async (notes: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: notes,
    config: {
      systemInstruction: "Rewrite the following invoice notes or terms and conditions in formal, professional business language. Keep it concise but authoritative."
    }
  });
  return response.text;
};

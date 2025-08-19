import fs from 'fs';

export const logger = {
  info: (context: string, message: string) => console.log(`[${context}] ${message}`),
  error: (context: string, message: string, error?: any) => console.error(`[${context}] ${message}`, error),
};

export const logError = (error: any, message: string) => {
  console.error(message, error);
}

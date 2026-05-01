/**
 * OCR / AI 识别相关类型
 */

/** 百度OCR识别结果 */
export interface OCRResult {
  text: string;
  words_result: Array<{
    words: string;
    location?: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  }>;
}

/** AI识别结果（单笔交易） */
export interface AIRecognitionResult {
  date: string;
  time: string;
  direction: 'expense' | 'income' | 'transfer';
  amount: number;
  accountName: string;
  category: string;
  subCategory: string;
  remark: string;
}

/** AI识别完整响应 */
export interface AIRecognitionResponse {
  ocrText: string;
  results: AIRecognitionResult[];
}

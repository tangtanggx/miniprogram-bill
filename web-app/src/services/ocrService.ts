/**
 * OCR识别 + AI解析服务
 */

import type { OCRResult, AIRecognitionResult, AIRecognitionResponse } from '@/types';
import { DEFAULT_CATEGORIES, DEEPSEEK_CONFIG } from '@/constants';
import { getToday } from '@/utils/format';

const BAIDU_AK = 'oRXpDUES6mTo8jsh8kTMKSp1';
const BAIDU_SK = 'JCDCOv2uiBMkyHby3Gx4YxTyDkKXEKqq';

/** 百度OCR - 获取Access Token */
async function getBaiduToken(): Promise<string> {
  const res = await fetch(
    `/api/baidu/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_AK}&client_secret=${BAIDU_SK}`
  );
  const data = await res.json() as { access_token: string; error?: string; error_description?: string };
  if (data.error) throw new Error(`百度Token错误: ${data.error} - ${data.error_description}`);
  return data.access_token;
}

/** 百度OCR - 通用文字识别 */
export async function recognizeImage(imageBase64: string): Promise<OCRResult> {
  const token = await getBaiduToken();
  const res = await fetch(
    `/api/baidu/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `image=${encodeURIComponent(imageBase64)}&paragraph=true`,
    }
  );
  const data = await res.json() as OCRResult & { error_code?: number; error_msg?: string };
  if (data.error_code) {
    throw new Error(`百度OCR错误: ${data.error_code} - ${data.error_msg}`);
  }
  // 百度OCR返回words_result数组，需要拼接为text
  const words = (data.words_result || []).map((w) => w.words).join('\n');
  return { text: words, words_result: data.words_result || [] };
}

/** 构建DeepSeek提示词 */
function buildAIPrompt(): string {
  const categoryList = DEFAULT_CATEGORIES.expense
    .concat(DEFAULT_CATEGORIES.income)
    .map((c) => {
      const subs = c.subCategories.map((s) => `"${s.name}"`).join(', ');
      return `"${c.name}": [${subs}]`;
    })
    .join('\n');

  return `你是专业的账单识别助手。用户会提供OCR识别的文字（每行前面有置信度百分比），你需要从中提取消费/收入记录。

## 常见OCR错误纠正
- 数字混淆：3→8、1→7、0→O、5→6、9→0
- 缺失小数点：359 → 35.9、1280 → 12.80
- 中文错字：根据上下文语义推断正确内容
- 金额符号：¥和￥都视为人民币符号

## 金额校验规则
- 金额必须有小数点（如35.90而非359）
- 如果数字没有小数点但长度>=3，可能是缺失了小数点
- 根据分类判断金额合理性（餐饮一般5-200、交通3-100、购物10-5000）

## 分类推断规则
- 美团/饿了么/肯德基/麦当劳/星巴克/瑞幸 → 餐饮美食
- 滴滴/高德/地铁/公交/加油/停车 → 交通出行
- 淘宝/京东/拼多多/超市 → 购物消费
- 电影/KTV/游戏/旅游 → 休闲娱乐
- 医院/药店/体检 → 医疗健康
- 水电煤/物业/房租/房贷 → 居住物业
- 话费/流量/宽带 → 通讯网络
- 工资/奖金/转账收入 → 工资收入
- 包含"退款"/"退货" → 其他收入（备注说明）

## 分类映射表（请尽量精确到二级分类）
${categoryList}

## 输出格式
返回JSON数组，每条记录包含：
- date: 日期(YYYY-MM-DD，无日期用今天${getToday()})
- time: 时间(HH:MM，无时间用"00:00")
- direction: expense|income|transfer（只有这三种方向）
- amount: 金额(数字，支出为负数如-35.9，收入为正数)
- category: 一级分类（必须从上方分类表中选择）
- subCategory: 二级分类（尽量精确）
- accountName: 支付账户名称
- remark: 备注/商家名称

## 账户识别规则
根据OCR文字中的银行名称、卡尾号、支付渠道识别对应账户：
- 识别线索：银行名称（如"浦发银行""中国银行"）、卡尾号（如"尾号7552""*7552"）、支付渠道（如"微信支付""支付宝"）
- 如果能匹配到具体银行和卡尾号，填写银行名（如"浦发银行"）
- 如果只有"微信支付""支付宝"但不知道哪张卡，填写"微信支付"或"支付宝"
- 如果完全没有账户线索，填写"未识别账户"

只返回JSON数组，不要其他文字。如果无法识别出任何记录，返回空数组[]。`;
}

/** DeepSeek AI解析 */
export async function parseBillWithAI(ocrText: string): Promise<AIRecognitionResult[]> {
  const res = await fetch(`${DEEPSEEK_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_CONFIG.model,
      messages: [
        { role: 'system', content: buildAIPrompt() },
        { role: 'user', content: ocrText },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });
  const data = await res.json() as { error?: { message: string }; choices?: Array<{ message?: { content?: string } }> };
  if (data.error) throw new Error(`DeepSeek错误: ${data.error.message}`);

  const content = data.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/```json?\s*([\s\S]*?)```/) || content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI返回内容无法解析为JSON');

  return JSON.parse(jsonMatch[1] || jsonMatch[0]) as AIRecognitionResult[];
}

/** 一站式：图片 → OCR → AI解析 */
export async function recognizeAndParseBill(imageBase64: string): Promise<AIRecognitionResponse> {
  const ocrResult = await recognizeImage(imageBase64);
  if (!ocrResult.text.trim()) throw new Error('OCR未能识别到文字');
  const results = await parseBillWithAI(ocrResult.text);
  return { ocrText: ocrResult.text, results };
}

/**
 * svg-captcha 类型声明
 * 该包没有官方类型声明，此处手动声明
 */
declare module 'svg-captcha' {
  interface CaptchaResult {
    data: string;       // SVG 字符串
    text: string;       // 验证码文本
  }

  interface CaptchaOptions {
    size?: number;
    ignoreChars?: string;
    noise?: number;
    color?: boolean;
    background?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    charPreset?: string;
  }

  export function create(options?: CaptchaOptions): CaptchaResult;
  export function createMathExpr(options?: CaptchaOptions): CaptchaResult;
  export function randomText(size: number): string;
  export const options: CaptchaOptions;
}
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 通知服务 - 异常检测触发时发送告警通知
 * 支持通过环境变量配置 Webhook URL，可对接企业微信/钉钉/飞书机器人
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly webhookUrl: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get('NOTIFICATION_WEBHOOK_URL', '');
    this.enabled = !!this.webhookUrl;
    if (this.enabled) {
      this.logger.log('异常通知已启用，Webhook: ' + this.webhookUrl);
    } else {
      this.logger.log('异常通知未配置（设置 NOTIFICATION_WEBHOOK_URL 环境变量以启用）');
    }
  }

  /**
   * 发送异常告警通知
   * @param ruleName 规则名称
   * @param ruleType 规则类型
   * @param riskLevel 风险等级
   * @param count 异常数量
   * @param detailUrl 详情链接
   */
  async sendAlert(ruleName: string, ruleType: string, riskLevel: string, count: number, detailUrl?: string) {
    const message = `【数据门户告警】规则"${ruleName}"检测到 ${count} 条异常\n类型: ${ruleType}\n等级: ${riskLevel}\n时间: ${new Date().toLocaleString()}`;

    this.logger.warn(message);

    if (!this.enabled) return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'text',
          text: { content: message },
        }),
      });
    } catch (error: any) {
      this.logger.error(`发送通知失败: ${error.message}`);
    }
  }
}
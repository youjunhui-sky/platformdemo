import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CAPTCHA_EXPIRE = 300;

@Injectable()
export class CaptchaService {
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    this.redis = new Redis({ host, port });
  }

  async generate(): Promise<{ id: string; image: string }> {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
    }

    const id = 'captcha_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    await this.redis.setex(id, CAPTCHA_EXPIRE, code);

    const image = this.generateSvg(code);
    return { id, image };
  }

  private generateSvg(code: string): string {
    const width = 120;
    const height = 40;
    const chars = code.split('');
    const colors = ['#667eea', '#764ba2', '#3B82F6', '#10B981', '#8B5CF6'];

    const svgChars = chars.map((char, i) => {
      const x = 15 + i * 25;
      const y = 28 + (Math.random() - 0.5) * 10;
      const rotate = (Math.random() - 0.5) * 30;
      const color = colors[Math.floor(Math.random() * colors.length)];
      return `<text x="${x}" y="${y}" fill="${color}" font-family="Courier New" font-size="24" font-weight="bold" transform="rotate(${rotate}, ${x}, ${y})">${char}</text>`;
    }).join('');

    let lines = '';
    for (let i = 0; i < 3; i++) {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height;
      const x2 = Math.random() * width;
      const y2 = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
    }

    let dots = '';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      dots += `<circle cx="${x}" cy="${y}" r="1" fill="${color}" opacity="0.5"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f5f5f5"/>
          <stop offset="100%" style="stop-color:#e0e0e0"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" rx="4"/>
      ${lines}
      ${dots}
      ${svgChars}
    </svg>`;
  }

  async validate(captchaId: string, code: string): Promise<boolean> {
    const storedCode = await this.redis.get(captchaId);
    if (!storedCode) {
      return false;
    }
    await this.redis.del(captchaId);
    return storedCode.toUpperCase() === code.toUpperCase();
  }
}
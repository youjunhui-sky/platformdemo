import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AuditService } from './audit.service';
import { QueryLogDto } from './dto/query-log.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async findAll(@Query() query: QueryLogDto) {
    return this.auditService.findAll(query);
  }

  @Get('logs/export')
  async exportLogs(@Query() query: QueryLogDto, @Res() res: any) {
    const logs = await this.auditService.exportLogs(query);
    const headers = [
      'ID', 'Username', 'Real Name', 'Module', 'Action', 'Method',
      'URL', 'IP Address', 'Response Code', 'Duration (ms)', 'Created At',
    ];
    const rows = logs.map((log: any) => [
      log.id,
      log.username,
      log.realName || '',
      log.module || '',
      log.action,
      log.requestMethod || '',
      log.requestUrl || '',
      log.ipAddress || '',
      log.responseCode || '',
      log.durationMs || '',
      log.createdAt?.toISOString() || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csv);
  }

  @Get('logs/:id')
  async findById(@Param('id') id: string) {
    return this.auditService.findById(id);
  }

  @Get('stats')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getStats(startDate, endDate);
  }
}
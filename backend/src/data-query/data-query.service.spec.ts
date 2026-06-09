import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataQueryService } from './data-query.service';
import { ReportService } from '../report/report.service';
import { DorisService } from './doris.service';

describe('DataQueryService', () => {
  let service: DataQueryService;

  // 模拟依赖服务
  const mockReportService = {
    findByCode: jest.fn(),
  };
  const mockDorisService = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataQueryService,
        { provide: ReportService, useValue: mockReportService },
        { provide: DorisService, useValue: mockDorisService },
      ],
    }).compile();

    service = module.get<DataQueryService>(DataQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应当成功创建服务实例', () => {
    expect(service).toBeDefined();
  });

  describe('queryByReportCode', () => {
    it('清单不存在时应抛出 BadRequestException', async () => {
      mockReportService.findByCode.mockResolvedValue(null);
      await expect(service.queryByReportCode('NOT_EXIST')).rejects.toThrow(BadRequestException);
    });

    it('清单被禁用时应抛出 BadRequestException', async () => {
      mockReportService.findByCode.mockResolvedValue({ status: 0 });
      await expect(service.queryByReportCode('DISABLED')).rejects.toThrow(BadRequestException);
    });
  });

  describe('SQL 注入防护', () => {
    it('参数名包含特殊字符时应被过滤', async () => {
      mockReportService.findByCode.mockResolvedValue({
        reportCode: 'TEST',
        sqlContent: 'SELECT * FROM t WHERE name = {{name}}',
        status: 1,
      });
      mockDorisService.query.mockResolvedValue([]);

      // 参数名 "name; DROP TABLE" 不符合命名规则，应被跳过
      await service.queryByReportCode('TEST', { 'name; DROP TABLE': 'value' });
      // 不应抛出异常，但恶意参数名应被忽略
    });

    it('参数值包含 UNION SELECT 应被拒绝', async () => {
      mockReportService.findByCode.mockResolvedValue({
        reportCode: 'TEST',
        sqlContent: 'SELECT * FROM t WHERE name = {{name}}',
        status: 1,
      });

      await expect(
        service.queryByReportCode('TEST', { name: "' UNION SELECT * FROM users --" }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

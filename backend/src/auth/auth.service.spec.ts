import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CacheService } from '../common/cache.service';
import { TokenBlacklistService } from '../common/token-blacklist.service';
import { CaptchaService } from './captcha.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let cacheService: CacheService;
  let blacklistService: TokenBlacklistService;

  // 模拟 UserRepository
  const mockUserRepo = {
    findOne: jest.fn(),
  };

  // 模拟 JwtService
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  // 模拟 CaptchaService
  const mockCaptchaService = {
    verify: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        CacheService,
        TokenBlacklistService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CaptchaService, useValue: mockCaptchaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    cacheService = module.get<CacheService>(CacheService);
    blacklistService = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应当成功创建服务实例', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('用户名不存在时应抛出 UnauthorizedException', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.login({ username: 'nouser', password: '123456' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('TokenBlacklistService', () => {
    it('加入黑名单后应能检测到', () => {
      const token = 'test.jwt.token.value.here.enough.length';
      blacklistService.addToBlacklist(token, Math.floor(Date.now() / 1000) + 3600);
      expect(blacklistService.isBlacklisted(token)).toBe(true);
    });

    it('不在黑名单中的 token 应返回 false', () => {
      expect(blacklistService.isBlacklisted('valid.token.not.in.blacklist.enough')).toBe(false);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('应当成功创建服务实例', () => {
    expect(service).toBeDefined();
  });

  describe('set / get', () => {
    it('应当正确存取值', () => {
      service.set('key1', 'value1');
      expect(service.get('key1')).toBe('value1');
    });

    it('key 不存在时返回 undefined', () => {
      expect(service.get('notexist')).toBeUndefined();
    });

    it('应当支持对象类型的值', () => {
      const obj = { name: 'test', count: 42 };
      service.set('obj', obj);
      expect(service.get('obj')).toEqual(obj);
    });
  });

  describe('TTL 过期', () => {
    it('过期后 get 应返回 undefined', async () => {
      service.set('ttl_key', 'value', 1); // 1 秒过期
      expect(service.get('ttl_key')).toBe('value');
      // 等待过期
      await new Promise((r) => setTimeout(r, 1100));
      expect(service.get('ttl_key')).toBeUndefined();
    });
  });

  describe('del', () => {
    it('删除后 get 应返回 undefined', () => {
      service.set('del_key', 'value');
      service.del('del_key');
      expect(service.get('del_key')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('清空后所有 key 都不存在', () => {
      service.set('a', 1);
      service.set('b', 2);
      service.clear();
      expect(service.get('a')).toBeUndefined();
      expect(service.get('b')).toBeUndefined();
    });
  });

  describe('LRU 淘汰', () => {
    it('超过 maxItems 时淘汰最久未访问的条目', () => {
      const smallCache = new CacheService(3); // 最多 3 条
      smallCache.set('a', 1);
      smallCache.set('b', 2);
      smallCache.set('c', 3);
      // 访问 a，使其变为最近访问
      smallCache.get('a');
      // 插入第 4 条，应淘汰最久未访问的 b
      smallCache.set('d', 4);
      expect(smallCache.get('a')).toBe(1); // a 被访问过，保留
      expect(smallCache.get('b')).toBeUndefined(); // b 被淘汰
      expect(smallCache.get('c')).toBe(3);
      expect(smallCache.get('d')).toBe(4);
    });
  });
});

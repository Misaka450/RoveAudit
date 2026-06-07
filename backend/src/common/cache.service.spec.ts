import { CacheService } from './cache.service';

/**
 * CacheService 单元测试
 * 测试缓存的存取、过期、容量限制等功能
 */
describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService(5); // 最大 5 条条目，方便测试淘汰
  });

  describe('基本存取', () => {
    it('应能设置和获取缓存值', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('不存在的键应返回 null', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('应能删除指定缓存', () => {
      cache.set('key1', 'value1');
      cache.del('key1');
      expect(cache.get('key1')).toBeNull();
    });

    it('清空后所有缓存应失效', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.size).toBe(0);
    });
  });

  describe('过期机制', () => {
    it('TTL 过期后应返回 null', async () => {
      cache.set('key1', 'value1', 0); // 0 秒 TTL
      // 等待一小段时间确保过期
      await new Promise((r) => setTimeout(r, 10));
      expect(cache.get('key1')).toBeNull();
    });

    it('未过期的缓存应正常返回', () => {
      cache.set('key1', 'value1', 60); // 60 秒 TTL
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('容量限制（LRU 淘汰）', () => {
    it('超出容量时应淘汰最旧的条目', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4);
      cache.set('e', 5); // 此时已满（5 条）
      cache.set('f', 6); // 超出容量，应淘汰最旧的 'a'

      expect(cache.get('a')).toBeNull(); // 已被淘汰
      expect(cache.get('f')).toBe(6); // 新值存在
      expect(cache.size).toBe(5); // 仍保持在 5 条
    });

    it('更新已有条目不应将其视为新条目（FIFO 顺序）', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4);
      cache.set('e', 5);
      // 更新已存在的 'a'
      cache.set('a', 100);
      // 再新增一条 f → 超出容量，淘汰最旧的 'a'
      cache.set('f', 6);

      expect(cache.get('a')).toBeNull(); // 'a' 是最旧的，被淘汰
      expect(cache.get('b')).toBe(2); // 'b' 仍存在
      expect(cache.get('f')).toBe(6);
      expect(cache.size).toBe(5);
    });
  });

  describe('按前缀删除', () => {
    it('应删除所有匹配前缀的缓存键', () => {
      cache.set('report:1', 'a');
      cache.set('report:2', 'b');
      cache.set('user:1', 'c');
      cache.delByPrefix('report:');

      expect(cache.get('report:1')).toBeNull();
      expect(cache.get('report:2')).toBeNull();
      expect(cache.get('user:1')).toBe('c');
    });
  });

  describe('size 属性', () => {
    it('应正确返回缓存条目数', () => {
      expect(cache.size).toBe(0);
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      cache.set('b', 2);
      expect(cache.size).toBe(2);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });
});
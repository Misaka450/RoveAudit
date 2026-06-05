const { Client } = require('pg');

const client = new Client({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'data_portal',
});

async function main() {
  try {
    await client.connect();
    
    // 查询系统管理菜单 ID
    const systemMenu = await client.query(`SELECT id FROM sys_menu WHERE path = '/system' LIMIT 1`);
    if (systemMenu.rows.length === 0) {
      console.log('未找到系统管理菜单');
      await client.end();
      return;
    }
    const systemMenuId = systemMenu.rows[0].id;
    console.log('系统管理菜单 ID:', systemMenuId);
    
    // 检查下载日志菜单是否已存在
    const exists = await client.query(`SELECT id FROM sys_menu WHERE path = '/system/download-logs'`);
    if (exists.rows.length > 0) {
      console.log('下载日志菜单已存在');
      await client.end();
      return;
    }
    
    // 插入下载日志菜单
    await client.query(`
      INSERT INTO sys_menu (menu_name, parent_id, path, icon, sort_order, status)
      VALUES ('下载日志', $1, '/system/download-logs', 'FileTextOutlined', 4, 1)
    `, [systemMenuId]);
    
    console.log('下载日志菜单添加成功！');
    await client.end();
  } catch (e) {
    console.error('错误:', e);
    process.exit(1);
  }
}

main();

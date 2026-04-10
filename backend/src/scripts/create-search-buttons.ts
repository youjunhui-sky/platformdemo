import { AppDataSource } from '../database/data-source';
import { Menu } from '../entities/platform/menu.entity';
import { Repository } from 'typeorm';

async function createSearchButtons() {
  await AppDataSource.initialize();
  const menuRepo: Repository<Menu> = AppDataSource.getRepository(Menu);

  const roleMenu = await menuRepo.findOne({ where: { code: 'platform:role' } });
  console.log('roleMenu:', roleMenu?.id);

  const buttons = [
    { name: '查询角色', code: 'platform:role:query', permission: 'role:query', sort: 10 },
    { name: '重置角色', code: 'platform:role:reset', permission: 'role:reset', sort: 11 }
  ];

  for (const btn of buttons) {
    const existing = await menuRepo.findOne({ where: { code: btn.code } });
    if (existing) { console.log('exists:', btn.code); continue; }
    const menu = menuRepo.create({
      parentId: roleMenu!.id,
      name: btn.name,
      code: btn.code,
      path: '',
      component: '',
      type: 'button',
      permission: btn.permission,
      sortOrder: btn.sort,
      status: 1,
      isVisible: true
    });
    await menuRepo.save(menu);
    console.log('created:', btn.name);
  }

  console.log('done');
  await AppDataSource.destroy();
  process.exit(0);
}

createSearchButtons();
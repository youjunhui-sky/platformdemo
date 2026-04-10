import { AppDataSource } from '../database/data-source';
import { Menu } from '../entities/platform/menu.entity';

async function createOrganizationMenu() {
  await AppDataSource.initialize();
  const menuRepo = AppDataSource.getRepository(Menu);

  // Check if organization menu exists
  let orgMenu = await menuRepo.findOne({ where: { code: 'platform:organization' } });

  if (!orgMenu) {
    orgMenu = menuRepo.create({
      name: '机构管理',
      code: 'platform:organization',
      path: '/system-management/organization',
      component: 'system-management/organization/index',
      type: 'menu',
      sortOrder: 5,
      status: 1,
      isVisible: true
    });
    await menuRepo.save(orgMenu);
    console.log('created organization menu');
  } else {
    console.log('organization menu already exists', orgMenu.id);
  }

  // Organization management buttons
  const buttons = [
    { name: '新增机构', code: 'platform:organization:create', permission: 'organization:create' },
    { name: '编辑机构', code: 'platform:organization:update', permission: 'organization:update' },
    { name: '删除机构', code: 'platform:organization:delete', permission: 'organization:delete' }
  ];

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const existing = await menuRepo.findOne({ where: { code: btn.code } });
    if (existing) {
      console.log('exists:', btn.code);
      continue;
    }
    const menu = menuRepo.create({
      parentId: orgMenu!.id,
      name: btn.name,
      code: btn.code,
      path: '',
      component: '',
      type: 'button',
      permission: btn.permission,
      sortOrder: i,
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

createOrganizationMenu();
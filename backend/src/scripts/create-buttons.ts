import { AppDataSource } from '../database/data-source';
import { Menu } from '../entities/platform/menu.entity';

async function createButtons() {
  await AppDataSource.initialize();
  const menuRepo = AppDataSource.getRepository(Menu);

  const userMenu = await menuRepo.findOne({ where: { code: 'platform:user' } });
  const roleMenu = await menuRepo.findOne({ where: { code: 'platform:role' } });
  const subMenu = await menuRepo.findOne({ where: { code: 'platform:subsystem' } });
  const menuManageMenu = await menuRepo.findOne({ where: { code: 'platform:menu' } });
  console.log('userMenu:', userMenu?.id);
  console.log('roleMenu:', roleMenu?.id);
  console.log('subMenu:', subMenu?.id);
  console.log('menuManageMenu:', menuManageMenu?.id);

  // User management buttons
  const userButtons = [
    { name: '新增用户', code: 'platform:user:create', permission: 'user:create' },
    { name: '编辑用户', code: 'platform:user:update', permission: 'user:update' },
    { name: '分配角色', code: 'platform:user:roles', permission: 'user:roles' },
    { name: '重置密码', code: 'platform:user:reset-password', permission: 'user:reset-password' },
    { name: '禁用用户', code: 'platform:user:disable', permission: 'user:disable' },
    { name: '启用用户', code: 'platform:user:enable', permission: 'user:enable' },
    { name: '删除用户', code: 'platform:user:delete', permission: 'user:delete' }
  ];
  for (let i = 0; i < userButtons.length; i++) {
    const btn = userButtons[i];
    const existing = await menuRepo.findOne({ where: { code: btn.code } });
    if (existing) { console.log('exists:', btn.code); continue; }
    const menu = menuRepo.create({
      parentId: userMenu!.id,
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
    console.log('created user:', btn.name);
  }

  // Role management buttons
  const roleButtons = [
    { name: '新增角色', code: 'platform:role:create', permission: 'role:create' },
    { name: '编辑角色', code: 'platform:role:update', permission: 'role:update' },
    { name: '菜单权限', code: 'platform:role:menus', permission: 'role:menus' },
    { name: '子系统权限', code: 'platform:role:subsystems', permission: 'role:subsystems' },
    { name: '数据范围', code: 'platform:role:data-scope', permission: 'role:data-scope' },
    { name: '删除角色', code: 'platform:role:delete', permission: 'role:delete' }
  ];
  for (let i = 0; i < roleButtons.length; i++) {
    const btn = roleButtons[i];
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
      sortOrder: i,
      status: 1,
      isVisible: true
    });
    await menuRepo.save(menu);
    console.log('created role:', btn.name);
  }

  // Subsystem management buttons
  const subsystemButtons = [
    { name: '新增子系统', code: 'platform:subsystem:create', permission: 'subsystem:create' },
    { name: '编辑子系统', code: 'platform:subsystem:update', permission: 'subsystem:update' },
    { name: '重新生成密钥', code: 'platform:subsystem:rotate-secret', permission: 'subsystem:rotate-secret' },
    { name: '删除子系统', code: 'platform:subsystem:delete', permission: 'subsystem:delete' }
  ];
  for (let i = 0; i < subsystemButtons.length; i++) {
    const btn = subsystemButtons[i];
    const existing = await menuRepo.findOne({ where: { code: btn.code } });
    if (existing) { console.log('exists:', btn.code); continue; }
    const menu = menuRepo.create({
      parentId: subMenu!.id,
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
    console.log('created subsystem:', btn.name);
  }

  // Menu management buttons
  const menuManageButtons = [
    { name: '新增菜单', code: 'platform:menu:create', permission: 'menu:create' },
    { name: '编辑菜单', code: 'platform:menu:update', permission: 'menu:update' },
    { name: '删除菜单', code: 'platform:menu:delete', permission: 'menu:delete' }
  ];
  for (let i = 0; i < menuManageButtons.length; i++) {
    const btn = menuManageButtons[i];
    const existing = await menuRepo.findOne({ where: { code: btn.code } });
    if (existing) { console.log('exists:', btn.code); continue; }
    const menu = menuRepo.create({
      parentId: menuManageMenu!.id,
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
    console.log('created menu:', btn.name);
  }

  console.log('done');
  await AppDataSource.destroy();
  process.exit(0);
}

createButtons();
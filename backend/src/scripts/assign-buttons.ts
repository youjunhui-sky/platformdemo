import { AppDataSource } from '../database/data-source';

async function assignPermissions() {
  await AppDataSource.initialize();
  const ds = AppDataSource;
  const roleId = '3a9d0af8-3fd8-4242-9c8d-0da60a2773df';

  // Get all button menus
  const buttons = await ds.query('SELECT id FROM sys_menu WHERE type = $1', ['button']);
  console.log('buttons:', buttons.length);

  // Insert into sys_role_menu table
  for (const btn of buttons) {
    await ds.query(
      'INSERT INTO sys_role_menu (role_id, menu_id, permission_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [roleId, btn.id, 'visible']
    );
    console.log('assigned:', btn.id);
  }

  console.log('done');
  await AppDataSource.destroy();
  process.exit(0);
}

assignPermissions();
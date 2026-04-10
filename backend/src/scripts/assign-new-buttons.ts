import { AppDataSource } from '../database/data-source';

async function assignNewPermissions() {
  await AppDataSource.initialize();
  const ds = AppDataSource;
  const roleId = '3a9d0af8-3fd8-4242-9c8d-0da60a2773df';

  // Get new button menus
  const buttons = await ds.query('SELECT id FROM sys_menu WHERE code IN ($1, $2)', ['platform:role:query', 'platform:role:reset']);
  console.log('buttons:', buttons.length);

  // Insert into sys_role_menu table
  for (const btn of buttons) {
    await ds.query(
      'INSERT INTO sys_role_menu (role_id, menu_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [roleId, btn.id]
    );
    console.log('assigned:', btn.id);
  }

  console.log('done');
  await AppDataSource.destroy();
  process.exit(0);
}

assignNewPermissions();
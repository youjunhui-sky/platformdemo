import { DataSource, IsNull, In } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, Role, Subsystem, Menu, Organization, RoleMenu, UserRole, RoleSubsystem } from '../entities';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'hospital_idp',
  synchronize: false,
  logging: false,
  entities: [User, Role, Subsystem, Menu, Organization, RoleMenu, UserRole, RoleSubsystem],
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const orgRepo = AppDataSource.getRepository(Organization);
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const subsystemRepo = AppDataSource.getRepository(Subsystem);
  const menuRepo = AppDataSource.getRepository(Menu);

  // Create organizations (idempotent)
  let hospital = await orgRepo.findOne({ where: { code: 'hospital_001' } });
  if (!hospital) {
    hospital = await orgRepo.save({
      name: '测试医院',
      code: 'hospital_001',
      level: 1,
      type: 'hospital',
      sortOrder: 0,
      status: 1,
    });
    console.log('Hospital created');
  } else {
    console.log('Hospital already exists, skipping');
  }

  let dept1 = await orgRepo.findOne({ where: { code: 'dept_internal' } });
  if (!dept1) {
    dept1 = await orgRepo.save({
      name: '内科',
      code: 'dept_internal',
      parentId: hospital.id,
      level: 2,
      type: 'department',
      sortOrder: 1,
      status: 1,
    });
    console.log('Dept internal created');
  } else {
    dept1 = await orgRepo.findOne({ where: { code: 'dept_internal' } });
    console.log('Dept internal already exists, skipping');
  }

  let dept2 = await orgRepo.findOne({ where: { code: 'dept_surgery' } });
  if (!dept2) {
    dept2 = await orgRepo.save({
      name: '外科',
      code: 'dept_surgery',
      parentId: hospital.id,
      level: 2,
      type: 'department',
      sortOrder: 2,
      status: 1,
    });
    console.log('Dept surgery created');
  } else {
    dept2 = await orgRepo.findOne({ where: { code: 'dept_surgery' } });
    console.log('Dept surgery already exists, skipping');
  }

  // Create subsystems (idempotent)
  const existingSubsystems = await subsystemRepo.find();
  if (existingSubsystems.length === 0) {
    await subsystemRepo.save([
      {
        code: 'his',
        name: '医院信息系统',
        appId: `app_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        appSecretHash: await bcrypt.hash('his_secret_123', 12),
        domain: 'http://localhost:3001',
        description: '医院核心业务系统',
        status: 'active',
        authType: 'jwt',
        ssoEnabled: true,
      },
      {
        code: 'pacs',
        name: '影像归档系统',
        appId: `app_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        appSecretHash: await bcrypt.hash('pacs_secret_123', 12),
        domain: 'http://localhost:3002',
        description: 'PACS影像系统',
        status: 'active',
        authType: 'jwt',
        ssoEnabled: true,
      },
      {
        code: 'lis',
        name: '检验信息系统',
        appId: `app_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        appSecretHash: await bcrypt.hash('lis_secret_123', 12),
        domain: 'http://localhost:3003',
        description: 'LIS检验系统',
        status: 'active',
        authType: 'jwt',
        ssoEnabled: true,
      },
    ]);
    console.log('Subsystems created');
  } else {
    console.log('Subsystems already exist, skipping');
  }

  // =============================================================
  // Platform menus will be created below
  const allMenus = await menuRepo.find();
  const existingPlatformMenus = allMenus.filter(m => !m.subsystemId);
  if (existingPlatformMenus.length === 0) {
    const platformMenuData = [
      // 平台一级菜单
      { subsystemId: null, parentId: null, name: '工作台', code: 'platform:dashboard', path: '/dashboard', component: '/dashboard/index', icon: 'home', sortOrder: 0, type: 'menu', isVisible: true },
      { subsystemId: null, parentId: null, name: '子系统访问', code: 'platform:subsystem', path: '/subsystem-access', component: '/subsystem-access/index', icon: 'app', sortOrder: 1, type: 'menu', isVisible: true },
      { subsystemId: null, parentId: null, name: '系统管理', code: 'platform:system', path: '/system-management', component: '', icon: 'setting', sortOrder: 99, type: 'menu', isVisible: true },
      // 子菜单 - 系统管理
      { subsystemId: null, parentId: null, name: '用户管理', code: 'platform:user', path: '/system-management/user', component: '/system-management/user/index', icon: 'user', sortOrder: 0, type: 'menu', isVisible: true, permission: 'user:create,user:update,user:roles,user:reset-password,user:disable,user:enable,user:delete' },
      { subsystemId: null, parentId: null, name: '角色管理', code: 'platform:role', path: '/system-management/role', component: '/system-management/role/index', icon: 'role', sortOrder: 1, type: 'menu', isVisible: true, permission: 'role:create,role:update,role:delete' },
      { subsystemId: null, parentId: null, name: '菜单管理', code: 'platform:menu', path: '/system-management/menu', component: '/system-management/menu/index', icon: 'menu', sortOrder: 2, type: 'menu', isVisible: true, permission: 'menu:create,menu:update,menu:delete' },
      { subsystemId: null, parentId: null, name: '子系统管理', code: 'platform:subsystem', path: '/system-management/subsystem', component: '/system-management/subsystem/index', icon: 'app', sortOrder: 3, type: 'menu', isVisible: true, permission: 'subsystem:create,subsystem:update,subsystem:delete' },
      // 审计日志
      { subsystemId: null, parentId: null, name: '审计日志', code: 'platform:audit', path: '/audit', component: '/audit/index', icon: 'document', sortOrder: 100, type: 'menu', isVisible: true },
    ];
    await menuRepo.save(platformMenuData);
    console.log('Platform Menus created');
  } else {
    console.log('Platform Menus already exist, updating parent relationships...');

    // Update existing platform menus to have status=1
    await menuRepo.update({ subsystemId: IsNull() }, { status: 1 });
    console.log('Updated platform menus status to 1');

    // Fetch existing platform menus to set parent relationships
    const platformMenus = await menuRepo.find({ where: { subsystemId: IsNull() } });

    // Find parent menus by code
    const systemManageMenu = platformMenus.find(m => m.code === 'platform:system');
    const dashboardMenu = platformMenus.find(m => m.code === 'platform:dashboard');
    const subsystemMenu = platformMenus.find(m => m.code === 'platform:subsystem');
    const auditMenu = platformMenus.find(m => m.code === 'platform:audit');

    if (systemManageMenu) {
      // Update children of 系统管理
      const userMenu = platformMenus.find(m => m.code === 'platform:user');
      const roleMenu = platformMenus.find(m => m.code === 'platform:role');
      const menuManageMenu = platformMenus.find(m => m.code === 'platform:menu');
      const subsystemManageMenu = platformMenus.find(m => m.code === 'platform:subsystem');

      if (userMenu) {
        userMenu.parentId = systemManageMenu.id;
        await menuRepo.save(userMenu);
      }
      if (roleMenu) {
        roleMenu.parentId = systemManageMenu.id;
        await menuRepo.save(roleMenu);
      }
      if (menuManageMenu) {
        menuManageMenu.parentId = systemManageMenu.id;
        await menuRepo.save(menuManageMenu);
      }
      if (subsystemManageMenu) {
        subsystemManageMenu.parentId = systemManageMenu.id;
        await menuRepo.save(subsystemManageMenu);
      }
      console.log('Platform menu parent relationships updated');
    }
  }

  // =============================================================
  // Subsystem menus are now created below with role associations
  // =============================================================
  // Create users (idempotent)
  let adminUser = await userRepo.findOne({ where: { username: 'admin' } });
  if (!adminUser) {
    adminUser = await userRepo.save({
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 12),
      realName: '系统管理员',
      email: 'admin@hospital.local',
      orgId: hospital.id,
      status: 1,
      isFirstLogin: true,
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists, skipping');
  }

  let doctor1 = await userRepo.findOne({ where: { username: 'doctor1' } });
  if (!doctor1 && dept1) {
    doctor1 = await userRepo.save({
      username: 'doctor1',
      passwordHash: await bcrypt.hash('doctor123', 12),
      realName: '张医生',
      email: 'zhang@hospital.local',
      phone: '13800138001',
      orgId: dept1.id,
      status: 1,
      isFirstLogin: true,
    });
    console.log('Doctor1 created');
  } else {
    console.log('Doctor1 already exists, skipping');
  }

  // Create admin role and assign menus (idempotent)
  const roleMenuRepo = AppDataSource.getRepository(RoleMenu);
  const userRoleRepo = AppDataSource.getRepository(UserRole);

  let adminRole = await roleRepo.findOne({ where: { code: 'admin' } });
  if (!adminRole) {
    adminRole = await roleRepo.save({
      name: '超级管理员',
      code: 'admin',
      level: 1,
      description: '系统超级管理员，拥有所有权限',
    });
    console.log('Admin role created');
  } else {
    console.log('Admin role already exists, skipping');
  }

  // Assign all platform menus to BOTH admin roles (idempotent)
  const platformMenus = await menuRepo.find({ where: { subsystemId: IsNull() } });

  // Find both admin roles
  const adminRoles = await roleRepo.find({ where: { code: In(['admin', 'super_admin']) } });

  for (const role of adminRoles) {
    const existingRoleMenus = await roleMenuRepo.find({ where: { roleId: role.id } });
    if (existingRoleMenus.length === 0 && platformMenus.length > 0) {
      const roleMenuEntries = platformMenus.map(menu => ({
        roleId: role.id,
        menuId: menu.id,
        permissionType: 'visible',
      }));
      await roleMenuRepo.save(roleMenuEntries);
      console.log(`Assigned ${platformMenus.length} menus to ${role.name} role`);
    } else {
      console.log(`${role.name} role menus already assigned, skipping`);
    }
  }

  // Associate admin user with all admin roles (idempotent)
  if (adminUser && adminRoles.length > 0) {
    for (const role of adminRoles) {
      const existingUserRole = await userRoleRepo.findOne({
        where: { userId: adminUser.id, roleId: role.id },
      });
      if (!existingUserRole) {
        await userRoleRepo.save({
          userId: adminUser.id,
          roleId: role.id,
        });
        console.log(`Associated admin user with ${role.name} role`);
      } else {
        console.log(`Admin user ${role.name} association already exists, skipping`);
      }
    }
  }

  // =============================================================
  // Create Subsystem Menus and Role Subsystem Associations
  // =============================================================
  const roleSubsystemRepo = AppDataSource.getRepository(RoleSubsystem);

  // Get all subsystems
  const allSubsystems = await subsystemRepo.find();
  const hisSubsystem = allSubsystems.find(s => s.code === 'his');

  // Create HIS menus (no subsystemId - use platform menus with subsystem code)
  const existingHisMenus = await menuRepo.find({
    where: { code: 'his:dashboard' }
  });
  if (existingHisMenus.length === 0) {
    const hisMenuData = [
      // HIS 一级菜单
      { name: 'HIS工作台', code: 'his:dashboard', path: '/his', component: '/subsystems/his/index', icon: 'home', sortOrder: 0, type: 'menu', isVisible: true },
      { name: '患者管理', code: 'his:patient', path: '/his/patient', component: '/subsystems/his/patient/index', icon: 'user', sortOrder: 1, type: 'menu', isVisible: true },
      { name: '门诊管理', code: 'his:outpatient', path: '/his/outpatient', component: '/subsystems/his/outpatient/index', icon: 'document', sortOrder: 2, type: 'menu', isVisible: true },
      { name: '住院管理', code: 'his:inpatient', path: '/his/inpatient', component: '/subsystems/his/inpatient/index', icon: 'hospital', sortOrder: 3, type: 'menu', isVisible: true },
    ];
    const hisMenus = await menuRepo.save(hisMenuData);

    // Set parent relationships
    const hisDashboardMenu = hisMenus.find(m => m.code === 'his:dashboard');
    const hisPatientMenu = hisMenus.find(m => m.code === 'his:patient');
    const hisOutpatientMenu = hisMenus.find(m => m.code === 'his:outpatient');
    const hisInpatientMenu = hisMenus.find(m => m.code === 'his:inpatient');

    if (hisPatientMenu && hisDashboardMenu) {
      hisPatientMenu.parentId = hisDashboardMenu.id;
      await menuRepo.save(hisPatientMenu);
    }
    if (hisOutpatientMenu && hisDashboardMenu) {
      hisOutpatientMenu.parentId = hisDashboardMenu.id;
      await menuRepo.save(hisOutpatientMenu);
    }
    if (hisInpatientMenu && hisDashboardMenu) {
      hisInpatientMenu.parentId = hisDashboardMenu.id;
      await menuRepo.save(hisInpatientMenu);
    }
    console.log('HIS Menus created');
  }

  // Create LIS menus
  const existingLisMenus = await menuRepo.find({
    where: { code: 'lis:dashboard' }
  });
  if (existingLisMenus.length === 0) {
    const lisMenuData = [
      { name: 'LIS工作台', code: 'lis:dashboard', path: '/lis', component: '/subsystems/lis/index', icon: 'home', sortOrder: 0, type: 'menu', isVisible: true },
      { name: '检验任务', code: 'lis:task', path: '/lis/task', component: '/subsystems/lis/task/index', icon: 'document', sortOrder: 1, type: 'menu', isVisible: true },
      { name: '结果管理', code: 'lis:result', path: '/lis/result', component: '/subsystems/lis/result/index', icon: 'document', sortOrder: 2, type: 'menu', isVisible: true },
    ];
    await menuRepo.save(lisMenuData);
    console.log('LIS Menus created');
  }

  // Create PACS menus
  const existingPacsMenus = await menuRepo.find({
    where: { code: 'pacs:dashboard' }
  });
  if (existingPacsMenus.length === 0) {
    const pacsMenuData = [
      { name: 'PACS工作台', code: 'pacs:dashboard', path: '/pacs', component: '/subsystems/pacs/index', icon: 'home', sortOrder: 0, type: 'menu', isVisible: true },
      { name: '检查管理', code: 'pacs:study', path: '/pacs/study', component: '/subsystems/pacs/study/index', icon: 'document', sortOrder: 1, type: 'menu', isVisible: true },
      { name: '报告管理', code: 'pacs:report', path: '/pacs/report', component: '/subsystems/pacs/report/index', icon: 'document', sortOrder: 2, type: 'menu', isVisible: true },
    ];
    await menuRepo.save(pacsMenuData);
    console.log('PACS Menus created');
  }

  // Assign subsystems to admin role
  if (adminRole && allSubsystems.length > 0) {
    for (const subsystem of allSubsystems) {
      const existingRoleSubsystem = await roleSubsystemRepo.findOne({
        where: { roleId: adminRole.id, subsystemId: subsystem.id },
      });
      if (!existingRoleSubsystem) {
        await roleSubsystemRepo.save({
          roleId: adminRole.id,
          subsystemId: subsystem.id,
          status: 1,
        });
        console.log(`Assigned subsystem ${subsystem.code} to admin role`);
      }
    }
  }

  console.log('Seed completed successfully');
  console.log('\nDefault credentials:');
  console.log('  Username: admin, Password: admin123');
  console.log('  Username: doctor1, Password: doctor123');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

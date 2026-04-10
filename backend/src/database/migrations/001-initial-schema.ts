import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709500000000 implements MigrationInterface {
  name = 'InitialSchema1709500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // sys_organization
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_organization (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_id UUID REFERENCES sys_organization(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        level SMALLINT NOT NULL DEFAULT 1,
        sort_order SMALLINT DEFAULT 0,
        type VARCHAR(20) NOT NULL,
        status SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_code ON sys_organization(code)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_parent ON sys_organization(parent_id)`);

    // sys_user
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_user (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        real_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        avatar_url VARCHAR(500),
        org_id UUID REFERENCES sys_organization(id) ON DELETE SET NULL,
        status SMALLINT DEFAULT 1,
        is_first_login BOOLEAN DEFAULT TRUE,
        password_expire_at TIMESTAMPTZ,
        last_login_at TIMESTAMPTZ,
        last_login_ip INET,
        login_fail_count SMALLINT DEFAULT 0,
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_username ON sys_user(username)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_org ON sys_user(org_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_status ON sys_user(status)`);

    // sys_role
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_role (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        level SMALLINT DEFAULT 5,
        description VARCHAR(500),
        data_scope SMALLINT DEFAULT 4,
        is_system BOOLEAN DEFAULT FALSE,
        status SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_role_code ON sys_role(code)`);

    // sys_subsystem
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_subsystem (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        app_id VARCHAR(100) UNIQUE NOT NULL,
        app_secret_hash VARCHAR(255) NOT NULL,
        domain VARCHAR(500) NOT NULL,
        logo_url VARCHAR(500),
        description VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending',
        auth_type VARCHAR(20) DEFAULT 'jwt',
        sso_enabled BOOLEAN DEFAULT TRUE,
        auto_logout_sync BOOLEAN DEFAULT TRUE,
        menu_sync_url VARCHAR(500),
        callback_url VARCHAR(500),
        health_check_url VARCHAR(500),
        health_check_interval INT DEFAULT 60,
        last_health_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}',
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        registered_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subsystem_code ON sys_subsystem(code)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subsystem_status ON sys_subsystem(status)`);

    // sys_menu
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_menu (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        parent_id UUID REFERENCES sys_menu(id) ON DELETE CASCADE,
        subsystem_id UUID REFERENCES sys_subsystem(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(100) NOT NULL,
        path VARCHAR(255),
        component VARCHAR(255),
        redirect VARCHAR(255),
        icon VARCHAR(100),
        sort_order SMALLINT DEFAULT 0,
        type VARCHAR(20) DEFAULT 'menu',
        permission VARCHAR(100),
        is_visible BOOLEAN DEFAULT TRUE,
        is_cache BOOLEAN DEFAULT FALSE,
        is_frame BOOLEAN DEFAULT FALSE,
        status SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(subsystem_id, code)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_code ON sys_menu(code)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_subsystem ON sys_menu(subsystem_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_menu_parent ON sys_menu(parent_id)`);

    // sys_user_role (many-to-many)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_user_role (
        user_id UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, role_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_role_user ON sys_user_role(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_role_role ON sys_user_role(role_id)`);

    // sys_role_subsystem
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_role_subsystem (
        role_id UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
        subsystem_id UUID NOT NULL REFERENCES sys_subsystem(id) ON DELETE CASCADE,
        status SMALLINT DEFAULT 1,
        granted_at TIMESTAMPTZ DEFAULT NOW(),
        granted_by UUID,
        PRIMARY KEY (role_id, subsystem_id)
      )
    `);

    // sys_role_menu
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_role_menu (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role_id UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
        menu_id UUID NOT NULL REFERENCES sys_menu(id) ON DELETE CASCADE,
        permission_type VARCHAR(20) DEFAULT 'visible',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(role_id, menu_id, permission_type)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_role_menu_role ON sys_role_menu(role_id)`);

    // sys_data_permission_rule
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_data_permission_rule (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role_id UUID NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
        subsystem_id UUID REFERENCES sys_subsystem(id) ON DELETE SET NULL,
        entity_type VARCHAR(100) NOT NULL,
        field_name VARCHAR(100) NOT NULL,
        operator VARCHAR(20) NOT NULL,
        value_type VARCHAR(20) NOT NULL,
        value TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_data_rule_role ON sys_data_permission_rule(role_id)`);

    // sys_audit_log
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_audit_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES sys_user(id),
        username VARCHAR(50) NOT NULL,
        real_name VARCHAR(100),
        subsystem_code VARCHAR(50),
        module VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        description TEXT,
        request_method VARCHAR(10),
        request_url VARCHAR(500),
        request_params JSONB,
        request_body JSONB,
        response_code SMALLINT,
        response_body JSONB,
        ip_address INET,
        user_agent VARCHAR(500),
        device_info VARCHAR(255),
        duration_ms INT,
        error_message TEXT,
        session_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_user ON sys_audit_log(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_action ON sys_audit_log(action)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_created ON sys_audit_log(created_at)`);

    // sys_token_blacklist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_token_blacklist (
        token_jti VARCHAR(100) PRIMARY KEY,
        user_id UUID NOT NULL,
        revoked_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_blacklist_user ON sys_token_blacklist(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON sys_token_blacklist(expires_at)`);

    // sys_user_session
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sys_user_session (
        session_id VARCHAR(100) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
        refresh_token_jti VARCHAR(100) NOT NULL,
        device_info VARCHAR(255),
        ip_address INET,
        user_agent VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_session_user ON sys_user_session(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_session_expires ON sys_user_session(expires_at)`);

    // Insert default admin user (password: admin123)
    await queryRunner.query(`
      INSERT INTO sys_user (username, password_hash, real_name, email, status, is_first_login)
      VALUES ('admin', '$2b$12$JfvTEYquiq1.4XFiysdnmOVZHFW/1ozDvKbykHFEPLVz9mtX0/d2.', 'System Administrator', 'admin@hospital.local', 1, true)
      ON CONFLICT (username) DO NOTHING
    `);

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO sys_role (name, code, level, description, data_scope, is_system, status)
      VALUES
        ('超级管理员', 'super_admin', 1, '系统超级管理员，拥有所有权限', 1, true, 1),
        ('系统管理员', 'admin', 2, '系统管理员', 2, true, 1),
        ('普通用户', 'user', 5, '普通用户', 4, false, 1)
      ON CONFLICT (code) DO NOTHING
    `);

    // Assign admin role to admin user
    await queryRunner.query(`
      INSERT INTO sys_user_role (user_id, role_id)
      SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'admin' AND r.code = 'super_admin'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sys_user_session CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_token_blacklist CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_audit_log CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_data_permission_rule CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_role_menu CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_role_subsystem CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_user_role CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_menu CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_subsystem CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_role CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_user CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sys_organization CASCADE`);
  }
}

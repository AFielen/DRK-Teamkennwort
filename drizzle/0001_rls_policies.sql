-- Row-Level Security Policies for Tenant Isolation
-- This migration MUST be run after the initial schema migration

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create app_user role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user;
  END IF;
END
$$;

-- Grant basic permissions to app_user
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT, INSERT, UPDATE ON teams TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON vault_entries TO app_user;
GRANT SELECT, INSERT ON audit_log TO app_user;  -- NO DELETE on audit_log!
GRANT SELECT, INSERT, UPDATE ON invitations TO app_user;
GRANT SELECT ON tenants TO app_user;

-- Tenant isolation policies
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation_teams ON teams
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation_team_members ON team_members
  USING (
    team_id IN (
      SELECT id FROM teams
      WHERE tenant_id = current_setting('app.current_tenant', true)::uuid
    )
  );

CREATE POLICY tenant_isolation_vault_entries ON vault_entries
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation_audit_log ON audit_log
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY tenant_isolation_invitations ON invitations
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Revoke DELETE on audit_log from app_user (append-only)
REVOKE DELETE ON audit_log FROM app_user;

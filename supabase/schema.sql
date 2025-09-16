-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  foundarv_id VARCHAR(10) UNIQUE NOT NULL,
  user_type VARCHAR(20) DEFAULT 'individual' CHECK (user_type IN ('individual', 'founder')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  folder_type VARCHAR(50) DEFAULT 'custom',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  original_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  ai_generated_name BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shares table
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_with_foundarv_id VARCHAR(10),
  shared_with_email VARCHAR(255),
  permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'upload', 'full')),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp sessions table
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_foundarv_id ON users(foundarv_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_display_name ON files USING gin(to_tsvector('english', display_name));
CREATE INDEX idx_files_tags ON files USING gin(tags);
CREATE INDEX idx_shares_access_token ON shares(access_token);
CREATE INDEX idx_shares_shared_with_foundarv_id ON shares(shared_with_foundarv_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Folders policies
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own folders" ON folders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (user_id = auth.uid());

-- Files policies
CREATE POLICY "Users can view own files" ON files FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own files" ON files FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (user_id = auth.uid());

-- Shares policies
CREATE POLICY "Users can view own shares" ON shares FOR SELECT USING (shared_by = auth.uid());
CREATE POLICY "Users can create shares" ON shares FOR INSERT WITH CHECK (shared_by = auth.uid());
CREATE POLICY "Users can update own shares" ON shares FOR UPDATE USING (shared_by = auth.uid());
CREATE POLICY "Users can delete own shares" ON shares FOR DELETE USING (shared_by = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION generate_foundarv_id()
RETURNS VARCHAR(10) AS $$
DECLARE
  new_id VARCHAR(10);
  exists_count INTEGER;
BEGIN
  LOOP
    new_id := UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8));
    SELECT COUNT(*) INTO exists_count FROM users WHERE foundarv_id = new_id;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate Foundarv ID
CREATE OR REPLACE FUNCTION set_foundarv_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.foundarv_id IS NULL OR NEW.foundarv_id = '' THEN
    NEW.foundarv_id := generate_foundarv_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_foundarv_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_foundarv_id();

-- Function to create default folders for founders
CREATE OR REPLACE FUNCTION create_founder_folders(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  folder_names TEXT[] := ARRAY['Incorporation', 'Legal', 'Finance', 'HR', 'ESOP', 'IP', 'Misc'];
  folder_name TEXT;
BEGIN
  FOREACH folder_name IN ARRAY folder_names
  LOOP
    INSERT INTO folders (user_id, name, folder_type) 
    VALUES (user_uuid, folder_name, 'founder');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create founder folders
CREATE OR REPLACE FUNCTION trigger_create_founder_folders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type = 'founder' THEN
    PERFORM create_founder_folders(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_founder_folders
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_founder_folders();

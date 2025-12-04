-- BaudAgain BBS Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    real_name TEXT,
    location TEXT,
    bio TEXT,
    access_level INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    total_calls INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    preferences TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);

-- Message bases (forums)
CREATE TABLE IF NOT EXISTS message_bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    access_level_read INTEGER DEFAULT 0,
    access_level_write INTEGER DEFAULT 10,
    post_count INTEGER DEFAULT 0,
    last_post_at DATETIME,
    sort_order INTEGER DEFAULT 0
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    base_id TEXT NOT NULL,
    parent_id TEXT,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    edited_at DATETIME,
    is_deleted INTEGER DEFAULT 0,
    ai_moderation_flag TEXT,
    FOREIGN KEY (base_id) REFERENCES message_bases(id),
    FOREIGN KEY (parent_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_base ON messages(base_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);

-- Door game sessions
CREATE TABLE IF NOT EXISTS door_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    door_id TEXT NOT NULL,
    state TEXT NOT NULL,
    history TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_door_sessions_user ON door_sessions(user_id, door_id);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_log(created_at DESC);

-- Art gallery
CREATE TABLE IF NOT EXISTS art_gallery (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    art_content TEXT NOT NULL,
    style TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_art_gallery_user ON art_gallery(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_art_gallery_created ON art_gallery(created_at DESC);

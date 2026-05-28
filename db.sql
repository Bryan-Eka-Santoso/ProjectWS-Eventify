-- === 1. USER & SOCIAL MANAGEMENT ===

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    PASSWORD VARCHAR(255) NOT NULL,
    ROLE ENUM('admin', 'organizer', 'user') NOT NULL,
    avatar VARCHAR(255) NULL,
    bio TEXT NULL,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE organizer_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organizer_name VARCHAR(255) NOT NULL COMMENT 'Nama event organizer / perusahaan',
    ktp_number VARCHAR(50) NOT NULL COMMENT 'Nomor KTP penanggung jawab',
    ktp_image_url VARCHAR(255) NOT NULL COMMENT 'URL file foto KTP',
    phone_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    social_media_link VARCHAR(255) NULL COMMENT 'Opsional untuk mengecek portofolio',
    STATUS ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT NULL COMMENT 'Diisi admin jika pendaftaran ditolak',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE FOLLOWS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE point_histories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount INT NOT NULL,
    TYPE ENUM('earn', 'spend') NOT NULL,
    DESCRIPTION VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- === 2. EVENT MANAGEMENT ===

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
    DESCRIPTION TEXT NULL
);

CREATE TABLE EVENTS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NULL COMMENT 'Null jika ditarik dari API luar via Axios',
    title VARCHAR(255) NOT NULL,
    DESCRIPTION TEXT NULL,
    location TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    -- Menambahkan status 'pending_approval' dan 'rejected'
    STATUS ENUM('draft', 'pending_approval', 'published', 'rejected', 'canceled', 'completed') DEFAULT 'draft',
    rejection_reason TEXT NULL COMMENT 'Alasan dari admin jika event ditolak',
    external_id VARCHAR(255) UNIQUE NULL COMMENT 'ID unik dari API pihak ketiga (Axios)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE event_categories (
    event_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (event_id, category_id),
    FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE ticket_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    NAME VARCHAR(100) NOT NULL COMMENT 'Contoh: VIP, Regular, Early Bird',
    price INT NOT NULL DEFAULT 0,
    quota INT NOT NULL,
    remaining_quota INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE
);

CREATE TABLE saved_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    BODY TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES EVENTS(id) ON DELETE CASCADE
);


-- === 3. TRANSACTION, POINTS & VOUCHER SYSTEM ===

CREATE TABLE vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    CODE VARCHAR(100) UNIQUE NOT NULL,
    NAME VARCHAR(255) NOT NULL,
    percentage INT NULL,
    max_cut INT NULL,
    points_required INT DEFAULT 0,
    stock INT NULL,
    valid_until DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    voucher_id INT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_voucher_id INT NULL,
    total_amount INT NOT NULL,
    discount_amount INT DEFAULT 0,
    final_amount INT NOT NULL,
    earned_points INT DEFAULT 0,
    payment_status ENUM('pending', 'paid', 'expired', 'failed') DEFAULT 'pending',
    payment_method VARCHAR(100) NULL,
    refund_status ENUM('none', 'requested', 'refunded', 'rejected') DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_voucher_id) REFERENCES user_vouchers(id) ON DELETE SET NULL
);

CREATE TABLE transaction_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    ticket_type_id INT NOT NULL,
    quantity INT NOT NULL,
    subtotal INT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE CASCADE
);

CREATE TABLE user_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ticket_type_id INT NOT NULL,
    transaction_detail_id INT NOT NULL,
    ticket_code VARCHAR(255) UNIQUE NOT NULL,
    STATUS ENUM('active', 'used', 'refunded') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_detail_id) REFERENCES transaction_details(id) ON DELETE CASCADE
);


-- === 4. COMMUNITY & CHAT ROOMS (REAL-TIME) ===

CREATE TABLE chat_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
    DESCRIPTION TEXT NULL,
    creator_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chat_room_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_room_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_room_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type ENUM('text', 'image', 'video', 'recommendation') DEFAULT 'text',
    BODY TEXT NULL,
    media_url VARCHAR(255) NULL,
    recommended_event_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recommended_event_id) REFERENCES EVENTS(id) ON DELETE SET NULL
);
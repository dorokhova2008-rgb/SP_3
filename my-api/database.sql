DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    role_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(role_id),
    
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    
    personal_discount INT NOT NULL DEFAULT 0 CHECK (personal_discount >= 0 AND personal_discount <= 100),
    user_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_description TEXT
);

CREATE TABLE services (
    service_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    category_id INT NOT NULL REFERENCES categories(category_id),
    
    service_name VARCHAR(150) NOT NULL,
    service_description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    
	service_discount INT NOT NULL DEFAULT 0 CHECK (service_discount >= 0 AND service_discount <= 100)
);

CREATE TABLE appointments (
    appointment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    
    status VARCHAR(30) NOT NULL DEFAULT 'cart',
    final_price DECIMAL(10,2) NOT NULL CHECK (final_price >= 0),
    
    appointment_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    payment_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    appointment_id INT NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'card',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'success'
);

INSERT INTO roles (role_name) VALUES ('admin'), ('client');

INSERT INTO users (role_id, email, password, user_name, personal_discount) VALUES 
(1, 'admin@shop.ru', 'admin123', 'Администратор', 0),
(2, 'client@shop.ru', 'client123', 'Иван Петров', 10);

INSERT INTO categories (category_name, category_description) VALUES 
('Яхты', 'Прогулки на роскошных яхтах'),
('Катера', 'Быстрые и маневренные катера'),
('Гидроциклы', 'Скорость и драйв на воде');

INSERT INTO services (category_id, service_name, service_description, duration_minutes, price, service_discount) VALUES
(1, 'Аренда яхты "Мечта"', 'Роскошная яхта для вечеринок', 180, 50000.00, 0),
(1, 'Аренда яхты "Звезда"', 'Просторная яхта для фотосессий', 240, 80000.00, 15),
(1, 'Аренда яхты "Бриз"', 'Небольшая яхта для романтического вечера', 120, 30000.00, 0),
(1, 'Аренда яхты "Океан"', 'Огромная яхта с экипажем', 360, 150000.00, 0),
(2, 'Катер "Ветер"', 'Быстрый катер для прогулок', 60, 15000.00, 0),
(2, 'Катер "Волна"', 'Спортивный катер для водных лыж', 120, 25000.00, 20),
(2, 'Катер "Шторм"', 'Мощный катер для компаний', 90, 20000.00, 0),
(3, 'Гидроцикл "Стрела"', 'Скоростной гидроцикл', 30, 8000.00, 0),
(3, 'Гидроцикл "Форсаж"', 'Мощный гидроцикл для двоих', 30, 10000.00, 10),
(3, 'Гидроцикл "Тайфун"', 'Экстремальный гидроцикл', 45, 12000.00, 0);

SELECT * FROM roles;
SELECT * FROM users;
SELECT * FROM categories;
SELECT * FROM services;

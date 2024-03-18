CREATE DATABASE bulk_messenger;

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sent_to VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_from VARCHAR(255) NOT NULL,
    agent VARCHAR(255) NOT NULL REFERENCES users(username)
);

CREATE TABLE users(
    id SERIAL NOT NULL, 
    username VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    role VARCHAR(20) NOT NULL DEFAULT 'agent',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

);

CREATE TABLE facebookIds(
    id VARCHAR(255) PRIMARY KEY,
    assigned_to VARCHAR(255) NOT NULL REFERENCES users(username)
);

SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
);


CREATE TABLE keys(
    id SERIAL NOT NULL,
    key VARCHAR(255) PRIMARY KEY
);

INSERT INTO users (username, name, password, status, role) VALUES('mohit','Mohit','mohit99', 'active', 'admin');
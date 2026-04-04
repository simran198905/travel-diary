-- Travel Diary Database Schema
-- Run this SQL in your MySQL server to set up the database

CREATE DATABASE IF NOT EXISTS travel_diary;
USE travel_diary;

-- Drop old tables first if they already exist
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_photo VARCHAR(255) DEFAULT NULL,
  status ENUM('planned', 'ongoing', 'completed') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Places table
CREATE TABLE places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address VARCHAR(255),
  visit_date DATE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Photos table
CREATE TABLE photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT DEFAULT NULL,
  place_id INT DEFAULT NULL,
  user_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  caption TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  taken_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

SELECT * FROM trips;
SELECT * FROM places;
SELECT * FROM photos;
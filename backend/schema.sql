CREATE DATABASE IF NOT EXISTS smart_bus;
USE smart_bus;

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT,
  specialization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_number VARCHAR(100) NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  estimated_time VARCHAR(255),
  distance DECIMAL(10, 2),
  start_time VARCHAR(50),
  end_time VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) AUTO_INCREMENT=400;

CREATE TABLE IF NOT EXISTS buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  license_plate VARCHAR(100) NOT NULL UNIQUE,
  bus_number VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 52,
  model VARCHAR(255),
  status VARCHAR(100) DEFAULT 'active',
  driver_id VARCHAR(255),
  current_route_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (current_route_id) REFERENCES routes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passengerId VARCHAR(255),
  busId INT,
  driverId VARCHAR(255),
  routeId INT,
  tripId VARCHAR(255),
  complaintText TEXT NOT NULL,
  complaintCategory VARCHAR(255),
  timestamp TIMESTAMP,
  busSpeedAtTime INT,
  busLocationAtTime JSON,
  status VARCHAR(100) DEFAULT 'Pending',
  evidence TEXT,
  confidenceScore DECIMAL(5,2),
  assignedAgentId INT,
  assignedAgentName VARCHAR(255),
  resolutionMessage TEXT,
  resolvedAt TIMESTAMP NULL,
  resolutionFeedback VARCHAR(255),
  feedback_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (busId) REFERENCES buses(id) ON DELETE SET NULL,
  FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (assignedAgentId) REFERENCES system_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS trip_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT,
  trip_date DATE,
  passenger_count INT,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bus_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT,
  date DATE,
  predicted_passengers INT,
  trips_per_bus INT,
  daily_bus_capacity INT,
  suggested_buses INT,
  manager_override_buses INT,
  final_buses INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

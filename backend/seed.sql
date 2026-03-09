-- =============================================================
-- Smart Bus Admin - Seed Data (converted from Firebase/Firestore)
-- Run AFTER schema.sql has been applied
-- =============================================================

USE smart_bus;

-- -------------------------------------------------------
-- PERMISSIONS (slug-based, fixed IDs)
-- Note: Firestore ID "QFspNLglPbgdpTQ1BaJY" mapped to id=8
-- -------------------------------------------------------
INSERT INTO permissions (id, slug) VALUES
(1,  'manage_users'),
(2,  'manage_roles'),
(3,  'manage_routes'),
(4,  'manage_buses'),
(5,  'manage_complaints'),
(6,  'view_reports'),
(7,  'manage_allocations'),
(8,  'resolve_complaints')
ON DUPLICATE KEY UPDATE slug = VALUES(slug);

-- -------------------------------------------------------
-- ROLES (fixed IDs matching the JSON role_id values)
-- -------------------------------------------------------
INSERT INTO roles (id, name, description, created_at) VALUES
(1, 'Admin',     'Full access to all features',        '2025-11-22 19:42:18'),
(2, 'Manager',   'Can manage routes and buses',         '2025-11-22 19:42:18'),
(3, 'Agent',     'Handles categorized complaints',      '2026-03-04 09:30:00'),
(4, 'Passenger', 'Can view routes and make complaints', '2025-11-22 19:42:18')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- -------------------------------------------------------
-- ROLE PERMISSIONS (deduplicated from Firestore data)
-- Firestore permission "QFspNLglPbgdpTQ1BaJY" -> id 8
-- -------------------------------------------------------
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
-- Admin (role 1): all permissions
(1, 1),  -- manage_users
(1, 2),  -- manage_roles
(1, 3),  -- manage_routes
(1, 4),  -- manage_buses
(1, 5),  -- manage_complaints
(1, 6),  -- view_reports
(1, 7),  -- manage_allocations
(1, 8),  -- resolve_complaints
-- Manager (role 2)
(2, 3),  -- manage_routes
(2, 4),  -- manage_buses
(2, 5),  -- manage_complaints
(2, 6),  -- view_reports
(2, 7),  -- manage_allocations
(2, 8),  -- resolve_complaints
-- Agent (role 3)
(3, 8);  -- resolve_complaints

-- -------------------------------------------------------
-- SYSTEM USERS
-- Firebase string IDs mapped to sequential integers.
-- Passwords are existing bcrypt hashes (preserved as-is).
--
-- Mapping:
--   Firebase "1"                    -> SQL id 1  (Admin)
--   Firebase "2"                    -> SQL id 2  (Manager)
--   Firebase "33I2btnUzKh9LIcMVmgt" -> SQL id 3  (Speeding Agent)
--   Firebase "0KgPfese6liT0pq85q9i" -> SQL id 4  (Behavior Agent)
--   Firebase "6AbkDTfD8ugcHmNv21aC" -> SQL id 5  (Delay Agent)
--   Firebase "YI9rhxsAxWVOEn2v2LHL" -> SQL id 6  (Route Agent)
--   Firebase "jf0SW7Fe5fWmH4PVzzJ7" -> SQL id 7  (Cleanliness Agent)
--   Firebase "CUdwLqdxxmIDGH6lhjaF" -> SQL id 8  (General Agent)
-- -------------------------------------------------------
INSERT INTO system_users (id, name, email, password, role_id, specialization, created_at) VALUES
(1, 'SLTB Admin',          'admin@sltb.gov.lk',       '$2b$10$o1iEoB.A6.d36qhn/akt/OcSqZy3ajYLY8NGRnyXslmgL0cyMD1tG', 1, NULL,               '2025-11-22 19:09:42'),
(2, 'manager',             'admin2@sltb.gov.lk',      '$2b$10$P/lcqDLFR1mZf6VkMhlKmOkoz4/DBZn5LhXYh/rh0jSOvw74cfzci', 2, NULL,               '2025-11-22 20:30:38'),
(3, 'Speeding Agent',      'speeding@smartbus.com',   '$2b$10$7hyLrcstK6XqT1q/xlRUEeR1dy9fA0XqG/rDRXMEwADQrYFfqkIcK', 3, 'Over Speeding',    '2026-03-04 09:30:11'),
(4, 'Behavior Agent',      'behavior@smartbus.com',   '$2b$10$bpRjvqhtTdK4RWovIZnHHuPllLZGsAF985m4yw6SrDAEhDdkXGKaq', 3, 'Driver Behavior',  '2026-03-04 09:30:13'),
(5, 'Delay Agent',         'delay@smartbus.com',      '$2b$10$CDXAftG4.h6CUFpkxJTh/Of9OlvYEjguG4Dxl2hPMxBor49pi2iEu', 3, 'Delay',            '2026-03-04 09:30:15'),
(6, 'Route Agent',         'route@smartbus.com',      '$2b$10$hnSImTreapCwUpShodO3P.TeFFClm6ptndICGZGW5rfh/y6OyL9Nm',  3, 'Route Deviation',  '2026-03-04 09:30:17'),
(7, 'Cleanliness Agent',   'clean@smartbus.com',      '$2b$10$M/O02x80OfNQgrEPgW082OlI8FUAKkgF5L7EnRzAA.gCO7MvM3OL2', 3, 'Cleanliness',      '2026-03-04 09:30:19'),
(8, 'General Agent',       'general@smartbus.com',    '$2b$10$e9UOYIq.SZ7s/YP/ffklgO..wHKhcIbj7R7de7bSl5si/.tV9EgTC', 3, 'Other',            '2026-03-04 09:30:21')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), role_id = VALUES(role_id), specialization = VALUES(specialization);

-- -------------------------------------------------------
-- ROUTES
-- Firebase route IDs used as SQL IDs directly (they are
-- numeric strings: 264, 265, 269, 272, 275, 284, 299, 304, 305, 306, 307, 319)
-- -------------------------------------------------------
INSERT INTO routes (id, route_number, route_name, distance, estimated_time, created_at) VALUES
(264, '100', 'Pettah - Panadura / Moratuwa',   30,   '1h20m', '2025-12-19 14:08:51'),
(265, '101', 'Pettah - Moratuwa',              NULL, NULL,    '2025-12-19 14:08:51'),
(269, '107', 'Fort - Elakanda',                NULL, NULL,    '2025-12-19 14:08:51'),
(272, '122', 'Pettah - Avissawella',           NULL, NULL,    '2025-12-19 14:08:51'),
(275, '138', 'Pettah - Homagama',              NULL, NULL,    '2025-12-19 14:08:51'),
(284, '144', 'Fort - Rajagiriya',              NULL, NULL,    '2025-12-19 14:08:51'),
(299, '170', 'Pettah - Athurugiriya',          NULL, NULL,    '2025-12-19 14:08:51'),
(304, '174', 'Kottawa - Borella',              NULL, NULL,    '2025-12-19 14:08:51'),
(305, '175', 'Kollupitiya - Kohilawatta',      NULL, NULL,    '2025-12-19 14:08:51'),
(306, '176', 'Hettiyawatta - Dehiwala',        NULL, NULL,    '2025-12-19 14:08:51'),
(307, '177', 'Kollupitiya - Kaduwela',         NULL, NULL,    '2025-12-19 14:08:51'),
(319, '190', 'Colombo - Meegoda',              NULL, NULL,    '2025-12-19 14:08:51')
ON DUPLICATE KEY UPDATE route_number = VALUES(route_number), route_name = VALUES(route_name);

-- -------------------------------------------------------
-- COMPLAINTS
-- Firebase string IDs dropped, auto-increment used.
-- busId "1","2","3" kept as-is (assume buses table has those ids).
-- routeId mapped: "264"->264, "265"->265 (numeric strings).
-- assignedAgentId mapped:
--   "jf0SW7Fe5fWmH4PVzzJ7" -> 7 (Cleanliness Agent)
--   "33I2btnUzKh9LIcMVmgt" -> 3 (Speeding Agent)
--   null -> NULL
-- passengerId kept as string (mobile app Firebase UID or test string).
-- -------------------------------------------------------

-- Buses must exist before inserting complaints (FK constraint).
-- Insert placeholder buses if not already present:
INSERT IGNORE INTO buses (id, license_plate, bus_number, capacity, status) VALUES
(1, 'NB-1234', 'BUS-001', 52, 'active'),
(2, 'NB-5678', 'BUS-002', 52, 'active'),
(3, 'NB-9012', 'BUS-003', 52, 'active');

-- Now insert complaints:
INSERT INTO complaints 
  (passengerId, busId, driverId, routeId, tripId, complaintText, complaintCategory,
   timestamp, busSpeedAtTime, busLocationAtTime, status, confidenceScore, evidence,
   assignedAgentId, assignedAgentName, resolutionMessage, resolvedAt, resolutionFeedback, feedback_at,
   created_at, updated_at)
VALUES
-- 1: FMTY5cvLkTLdedZXctkK (Cleanliness, resolved)
('TEST_USER_001', 2, 'unknown', 265, 'unknown',
 'The bus is very dirty inside.', 'Cleanliness',
 '2026-03-04 05:24:29', 52, '{"latitude":6.9271,"longitude":79.8612}',
 'resolved', 1.0, 'N/A',
 7, 'Cleanliness Agent', 'Daily cleaning protocol reinforced for this vehicle.',
 '2026-03-04 09:31:40', NULL, NULL,
 '2026-03-04 05:24:29', '2026-03-04 09:31:40'),

-- 2: KKzVTk46oGh2AXm5QvUI (Cleanliness, pending)
('TEST_USER_001', 3, 'unknown', 265, 'unknown',
 'The bus is very dirty inside.', 'Cleanliness',
 '2026-03-07 05:27:38', 54, '{"latitude":6.9271,"longitude":79.8612}',
 'Pending', 1.0, 'N/A',
 7, 'Cleanliness Agent', NULL,
 NULL, NULL, NULL,
 '2026-03-07 05:27:38', NULL),

-- 3: QkxhJJCCBogJB6cf2uld (Driver Behavior, pending)
('TEST_USER_001', 2, 'unknown', 265, 'unknown',
 'The bus was driving very fast.', 'Driver Behavior',
 '2026-03-04 04:33:28', 68, '{"latitude":6.9271,"longitude":79.8612}',
 'Pending', 1.0, 'N/A',
 NULL, NULL, NULL,
 NULL, NULL, NULL,
 '2026-03-04 04:33:28', NULL),

-- 4: RQxEBinTzTL8cKpGV7i4 (Over Speeding, resolved, with feedback)
('xQMjcFBAzKRIKAHE4AobeB0GfxN2', 3, 'unknown', 265, 'unknown',
 'Driver was very fast', 'Over Speeding',
 '2026-03-06 13:34:45', 62, '{"latitude":6.9271,"longitude":79.8612}',
 'resolved', 1.0, 'Bus speed of 62km/h exceeded limit of 60km/h',
 3, 'Speeding Agent', 'Issue investigated and driver warned regarding speed limits.',
 '2026-03-06 14:09:35', 'dislike', '2026-03-07 05:53:49',
 '2026-03-06 13:34:45', '2026-03-06 14:09:35'),

-- 5: U11HNsrRMkPtiFN34kGF (Route Deviation, resolved)
('TEST_USER_001', 1, 'unknown', 264, 'unknown',
 'Driver missed the stop.', 'Route Deviation',
 '2026-03-04 04:37:04', 37, '{"latitude":6.9271,"longitude":79.8612}',
 'resolved', 1.0, 'No evidence found',
 NULL, NULL, 'Directional guidance provided to the driver.',
 '2026-03-04 09:32:42', NULL, NULL,
 '2026-03-04 04:37:04', '2026-03-04 09:32:42'),

-- 6: lBUJWwidVvhjZU2vybtk (Pending Classification)
('xQMjcFBAzKRIKAHE4AobeB0GfxN2', 2, 'unknown', 265, 'unknown',
 'Driver was too fast', 'Pending Classification',
 '2026-03-06 13:28:49', 45, '{"latitude":6.9271,"longitude":79.8612}',
 'Pending', NULL, NULL,
 NULL, NULL, NULL,
 NULL, NULL, NULL,
 '2026-03-06 13:28:49', NULL);

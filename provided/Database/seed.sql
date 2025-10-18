-- Seed users
INSERT INTO users (email, name, password_hash) VALUES
  ('alice@example.com', 'Alice Mariner', '$argon2id$v=19$m=65536,t=3,p=4$seed$hash'),
  ('bob@example.com', 'Bob Skipper', '$argon2id$v=19$m=65536,t=3,p=4$seed$hash');

-- Seed tags
INSERT INTO tags (name) VALUES ('ops'), ('database'), ('network');

-- Seed incidents
INSERT INTO incidents (title, description, status, created_by)
VALUES
  ('DB connection timeouts', 'Intermittent DB timeouts affecting write operations', 'open', 1),
  ('API error spikes', 'Upstream partner reporting elevated 5xx rates', 'in-progress', 1),
  ('Switch port flapping', 'Core switch reporting port flaps on uplink', 'open', 2),
  ('Cron job misfire', 'Daily ETL job failed to start', 'resolved', 2);

-- Seed incident_tags (link incidents to tags by id order)
-- incident 1 -> database
INSERT INTO incident_tags (incident_id, tag_id) VALUES (1, 2);
-- incident 2 -> ops
INSERT INTO incident_tags (incident_id, tag_id) VALUES (2, 1);
-- incident 3 -> network
INSERT INTO incident_tags (incident_id, tag_id) VALUES (3, 3);
-- incident 4 -> ops, database
INSERT INTO incident_tags (incident_id, tag_id) VALUES (4, 1), (4, 2);

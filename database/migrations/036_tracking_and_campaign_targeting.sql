-- First-party visitor analytics and ad attribution.
CREATE TABLE IF NOT EXISTS visitors (
  id            CHAR(26) PRIMARY KEY,                 -- random id from the leo_vid cookie
  first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visits        INT UNSIGNED NOT NULL DEFAULT 1,
  pageviews     INT UNSIGNED NOT NULL DEFAULT 0,
  user_id       INT UNSIGNED NULL,
  -- first touch
  ft_source     VARCHAR(100) NULL, ft_medium VARCHAR(100) NULL, ft_campaign VARCHAR(150) NULL,
  ft_referrer   VARCHAR(255) NULL, ft_landing VARCHAR(255) NULL,
  -- last (non-direct) touch
  lt_source     VARCHAR(100) NULL, lt_medium VARCHAR(100) NULL, lt_campaign VARCHAR(150) NULL,
  device        VARCHAR(16) NULL,
  interests     VARCHAR(500) NULL,                    -- JSON {category: score}
  KEY idx_vis_user (user_id), KEY idx_vis_first (first_seen_at), KEY idx_vis_ft (ft_source, ft_campaign)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visit_events (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_id CHAR(26) NOT NULL,
  type       VARCHAR(32) NOT NULL,                    -- pageview, course_view, signup, purchase, popup_impression, popup_click, popup_dismiss
  path       VARCHAR(255) NULL,
  source     VARCHAR(100) NULL, medium VARCHAR(100) NULL, campaign VARCHAR(150) NULL,
  ref_id     VARCHAR(64) NULL,                        -- course id / campaign id / order id
  value      INT UNSIGNED NULL,                       -- order amount for purchases
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ev_time (created_at), KEY idx_ev_type (type, created_at), KEY idx_ev_vis (visitor_id), KEY idx_ev_ref (type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users  ADD COLUMN visitor_id CHAR(26) NULL, ADD COLUMN signup_source VARCHAR(100) NULL, ADD COLUMN signup_campaign VARCHAR(150) NULL;
ALTER TABLE orders ADD COLUMN visitor_id CHAR(26) NULL, ADD COLUMN attr_source VARCHAR(100) NULL, ADD COLUMN attr_medium VARCHAR(100) NULL, ADD COLUMN attr_campaign VARCHAR(150) NULL;

-- Smarter popup targeting
ALTER TABLE campaigns
  MODIFY audience ENUM('all','guests','students','new_visitors','returning','from_campaign','interested') NOT NULL DEFAULT 'all',
  ADD COLUMN trigger_type ENUM('delay','scroll','exit','pageviews') NOT NULL DEFAULT 'delay',
  ADD COLUMN trigger_value INT UNSIGNED NOT NULL DEFAULT 3,
  ADD COLUMN utm_campaign VARCHAR(150) NULL,
  ADD COLUMN interest_category VARCHAR(100) NULL;

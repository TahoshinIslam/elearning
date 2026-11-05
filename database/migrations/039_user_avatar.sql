-- Profile photos. The object lives under the public thumbnails/avatars/<user>/ prefix.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_key VARCHAR(255) NULL AFTER email;

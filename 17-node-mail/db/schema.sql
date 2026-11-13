CREATE DATABASE IF NOT EXISTS node_email      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS node_email_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE node_email;

-- Cuentas reales (ya confirmadas)
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255) NOT NULL,
  passwordHash  VARCHAR(255) NOT NULL,
  confirmedAt   DATETIME     NOT NULL,
  createdAt     DATETIME     NOT NULL,
  updatedAt     DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registros esperando confirmación
CREATE TABLE IF NOT EXISTS pending_registrations (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255) NOT NULL,
  passwordHash  VARCHAR(255) NOT NULL,
  tokenHash     CHAR(64)     NOT NULL,   -- SHA-256 en hex del token
  expiresAt     DATETIME     NOT NULL,
  createdAt     DATETIME     NOT NULL,
  updatedAt     DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pending_email (email),
  UNIQUE KEY uq_pending_token (tokenHash),
  KEY idx_pending_expires (expiresAt)    -- acelera la limpieza de vencidas
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- node_email_test NO necesita tablas: los tests las recrean con sync({ force: true }).

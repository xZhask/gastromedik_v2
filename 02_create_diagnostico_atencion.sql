CREATE TABLE IF NOT EXISTS `diagnostico_atencion` (
  `id_diagnostico_atencion` INT AUTO_INCREMENT PRIMARY KEY,
  `id_atencion` INT(11) NOT NULL,
  `codigo_cie10` VARCHAR(6) NOT NULL,
  `tipo` ENUM('DEFINITIVO', 'PRESUNTIVO') NOT NULL DEFAULT 'DEFINITIVO',
  `jerarquia` ENUM('PRINCIPAL', 'SECUNDARIO') NOT NULL DEFAULT 'PRINCIPAL',
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_diagnostico_atencion_atencion` FOREIGN KEY (`id_atencion`) REFERENCES `atencion` (`idatencion`) ON DELETE CASCADE,
  CONSTRAINT `fk_diagnostico_atencion_cie10` FOREIGN KEY (`codigo_cie10`) REFERENCES `cie10` (`codigo`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- CIE10 - Descripciones cortas / abreviaturas (codigos mas usados)
-- Gastro-Medik | Motor: MySQL utf8mb4
-- -------------------------------------------------------------
-- Anade la columna `descripcion_corta` (NULL por defecto) y la
-- llena solo para los diagnosticos de uso frecuente en
-- gastroenterologia + comorbilidades y sintomas comunes.
--
-- En el buscador / listado usar:  COALESCE(descripcion_corta, descripcion)
-- Asi los codigos sin version corta caen a la descripcion oficial.
-- =============================================================

SET NAMES utf8mb4;

-- 1) Columna nueva (idempotente: ejecutar solo si no existe)
ALTER TABLE `cie10`
  ADD COLUMN `descripcion_corta` VARCHAR(80) NULL DEFAULT NULL
  AFTER `descripcion`;

-- =============================================================
-- 2) Poblado de descripciones cortas
-- =============================================================

-- --- Esofago / ERGE ---
UPDATE `cie10` SET `descripcion_corta` = 'ERGE con esofagitis'        WHERE `codigo` = 'K210';
UPDATE `cie10` SET `descripcion_corta` = 'ERGE'                       WHERE `codigo` = 'K219';
UPDATE `cie10` SET `descripcion_corta` = 'Esofago de Barrett'        WHERE `codigo` = 'K227';
UPDATE `cie10` SET `descripcion_corta` = 'Sindrome de Mallory-Weiss' WHERE `codigo` = 'K226';
UPDATE `cie10` SET `descripcion_corta` = 'Varices esofagicas sangrantes' WHERE `codigo` = 'I850';
UPDATE `cie10` SET `descripcion_corta` = 'Varices esofagicas'        WHERE `codigo` = 'I859';

-- --- Estomago / duodeno ---
UPDATE `cie10` SET `descripcion_corta` = 'Gastritis'                 WHERE `codigo` = 'K297';
UPDATE `cie10` SET `descripcion_corta` = 'Ulcera gastrica'          WHERE `codigo` = 'K259';
UPDATE `cie10` SET `descripcion_corta` = 'Ulcera duodenal'          WHERE `codigo` = 'K269';
UPDATE `cie10` SET `descripcion_corta` = 'Dispepsia'                 WHERE `codigo` = 'K30';
UPDATE `cie10` SET `descripcion_corta` = 'Polipo gastrico'          WHERE `codigo` = 'K317';
UPDATE `cie10` SET `descripcion_corta` = 'Hemorragia digestiva'     WHERE `codigo` = 'K922';

-- --- Intestino delgado / colon ---
UPDATE `cie10` SET `descripcion_corta` = 'SII sin diarrea'           WHERE `codigo` = 'K589';
UPDATE `cie10` SET `descripcion_corta` = 'SII con diarrea'           WHERE `codigo` = 'K580';
UPDATE `cie10` SET `descripcion_corta` = 'Estrenimiento'             WHERE `codigo` = 'K590';
UPDATE `cie10` SET `descripcion_corta` = 'Diarrea funcional'         WHERE `codigo` = 'K591';
UPDATE `cie10` SET `descripcion_corta` = 'Colitis no infecciosa'    WHERE `codigo` = 'K529';
UPDATE `cie10` SET `descripcion_corta` = 'Enf. de Crohn (intestino delgado)' WHERE `codigo` = 'K500';
UPDATE `cie10` SET `descripcion_corta` = 'Enfermedad de Crohn'      WHERE `codigo` = 'K509';
UPDATE `cie10` SET `descripcion_corta` = 'Colitis ulcerativa'       WHERE `codigo` = 'K519';
UPDATE `cie10` SET `descripcion_corta` = 'Polipo de colon'          WHERE `codigo` = 'K635';
UPDATE `cie10` SET `descripcion_corta` = 'Enfermedad diverticular'  WHERE `codigo` = 'K571';
UPDATE `cie10` SET `descripcion_corta` = 'Perforacion intestinal'   WHERE `codigo` = 'K631';
UPDATE `cie10` SET `descripcion_corta` = 'Adherencias peritoneales' WHERE `codigo` = 'K660';

-- --- Higado / vias biliares / pancreas ---
UPDATE `cie10` SET `descripcion_corta` = 'Higado graso (esteatosis)' WHERE `codigo` = 'K760';
UPDATE `cie10` SET `descripcion_corta` = 'Cirrosis alcoholica'      WHERE `codigo` = 'K703';
UPDATE `cie10` SET `descripcion_corta` = 'Cirrosis hepatica'        WHERE `codigo` = 'K746';
UPDATE `cie10` SET `descripcion_corta` = 'Insuficiencia hepatica cronica' WHERE `codigo` = 'K721';
UPDATE `cie10` SET `descripcion_corta` = 'Insuficiencia hepatica'   WHERE `codigo` = 'K729';
UPDATE `cie10` SET `descripcion_corta` = 'Hipertension portal'      WHERE `codigo` = 'K766';
UPDATE `cie10` SET `descripcion_corta` = 'Hepatitis B cronica'      WHERE `codigo` = 'B181';
UPDATE `cie10` SET `descripcion_corta` = 'Hepatitis C cronica'      WHERE `codigo` = 'B182';
UPDATE `cie10` SET `descripcion_corta` = 'Colecistitis aguda'       WHERE `codigo` = 'K810';
UPDATE `cie10` SET `descripcion_corta` = 'Colecistitis cronica'     WHERE `codigo` = 'K811';
UPDATE `cie10` SET `descripcion_corta` = 'Colecistitis'             WHERE `codigo` = 'K819';
UPDATE `cie10` SET `descripcion_corta` = 'Colelitiasis'             WHERE `codigo` = 'K802';
UPDATE `cie10` SET `descripcion_corta` = 'Pancreatitis aguda'       WHERE `codigo` = 'K859';
UPDATE `cie10` SET `descripcion_corta` = 'Pancreatitis cronica'     WHERE `codigo` = 'K861';

-- --- Recto / ano ---
UPDATE `cie10` SET `descripcion_corta` = 'Hemorragia rectal'        WHERE `codigo` = 'K625';
UPDATE `cie10` SET `descripcion_corta` = 'Hemorroides grado III'    WHERE `codigo` = 'K642';
UPDATE `cie10` SET `descripcion_corta` = 'Hemorroides'              WHERE `codigo` = 'K649';

-- --- Neoplasias digestivas ---
UPDATE `cie10` SET `descripcion_corta` = 'Cancer de esofago'        WHERE `codigo` = 'C159';
UPDATE `cie10` SET `descripcion_corta` = 'Cancer gastrico'          WHERE `codigo` = 'C169';
UPDATE `cie10` SET `descripcion_corta` = 'Cancer de colon'          WHERE `codigo` = 'C189';
UPDATE `cie10` SET `descripcion_corta` = 'Hepatocarcinoma'          WHERE `codigo` = 'C220';
UPDATE `cie10` SET `descripcion_corta` = 'Cancer de pancreas'       WHERE `codigo` = 'C259';

-- --- Infecciosas digestivas ---
UPDATE `cie10` SET `descripcion_corta` = 'Gastroenteritis infecciosa' WHERE `codigo` = 'A09';
UPDATE `cie10` SET `descripcion_corta` = 'Gastroenteritis'          WHERE `codigo` = 'A099';

-- --- Hernias de pared / hiato ---
UPDATE `cie10` SET `descripcion_corta` = 'Hernia hiatal'            WHERE `codigo` = 'K449';
UPDATE `cie10` SET `descripcion_corta` = 'Hernia inguinal'         WHERE `codigo` = 'K409';

-- --- Sintomas digestivos frecuentes ---
UPDATE `cie10` SET `descripcion_corta` = 'Dolor abdominal superior' WHERE `codigo` = 'R101';
UPDATE `cie10` SET `descripcion_corta` = 'Dolor abdominal'         WHERE `codigo` = 'R104';
UPDATE `cie10` SET `descripcion_corta` = 'Nausea y vomito'         WHERE `codigo` = 'R11';

-- --- Comorbilidades / generales (abreviaturas estandar) ---
UPDATE `cie10` SET `descripcion_corta` = 'DM2'                      WHERE `codigo` = 'E119';
UPDATE `cie10` SET `descripcion_corta` = 'Diabetes mellitus'       WHERE `codigo` = 'E149';
UPDATE `cie10` SET `descripcion_corta` = 'HTA'                      WHERE `codigo` = 'I10';
UPDATE `cie10` SET `descripcion_corta` = 'Dislipidemia'            WHERE `codigo` = 'E785';
UPDATE `cie10` SET `descripcion_corta` = 'Obesidad'                WHERE `codigo` = 'E660';
UPDATE `cie10` SET `descripcion_corta` = 'Anemia'                  WHERE `codigo` = 'D649';
UPDATE `cie10` SET `descripcion_corta` = 'ITU'                     WHERE `codigo` = 'N390';
UPDATE `cie10` SET `descripcion_corta` = 'Resfrio comun'          WHERE `codigo` = 'J00';
UPDATE `cie10` SET `descripcion_corta` = 'Faringitis aguda'       WHERE `codigo` = 'J029';
UPDATE `cie10` SET `descripcion_corta` = 'Amigdalitis aguda'      WHERE `codigo` = 'J039';
UPDATE `cie10` SET `descripcion_corta` = 'Cefalea'                WHERE `codigo` = 'R51';

-- --- Administrativos / preventivos (utiles pre-endoscopia) ---
UPDATE `cie10` SET `descripcion_corta` = 'Examen medico general'  WHERE `codigo` = 'Z000';
UPDATE `cie10` SET `descripcion_corta` = 'Examen de laboratorio'  WHERE `codigo` = 'Z017';
UPDATE `cie10` SET `descripcion_corta` = 'Observacion por sospecha' WHERE `codigo` = 'Z038';

-- =============================================================
-- 3) Verificacion (opcional)
-- =============================================================
-- SELECT codigo, descripcion_corta, descripcion
--   FROM cie10 WHERE descripcion_corta IS NOT NULL
--   ORDER BY codigo;

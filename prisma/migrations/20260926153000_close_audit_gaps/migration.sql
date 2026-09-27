ALTER TABLE `leak_reports`
  MODIFY `category` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
  ADD COLUMN `isHighPriority` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `verificationNote` TEXT NULL,
  ADD COLUMN `verifiedAt` DATETIME(3) NULL;

ALTER TABLE `assignments` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
UPDATE `assignments` AS older
JOIN `assignments` AS newer
  ON newer.`reportId` = older.`reportId`
  AND (newer.`createdAt` > older.`createdAt` OR (newer.`createdAt` = older.`createdAt` AND newer.`id` > older.`id`))
SET older.`isActive` = false;

CREATE TABLE `leak_categories` (
  `id` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `leak_categories` (`id`, `label`, `isActive`, `updatedAt`) VALUES
  ('PIPE_BURST', 'Pipe Burst', true, CURRENT_TIMESTAMP(3)),
  ('SEEPAGE', 'Seepage', true, CURRENT_TIMESTAMP(3)),
  ('MAIN_LINE', 'Main Line', true, CURRENT_TIMESTAMP(3)),
  ('METER_LEAK', 'Meter Leak', true, CURRENT_TIMESTAMP(3)),
  ('JOINT_LEAK', 'Joint Leak', true, CURRENT_TIMESTAMP(3)),
  ('VALVE_LEAK', 'Valve Leak', true, CURRENT_TIMESTAMP(3)),
  ('OTHER', 'Other', true, CURRENT_TIMESTAMP(3));

CREATE TABLE `system_settings` (
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`key`, `value`, `updatedAt`) VALUES
  ('allowAnonymousReports', 'true', CURRENT_TIMESTAMP(3)),
  ('uploadMaxMegabytes', '10', CURRENT_TIMESTAMP(3));

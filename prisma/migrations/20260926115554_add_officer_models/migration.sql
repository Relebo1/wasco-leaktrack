-- AlterTable
ALTER TABLE `leak_reports` ADD COLUMN `isValid` BOOLEAN NULL,
    ADD COLUMN `validationNote` TEXT NULL;

-- CreateTable
CREATE TABLE `investigation_notes` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `info_requests` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `response` TEXT NULL,
    `status` ENUM('PENDING', 'RESPONDED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `investigation_notes` ADD CONSTRAINT `investigation_notes_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `leak_reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investigation_notes` ADD CONSTRAINT `investigation_notes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `info_requests` ADD CONSTRAINT `info_requests_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `leak_reports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `info_requests` ADD CONSTRAINT `info_requests_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

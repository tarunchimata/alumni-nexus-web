/**
 * Bulk School CSV Import Script
 * TEMPORARILY SIMPLIFIED: To align with current Prisma schema
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

async function main() {
  logger.warn('Bulk school import script is temporarily disabled during production stabilization.');
  logger.info('Please use the simplified importSchools.ts script instead.');
}

main()
  .catch((error) => {
    logger.error('Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

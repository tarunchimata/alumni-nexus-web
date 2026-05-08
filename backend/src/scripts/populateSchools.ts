/**
 * Populate Schools Script
 * TEMPORARILY SIMPLIFIED: To align with current Prisma schema
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

async function main() {
  logger.warn('Populate schools script is temporarily disabled during production stabilization.');
}

main()
  .catch((error) => {
    logger.error('Population failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

#!/usr/bin/env ts-node

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

async function main() {
  logger.warn('generateUsers script is temporarily disabled during production stabilization.');
  logger.info('Please update this script to match current Prisma schema before re-enabling.');
}

main()
  .catch((error) => {
    logger.error('User generation script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

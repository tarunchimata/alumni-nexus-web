import { logger } from '../utils/logger';
import { keycloakAdminClient } from './keycloakAdmin';
import { prisma } from '../index';
import { CSVUserRow } from './importService';

export interface DryRunResult {
  jobId: number;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    keycloakConflicts: number;
    appDbConflicts: number;
    newUsers: number;
    updateUsers: number;
  };
  conflicts: {
    keycloak: Array<{
      email: string;
      existingUser: any;
      proposedChanges: any;
    }>;
    appDb: Array<{
      email: string;
      existingUser: any;
      proposedChanges: any;
    }>;
  };
  preview: Array<{
    rowNumber: number;
    email: string;
    action: 'create' | 'update' | 'skip' | 'error';
    reason: string;
    data: CSVUserRow;
  }>;
}

export async function performDryRun(jobId: number): Promise<DryRunResult> {
  logger.info(`[DryRun] Starting dry run for job ${jobId}`);
  
  const job = await prisma.importJob.findUnique({
    where: { id: jobId },
    include: { rows: true }
  });

  if (!job) {
    throw new Error('Job not found');
  }

  if (!job.isDryRun) {
    throw new Error('Job is not marked as dry run');
  }

  const validRows = job.rows.filter((row: any) => row.status === 'valid' || row.status === 'will_update');
  
  let keycloakConflicts = 0;
  let appDbConflicts = 0;
  let newUsers = 0;
  let updateUsers = 0;
  
  const conflicts = {
    keycloak: [] as any[],
    appDb: [] as any[]
  };
  
  const preview = [];

  // Check Keycloak connectivity before proceeding
  try {
    await keycloakAdminClient.authenticate();
    logger.info('[DryRun] Keycloak connectivity verified');
  } catch (error) {
    logger.error('[DryRun] Keycloak connectivity failed:', error);
    throw new Error('Keycloak is not accessible. Cannot perform dry run.');
  }

  for (const row of validRows) {
    const data = row.rawData as CSVUserRow;
    const email = String(data.email).toLowerCase();
    
    try {
      // Check Keycloak
      const existingKcUser = await keycloakAdminClient.getUserByEmail(email);
      const existingAppUser = await prisma.user.findUnique({ where: { email } });
      
      let action: 'create' | 'update' | 'skip' | 'error' = 'create';
      let reason = 'New user will be created';
      
      if (existingKcUser) {
        keycloakConflicts++;
        updateUsers++;
        action = 'update';
        reason = 'User exists in Keycloak - will update attributes and role';
        
        conflicts.keycloak.push({
          email,
          existingUser: {
            id: existingKcUser.id,
            email: existingKcUser.email,
            firstName: existingKcUser.firstName,
            lastName: existingKcUser.lastName,
            attributes: existingKcUser.attributes
          },
          proposedChanges: {
            role: data.role,
            schoolId: data.schoolId,
            status: 'pending_approval'
          }
        });
      } else {
        newUsers++;
      }
      
      if (existingAppUser) {
        appDbConflicts++;
        if (action === 'create') {
          action = 'update';
          reason = 'User exists in App DB - will update';
        }
        
        conflicts.appDb.push({
          email,
          existingUser: {
            id: existingAppUser.id,
            email: existingAppUser.email,
            firstName: existingAppUser.firstName,
            lastName: existingAppUser.lastName,
            role: existingAppUser.role,
            schoolId: existingAppUser.schoolId
          },
          proposedChanges: {
            role: data.role,
            schoolId: data.schoolId,
            isActive: false
          }
        });
      }
      
      preview.push({
        rowNumber: row.rowNumber,
        email,
        action,
        reason,
        data
      });
      
    } catch (error: any) {
      logger.error(`[DryRun] Error checking user ${email}:`, error);
      preview.push({
        rowNumber: row.rowNumber,
        email,
        action: 'error',
        reason: `Error: ${error.message}`,
        data
      });
    }
  }

  const summary = {
    totalRows: job.rows.length,
    validRows: validRows.length,
    invalidRows: job.rows.length - validRows.length,
    keycloakConflicts,
    appDbConflicts,
    newUsers,
    updateUsers
  };

  // Store dry run results
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: 'dry_run_complete',
      summary: {
        ...summary,
        conflicts: conflicts,
        preview: preview.slice(0, 50) // Store first 50 for quick access
      }
    }
  });

  logger.info(`[DryRun] Completed for job ${jobId}:`, summary);

  return {
    jobId,
    summary,
    conflicts,
    preview
  };
}

export async function validateKeycloakConnectivity(): Promise<boolean> {
  try {
    await keycloakAdminClient.authenticate();
    // Try to fetch realm info as connectivity test
    const admin = await keycloakAdminClient.getAdmin();
    await admin.realms.findOne({ realm: process.env.KEYCLOAK_REALM! });
    return true;
  } catch (error) {
    logger.error('[DryRun] Keycloak connectivity check failed:', error);
    return false;
  }
}
import { Router } from 'express';
import { keycloakMiddleware, requireRole } from '../middleware/keycloak';
import { keycloakFirstImportService } from '../services/keycloakFirstImportService';
import { logger } from '../utils/logger';

const router: Router = Router();

// Apply authentication to all routes
router.use(keycloakMiddleware);

// Strict validation endpoint for pre-upload checks
router.post('/validate-strict', 
  requireRole(['platform_admin', 'school_admin']),
  async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!Array.isArray(csvData) || csvData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CSV data provided'
        });
      }

      logger.info(`Strict validation requested for ${csvData.length} rows`);
      
      const processedRows = await keycloakFirstImportService.validateStrictCSV(csvData);
      
      const summary = {
        totalRows: processedRows.length,
        validRows: processedRows.filter(r => r.isValid).length,
        invalidRows: processedRows.filter(r => !r.isValid).length,
        createOperations: processedRows.filter(r => r.operation === 'create').length,
        updateOperations: processedRows.filter(r => r.operation === 'update').length,
        skipOperations: processedRows.filter(r => r.operation === 'skip').length
      };

      res.json({
        success: true,
        data: {
          processedRows,
          summary,
          validationPassed: summary.invalidRows === 0,
          readyForImport: summary.validRows > 0
        }
      });

    } catch (error) {
      logger.error('Strict validation failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  }
);

// Execute Keycloak-first batch import (testing endpoint)
router.post('/execute-batch',
  requireRole(['platform_admin']),
  async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!Array.isArray(csvData) || csvData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CSV data provided'
        });
      }

      logger.info(`Executing Keycloak-first batch for ${csvData.length} rows`);
      
      // Validate first
      const processedRows = await keycloakFirstImportService.validateStrictCSV(csvData);
      const validRows = processedRows.filter(row => row.isValid);
      
      if (validRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid rows to process',
          data: { processedRows }
        });
      }

      // Execute Keycloak operations
      const keycloakResult = await keycloakFirstImportService.executeKeycloakBatch(validRows);
      
      let dbResult = { synced: 0, failed: 0, errors: [] };
      
      if (keycloakResult.success) {
        // Sync to database
        const successfulRows = validRows.filter(row => 
          row.keycloakId && !keycloakResult.failedRows.find(f => f.rowIndex === row.rowIndex)
        );
        
        dbResult = await keycloakFirstImportService.syncToDatabase(successfulRows);
      }

      res.json({
        success: keycloakResult.success,
        data: {
          keycloakResult,
          dbResult,
          summary: {
            totalRows: csvData.length,
            keycloakProcessed: keycloakResult.processed,
            keycloakCreated: keycloakResult.created,
            keycloakUpdated: keycloakResult.updated,
            keycloakFailed: keycloakResult.failed,
            dbSynced: dbResult.synced,
            dbSyncFailed: dbResult.failed
          }
        }
      });

    } catch (error) {
      logger.error('Keycloak-first batch execution failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Batch execution failed'
      });
    }
  }
);

// Get validation rules and template info
router.get('/validation-rules',
  requireRole(['platform_admin', 'school_admin']),
  async (req, res) => {
    try {
      const rules = {
        headers: {
          required: [
            'email',
            'first_name', 
            'last_name',
            'role',
            'school_udise_code'
          ],
          optional: [
            'phone_number',
            'date_of_birth',
            'admission_year',
            'graduation_year'
          ]
        },
        validation: {
          email: {
            required: true,
            format: 'Valid email address',
            unique: 'Must be unique within CSV and database'
          },
          first_name: {
            required: true,
            length: '2-50 characters',
            format: 'Letters, spaces, hyphens, apostrophes only'
          },
          last_name: {
            required: true,
            length: '2-50 characters', 
            format: 'Letters, spaces, hyphens, apostrophes only'
          },
          role: {
            required: true,
            values: ['student', 'teacher', 'alumni', 'school_admin', 'platform_admin']
          },
          school_udise_code: {
            required: true,
            format: 'Valid UDISE code that exists in database'
          },
          phone_number: {
            optional: true,
            format: '10-15 digits with optional country code and formatting'
          },
          date_of_birth: {
            optional: true,
            format: 'YYYY-MM-DD',
            validation: 'Age must be between 5 and 100 years'
          },
          admission_year: {
            optional: true,
            format: 'Four digit year'
          },
          graduation_year: {
            optional: true,
            format: 'Four digit year',
            validation: 'Must be after admission year if both provided'
          }
        },
        process: {
          steps: [
            'CSV Upload and Parsing',
            'Strict Field Validation',
            'Duplicate Detection (CSV + Database)',
            'School UDISE Code Verification',
            'Keycloak User Operations (Atomic)',
            'Database Synchronization',
            'User Activation and Role Assignment'
          ],
          atomic: true,
          rollback: 'Automatic rollback on any failure during Keycloak operations'
        }
      };

      res.json({
        success: true,
        data: rules
      });

    } catch (error) {
      logger.error('Failed to get validation rules:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get validation rules'
      });
    }
  }
);

export default router;
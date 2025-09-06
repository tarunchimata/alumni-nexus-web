import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  RotateCcw,
  Settings,
  Shield,
  Database
} from 'lucide-react';
import { ValidationFeedback } from './ValidationFeedback';
import { ImportLogger } from './ImportLogger';
import { TroubleshootingGuide } from './TroubleshootingGuide';

interface ProcessedRow {
  row: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  operation?: 'create' | 'update' | 'skip';
}

interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  toCreate: number;
  toUpdate: number;
  toSkip: number;
}

interface StrictValidationResult {
  isValid: boolean;
  summary: ValidationSummary;
  processedRows: ProcessedRow[];
  readyForImport: boolean;
}

interface BatchExecutionResult {
  success: boolean;
  keycloakResult: {
    successful: number;
    failed: number;
    errors: string[];
  };
  databaseResult: {
    synced: number;
    failed: number;
    errors: string[];
  };
  summary: {
    totalProcessed: number;
    keycloakSuccessful: number;
    databaseSynced: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  userId?: string;
  action: string;
}

interface ImportStats {
  totalAttempts: number;
  successfulImports: number;
  failedImports: number;
  averageImportTime: number;
  lastImportTime?: Date;
}

type ImportType = 'users' | 'schools' | 'alumni' | 'teachers' | 'students';

export const EnhancedCSVImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>('users');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ImportStats>({
    totalAttempts: 0,
    successfulImports: 0,
    failedImports: 0,
    averageImportTime: 0
  });
  
  // Strict validation state
  const [validationResult, setValidationResult] = useState<StrictValidationResult | null>(null);
  const [importResult, setImportResult] = useState<BatchExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('import');

  const { toast } = useToast();

  const addLog = useCallback((level: LogEntry['level'], message: string, action: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      action,
      details,
      userId: 'current-user' // Replace with actual user ID
    };
    setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'text/csv' && !uploadedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      addLog('error', 'Invalid file type uploaded', 'FILE_UPLOAD', { fileName: uploadedFile.name });
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setValidationResult(null);
    setImportResult(null);
    addLog('info', `File uploaded: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`, 'FILE_UPLOAD');
    
    // Auto-validate on file upload for users
    if (importType === 'users') {
      await validateStrictCSV(uploadedFile);
    }
  }, [importType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const validateStrictCSV = async (fileToValidate?: File) => {
    const targetFile = fileToValidate || file;
    if (!targetFile || importType !== 'users') return;

    setIsValidating(true);
    setError(null);
    addLog('info', 'Starting Keycloak-first validation', 'STRICT_VALIDATION_START');

    try {
      const response: any = await apiClient.uploadFile('/csv-strict/validate-strict', file);

      const validationData: StrictValidationResult = {
        isValid: response.validationPassed || false,
        summary: response.summary || {},
        processedRows: response.processedRows || [],
        readyForImport: response.readyForImport || false
      };

      setValidationResult(validationData);
      
      if (response.validationPassed) {
        addLog('success', 
          `Validation passed: ${response.summary?.valid || 0}/${response.summary?.total || 0} valid rows`, 
          'STRICT_VALIDATION_SUCCESS', 
          response.summary
        );
        toast({
          title: "Validation successful",
          description: `${response.summary?.valid || 0} valid rows ready for Keycloak import`,
        });
      } else {
        addLog('warning', 
          `Validation completed with issues: ${response.summary?.invalid || 0} invalid rows`, 
          'STRICT_VALIDATION_WARNING', 
          response.summary
        );
        setError(`${response.summary?.invalid || 0} rows have validation errors`);
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Strict validation failed';
      setError(errorMessage);
      addLog('error', errorMessage, 'STRICT_VALIDATION_ERROR', { error });
      toast({
        title: "Validation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const executeKeycloakBatch = async () => {
    if (!file || !validationResult?.readyForImport || importType !== 'users') {
      setError('Please validate a users CSV file first');
      return;
    }

    const startTime = Date.now();
    setIsImporting(true);
    setImportProgress(0);
    setError(null);
    
    addLog('info', `Starting Keycloak-first batch execution for ${validationResult.summary.valid} valid rows`, 'BATCH_EXECUTION_START');

    try {
      setImportProgress(25);
      
      const response: any = await apiClient.uploadFile('/csv-strict/execute-batch', file);

      setImportProgress(75);

      if (response.success) {
        const result: BatchExecutionResult = {
          success: response.success,
          keycloakResult: response.keycloakResult || { successful: 0, failed: 0, errors: [] },
          databaseResult: response.databaseResult || { synced: 0, failed: 0, errors: [] },
          summary: response.summary || { totalProcessed: 0, keycloakSuccessful: 0, databaseSynced: 0 }
        };
        setImportResult(result);
        
        const endTime = Date.now();
        const importTime = (endTime - startTime) / 1000;

        // Update stats
        setStats(prev => ({
          totalAttempts: prev.totalAttempts + 1,
          successfulImports: prev.successfulImports + (result.keycloakResult.successful > 0 ? 1 : 0),
          failedImports: prev.failedImports + (result.keycloakResult.failed > 0 ? 1 : 0),
          averageImportTime: prev.totalAttempts > 0 
            ? (prev.averageImportTime * prev.totalAttempts + importTime) / (prev.totalAttempts + 1)
            : importTime,
          lastImportTime: new Date()
        }));

        addLog('success', 
          `Batch execution completed: Keycloak ${result.keycloakResult.successful}/${result.summary.totalProcessed}, Database ${result.databaseResult.synced}/${result.keycloakResult.successful}`, 
          'BATCH_EXECUTION_SUCCESS', 
          result.summary
        );

        toast({
          title: "Import successful",
          description: `Keycloak: ${result.keycloakResult.successful} users, Database: ${result.databaseResult.synced} synced`,
        });

        // Reset form
        setFile(null);
        setValidationResult(null);

      } else {
        throw new Error(response.message || 'Batch execution failed');
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Batch execution failed';
      setError(errorMessage);
      addLog('error', errorMessage, 'BATCH_EXECUTION_ERROR', { error });
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  const downloadTemplate = useCallback(() => {
    const templateUrl = importType === 'users' 
      ? '/templates/users-strict-template.csv'
      : `/templates/${importType}-template.csv`;
    
    const a = document.createElement('a');
    a.href = templateUrl;
    a.download = `${importType}_template.csv`;
    a.click();
    
    addLog('info', `Template downloaded for ${importType}`, 'TEMPLATE_DOWNLOAD');
  }, [importType, addLog]);

  const resetImport = () => {
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
    setError(null);
    setImportProgress(0);
    addLog('info', 'Import reset', 'RESET');
  };

  const getValidationRules = async () => {
    try {
      const response = await apiClient.get('/csv-strict/validation-rules');
      addLog('info', 'Fetched validation rules', 'VALIDATION_RULES');
      return response;
    } catch (error) {
      addLog('error', 'Failed to fetch validation rules', 'VALIDATION_RULES_ERROR', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Keycloak-First CSV Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
              <TabsTrigger value="help">Help</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-6">
              {/* Import Type Selection */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Import Type</label>
                  <Select value={importType} onValueChange={(value: ImportType) => setImportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Users (Keycloak-First)
                        </div>
                      </SelectItem>
                      <SelectItem value="schools">Schools</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>

              {/* Keycloak-first notice for users */}
              {importType === 'users' && (
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Keycloak-First Import:</strong> Users will be created in Keycloak first, then synced to the database. 
                    This ensures authentication consistency and supports rollback operations.
                  </AlertDescription>
                </Alert>
              )}

              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-primary">Drop the CSV file here...</p>
                ) : (
                  <div>
                    <p className="text-foreground font-medium">Drop your CSV file here, or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {importType === 'users' ? 'Supports strict validation with Keycloak integration' : 'Standard CSV import'}
                    </p>
                  </div>
                )}
              </div>

              {/* File Info */}
              {file && (
                <Alert>
                  <FileText className="w-4 h-4" />
                  <AlertDescription>
                    <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                    <Button variant="ghost" size="sm" onClick={resetImport} className="ml-4">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Validation Progress */}
              {isValidating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Validating with Keycloak rules...</span>
                    <span>Processing...</span>
                  </div>
                  <Progress value={undefined} className="animate-pulse" />
                </div>
              )}

              {/* Validation Results */}
              {validationResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Keycloak-First Validation Results</h4>
                    <Badge variant={validationResult.readyForImport ? "default" : "destructive"}>
                      {validationResult.readyForImport ? "Ready for Import" : "Issues Found"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">{validationResult.summary.total}</div>
                      <div className="text-blue-700">Total Rows</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{validationResult.summary.valid}</div>
                      <div className="text-green-700">Valid</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-semibold text-yellow-600">{validationResult.summary.toUpdate}</div>
                      <div className="text-yellow-700">Updates</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-semibold text-red-600">{validationResult.summary.invalid}</div>
                      <div className="text-red-700">Invalid</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Executing Keycloak-first batch import...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <Alert variant={importResult.success ? "default" : "destructive"}>
                  {importResult.success ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">
                        Batch Execution {importResult.success ? 'Completed' : 'Failed'}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <strong>Keycloak:</strong>
                          </div>
                          <div>✓ {importResult.keycloakResult.successful} successful</div>
                          {importResult.keycloakResult.failed > 0 && (
                            <div>✗ {importResult.keycloakResult.failed} failed</div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <strong>Database:</strong>
                          </div>
                          <div>✓ {importResult.databaseResult.synced} synced</div>
                          {importResult.databaseResult.failed > 0 && (
                            <div>✗ {importResult.databaseResult.failed} failed</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {importType === 'users' ? (
                  <>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => validateStrictCSV()}
                        disabled={!file || isValidating}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {isValidating ? 'Validating...' : 'Validate CSV'}
                      </Button>
                      
                      <Button
                        onClick={executeKeycloakBatch}
                        disabled={!validationResult?.readyForImport || isImporting}
                        className="flex-1"
                      >
                        {isImporting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Execute Keycloak Batch
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Keycloak-first import ensures authentication consistency with automatic rollback on failures
                    </p>
                  </>
                ) : (
                  <Button
                    disabled={!file}
                    className="w-full"
                    variant="outline"
                  >
                    Standard Import (Coming Soon)
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="validation">
              <ValidationFeedback 
                result={validationResult as any}
                onShowDetails={() => setActiveTab('logs')}
              />
            </TabsContent>

            <TabsContent value="logs">
              <ImportLogger
                logs={logs}
                stats={stats}
                onExportLogs={() => {
                  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `keycloak-import-logs-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onClearLogs={() => setLogs([])}
              />
            </TabsContent>

            <TabsContent value="help">
              <TroubleshootingGuide
                errorType={error}
                errorMessage={error}
                onDownloadTemplate={downloadTemplate}
                onRetryImport={() => executeKeycloakBatch()}
                onValidateData={() => validateStrictCSV()}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCSVImport;
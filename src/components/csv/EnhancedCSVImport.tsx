import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  RotateCcw,
  Settings
} from 'lucide-react';
import { ValidationFeedback } from './ValidationFeedback';
import { ImportLogger } from './ImportLogger';
import { TroubleshootingGuide } from './TroubleshootingGuide';
import { apiService } from '@/services/apiService';

interface CSVRow {
  row: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; message: string; }>;
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
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ImportStats>({
    totalAttempts: 0,
    successfulImports: 0,
    failedImports: 0,
    averageImportTime: 0
  });
  const [validationResult, setValidationResult] = useState({
    isValid: false,
    errors: [] as any[],
    warnings: [] as any[],
    totalRows: 0,
    validRows: 0,
    stage: 'idle' as 'parsing' | 'validating' | 'complete' | 'idle',
    progress: 0
  });
  const [activeTab, setActiveTab] = useState('import');
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [batchSize, setBatchSize] = useState(50);

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
    addLog('info', `File uploaded: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`, 'FILE_UPLOAD');
    
    // Auto-validate on file upload
    await validateCSV(uploadedFile);
  }, [importType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const validateCSV = async (fileToValidate?: File) => {
    const targetFile = fileToValidate || file;
    if (!targetFile) return;

    setIsValidating(true);
    setValidationResult(prev => ({ ...prev, stage: 'parsing', progress: 0 }));
    addLog('info', `Starting validation for ${importType} import`, 'VALIDATION_START');

    try {
      // Simulate parsing progress
      setValidationResult(prev => ({ ...prev, progress: 20 }));
      
      const text = await targetFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      setValidationResult(prev => ({ ...prev, stage: 'validating', progress: 40 }));
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain a header row and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredFields = getRequiredFields(importType);
      
      // Check for missing required fields
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      if (missingFields.length > 0) {
        throw new Error(`Missing required columns: ${missingFields.join(', ')}`);
      }

      setValidationResult(prev => ({ ...prev, progress: 60 }));

      // Validate data rows
      const rows: CSVRow[] = [];
      const errors: any[] = [];
      const warnings: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        const rowErrors: string[] = [];
        const rowWarnings: string[] = [];

        // Validate required fields
        requiredFields.forEach(field => {
          if (!rowData[field] || rowData[field].trim() === '') {
            rowErrors.push(`${field} is required`);
          }
        });

        // Validate email format
        if (rowData.email && !isValidEmail(rowData.email)) {
          rowErrors.push('Invalid email format');
        }

        // Validate role for user imports
        if (importType === 'users' && rowData.role && !isValidRole(rowData.role)) {
          rowErrors.push(`Invalid role: ${rowData.role}`);
        }

        const row: CSVRow = {
          row: i,
          data: rowData,
          errors: rowErrors,
          warnings: rowWarnings,
          isValid: rowErrors.length === 0
        };

        rows.push(row);

        // Collect all errors and warnings
        rowErrors.forEach(error => errors.push({ row: i, field: '', message: error, severity: 'error' }));
        rowWarnings.forEach(warning => warnings.push({ row: i, field: '', message: warning, severity: 'warning' }));
      }

      setValidationResult(prev => ({ ...prev, progress: 80 }));

      setCsvData(rows);
      const validRows = rows.filter(row => row.isValid).length;
      
      setValidationResult({
        isValid: errors.length === 0,
        errors,
        warnings,
        totalRows: rows.length,
        validRows,
        stage: 'complete',
        progress: 100
      });

      addLog(
        errors.length === 0 ? 'success' : 'warning',
        `Validation complete: ${validRows}/${rows.length} valid rows`,
        'VALIDATION_COMPLETE',
        { validRows, totalRows: rows.length, errorCount: errors.length }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationResult(prev => ({ 
        ...prev, 
        stage: 'complete',
        progress: 0,
        errors: [{ row: 0, message: errorMessage, severity: 'error' as const }]
      }));
      addLog('error', errorMessage, 'VALIDATION_ERROR', { error });
      toast({
        title: "Validation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!csvData.length || !validationResult.isValid) return;

    const startTime = Date.now();
    setIsImporting(true);
    setImportProgress(0);
    setRetryAttempts(0);
    
    const validRows = csvData.filter(row => row.isValid);
    addLog('info', `Starting import of ${validRows.length} ${importType}`, 'IMPORT_START');

    try {
      let successful = 0;
      const errors: Array<{ row: number; message: string; }> = [];

      // Process in batches
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        
        try {
          const response = await apiService.importCSV(
            batch.map(row => row.data),
            importType as 'users' | 'schools'
          );
          
          successful += batch.length;
          addLog('success', `Batch ${Math.floor(i / batchSize) + 1} imported successfully (${batch.length} rows)`, 'BATCH_IMPORT');
          
        } catch (error) {
          batch.forEach(row => {
            errors.push({
              row: row.row,
              message: error instanceof Error ? error.message : 'Import failed'
            });
          });
          addLog('error', `Batch ${Math.floor(i / batchSize) + 1} failed`, 'BATCH_ERROR', { error });
        }
        
        setImportProgress(((i + batch.length) / validRows.length) * 100);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const endTime = Date.now();
      const importTime = (endTime - startTime) / 1000;

      // Update stats
      setStats(prev => ({
        totalAttempts: prev.totalAttempts + 1,
        successfulImports: prev.successfulImports + (successful > 0 ? 1 : 0),
        failedImports: prev.failedImports + (errors.length > 0 ? 1 : 0),
        averageImportTime: prev.totalAttempts > 0 
          ? (prev.averageImportTime * prev.totalAttempts + importTime) / (prev.totalAttempts + 1)
          : importTime,
        lastImportTime: new Date()
      }));

      setImportResult({
        total: validRows.length,
        successful,
        failed: errors.length,
        errors
      });

      addLog(
        successful > 0 ? 'success' : 'error',
        `Import completed: ${successful}/${validRows.length} successful`,
        'IMPORT_COMPLETE',
        { successful, failed: errors.length, importTime }
      );

      if (successful > 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${successful} ${importType}`,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      addLog('error', errorMessage, 'IMPORT_ERROR', { error });
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = useCallback(() => {
    const templates = {
      users: 'email,firstName,lastName,role,schoolId\nexample@school.edu,John,Doe,student,1',
      schools: 'name,address,type,contactEmail\nLincoln High School,123 Main St,public,admin@lincoln.edu',
      alumni: 'email,firstName,lastName,graduationYear,degree\nalumni@example.com,Jane,Smith,2020,Computer Science',
      teachers: 'email,firstName,lastName,subject,department\nteacher@school.edu,Prof,Johnson,Mathematics,STEM',
      students: 'email,firstName,lastName,grade,class\nstudent@school.edu,Alex,Wilson,10,10A'
    };
    
    const template = templates[importType];
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('info', `Template downloaded for ${importType}`, 'TEMPLATE_DOWNLOAD');
  }, [importType, addLog]);

  const getRequiredFields = (type: ImportType): string[] => {
    const fieldMap = {
      users: ['email', 'firstName', 'lastName', 'role'],
      schools: ['name', 'address', 'type'],
      alumni: ['email', 'firstName', 'lastName', 'graduationYear'],
      teachers: ['email', 'firstName', 'lastName', 'subject'],
      students: ['email', 'firstName', 'lastName', 'grade']
    };
    return fieldMap[type] || [];
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidRole = (role: string): boolean => {
    return ['student', 'teacher', 'alumni', 'school_admin', 'platform_admin'].includes(role);
  };

  const resetImport = () => {
    setFile(null);
    setCsvData([]);
    setImportResult(null);
    setValidationResult({
      isValid: false,
      errors: [] as any[],
      warnings: [] as any[],
      totalRows: 0,
      validRows: 0,
      stage: 'idle' as 'parsing' | 'validating' | 'complete' | 'idle',
      progress: 0
    });
    setImportProgress(0);
    setRetryAttempts(0);
    addLog('info', 'Import reset', 'RESET');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enhanced CSV Data Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
              <TabsTrigger value="help">Troubleshooting</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-6">
              {/* Import Type & Settings */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Import Type</label>
                  <Select value={importType} onValueChange={(value: ImportType) => setImportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="schools">Schools</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Batch Size</label>
                  <Select value={batchSize.toString()} onValueChange={(value) => setBatchSize(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>

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
                    <p className="text-sm text-muted-foreground mt-2">Supports CSV files up to 10MB</p>
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

              {/* Validation Progress */}
              {isValidating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Validating data...</span>
                    <span>{validationResult.progress}%</span>
                  </div>
                  <Progress value={validationResult.progress} />
                </div>
              )}

              {/* Import Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing data...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <Alert variant={importResult.failed > 0 ? "destructive" : "default"}>
                  {importResult.failed > 0 ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <AlertDescription>
                    Import completed: {importResult.successful} successful, {importResult.failed} failed
                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">View errors</summary>
                        <ul className="mt-2 space-y-1">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-sm">Row {error.row}: {error.message}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li className="text-sm">...and {importResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!csvData.length || !validationResult.isValid || isImporting}
                  className="flex-1"
                >
                  {isImporting ? 'Importing...' : `Import ${importType}`}
                </Button>
                {file && (
                  <Button variant="outline" onClick={() => validateCSV()} disabled={isValidating}>
                    <Eye className="w-4 h-4 mr-2" />
                    {isValidating ? 'Validating...' : 'Re-validate'}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="validation">
              <ValidationFeedback 
                result={validationResult}
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
                  a.download = `import-logs-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onClearLogs={() => setLogs([])}
              />
            </TabsContent>

            <TabsContent value="help">
              <TroubleshootingGuide
                errorType={importResult?.errors?.[0]?.message}
                errorMessage={validationResult.errors?.[0]?.message}
                onDownloadTemplate={downloadTemplate}
                onRetryImport={() => handleImport()}
                onValidateData={() => validateCSV()}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCSVImport;
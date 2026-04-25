import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Users,
  School,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface CSVRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
  valid: boolean;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

type ImportType = 'users' | 'schools' | 'alumni' | 'teachers' | 'students';

export const ProductionCSVImport = () => {
  const { user } = useAuth();
  const { theme } = useRoleTheme();
  
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>('users');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<{
    valid: number;
    invalid: number;
    warnings: number;
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (csvFile) {
      setFile(csvFile);
      setCsvData([]);
      setValidationResults(null);
      setImportResult(null);
      validateCSV(csvFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const validateCSV = async (file: File) => {
    setIsValidating(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const requiredFields = getRequiredFields(importType);
      const validatedData: CSVRow[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const rowData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Validate required fields
        requiredFields.forEach(field => {
          if (!rowData[field] || rowData[field].trim() === '') {
            errors.push(`${field} is required`);
          }
        });
        
        // Email validation
        if (rowData.email && !isValidEmail(rowData.email)) {
          errors.push('Invalid email format');
        }
        
        // Role validation
        if (rowData.role && !isValidRole(rowData.role)) {
          warnings.push(`Role "${rowData.role}" may not be standard`);
        }
        
        validatedData.push({
          row: i,
          data: rowData,
          errors,
          warnings,
          valid: errors.length === 0
        });
      }
      
      setCsvData(validatedData);
      setValidationResults({
        valid: validatedData.filter(row => row.valid).length,
        invalid: validatedData.filter(row => !row.valid).length,
        warnings: validatedData.reduce((acc, row) => acc + row.warnings.length, 0)
      });
      
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('CSV parsing error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getRequiredFields = (type: ImportType): string[] => {
    const fieldMaps = {
      users: ['email', 'firstName', 'lastName', 'role'],
      schools: ['name', 'address', 'type'],
      alumni: ['email', 'firstName', 'lastName', 'graduationYear'],
      teachers: ['email', 'firstName', 'lastName', 'subject'],
      students: ['email', 'firstName', 'lastName', 'grade']
    };
    return fieldMaps[type] || [];
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidRole = (role: string): boolean => {
    const validRoles = ['platform_admin', 'school_admin', 'teacher', 'student', 'alumni'];
    return validRoles.includes(role.toLowerCase());
  };

  const handleImport = async () => {
    if (!csvData.length || !validationResults) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const validRows = csvData.filter(row => row.valid);
      const batchSize = 10;
      let processed = 0;
      const errors: Array<{ row: number; message: string }> = [];
      
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        
        try {
          // Get token from localStorage for API authentication
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Authentication required');
          }

          const response = await fetch(`http://localhost:3033/api/csv/import/${importType}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              data: batch.map(row => row.data)
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const result = await response.json();
          processed += result.imported || batch.length;
          
          if (result.failedItems && result.failedItems.length > 0) {
            result.failedItems.forEach((item: any) => {
              errors.push({
                row: batch.find(r => r.data.email === item.email)?.row || 0,
                message: item.error || 'Import failed'
              });
            });
          }
        } catch (error) {
          batch.forEach(row => {
            errors.push({
              row: row.row,
              message: `Failed to import: ${error instanceof Error ? error.message : 'Network error'}`
            });
          });
        }
        
        setImportProgress((processed / validRows.length) * 100);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setImportResult({
        total: validRows.length,
        successful: processed,
        failed: errors.length,
        errors
      });
      
      if (processed > 0) {
        toast.success(`Successfully imported ${processed} ${importType}`);
      }
      
    } catch (error) {
      toast.error('Import failed');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
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
  };

  if (!user || !['platform_admin', 'school_admin'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">CSV import is only available to administrators.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className={`rounded-xl bg-gradient-to-br ${theme.gradient} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">CSV Data Import</h1>
            <p className="text-white/90">Bulk import users, schools, and other data</p>
          </div>
          <Upload className="w-12 h-12 text-white/80" />
        </div>
      </div>

      {/* Import Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Select Import Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(['users', 'schools', 'alumni', 'teachers', 'students'] as ImportType[]).map((type) => (
              <Button
                key={type}
                variant={importType === type ? 'default' : 'outline'}
                onClick={() => setImportType(type)}
                className="justify-start"
              >
                {type === 'users' && <Users className="w-4 h-4 mr-2" />}
                {type === 'schools' && <School className="w-4 h-4 mr-2" />}
                {type !== 'users' && type !== 'schools' && <Users className="w-4 h-4 mr-2" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={downloadTemplate} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg text-primary">Drop the CSV file here...</p>
            ) : (
              <div>
                <p className="text-lg text-gray-600 mb-2">
                  Drag & drop a CSV file here, or click to select
                </p>
                <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
              </div>
            )}
          </div>
          
          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {isValidating && (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">Validating...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>Validation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{validationResults.valid}</div>
                <div className="text-sm text-gray-600">Valid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-error">{validationResults.invalid}</div>
                <div className="text-sm text-gray-600">Invalid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{validationResults.warnings}</div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
            </div>
            
            {validationResults.valid > 0 && (
              <Button 
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importing... ({importProgress.toFixed(0)}%)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {validationResults.valid} Valid Rows
                  </>
                )}
              </Button>
            )}
            
            {isImporting && (
              <div className="mt-4">
                <Progress value={importProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>Import Complete</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                <div className="text-sm text-gray-600">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{importResult.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-error">{importResult.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
            
            {importResult.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <details>
                    <summary className="cursor-pointer font-medium">
                      View {importResult.errors.length} errors
                    </summary>
                    <ScrollArea className="h-32 mt-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm py-1">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                    </ScrollArea>
                  </details>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {csvData.slice(0, 20).map((row, index) => (
                  <div key={index} className={`
                    p-3 rounded-lg border ${row.valid ? 'border-success/20 bg-success/5' : 'border-error/20 bg-error/5'}
                  `}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Row {row.row}</span>
                      <div className="flex items-center space-x-2">
                        {row.valid ? (
                          <Badge variant="secondary" className="text-success bg-success/10">
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-error bg-error/10">
                            Invalid
                          </Badge>
                        )}
                        {row.warnings.length > 0 && (
                          <Badge variant="secondary" className="text-warning bg-warning/10">
                            {row.warnings.length} Warning(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {Object.entries(row.data).slice(0, 4).map(([key, value]) => (
                        <span key={key} className="mr-4">
                          <strong>{key}:</strong> {value}
                        </span>
                      ))}
                    </div>
                    
                    {(row.errors.length > 0 || row.warnings.length > 0) && (
                      <div className="mt-2 space-y-1">
                        {row.errors.map((error, i) => (
                          <div key={i} className="text-xs text-error flex items-center">
                            <XCircle className="w-3 h-3 mr-1" />
                            {error}
                          </div>
                        ))}
                        {row.warnings.map((warning, i) => (
                          <div key={i} className="text-xs text-warning flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {csvData.length > 20 && (
                  <div className="text-center py-4 text-gray-500">
                    ... and {csvData.length - 20} more rows
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
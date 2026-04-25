import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  RotateCcw,
  Shield
} from 'lucide-react';

interface CSVRow {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  parsedData: CSVRow[];
}

interface ClientSideCSVParserProps {
  onValidatedData: (data: CSVRow[]) => void;
  validationRules: {
    requiredFields: string[];
    emailFields: string[];
    uniqueFields: string[];
  };
  importType: string;
}

export const ClientSideCSVParser: React.FC<ClientSideCSVParserProps> = ({
  onValidatedData,
  validationRules,
  importType
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const parseCSV = (content: string): CSVRow[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return rows;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateRow = (row: CSVRow, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check required fields
    validationRules.requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push({
          row: rowIndex + 1,
          field,
          message: `${field} is required`
        });
      }
    });

    // Check email fields
    validationRules.emailFields.forEach(field => {
      if (row[field] && !validateEmail(row[field])) {
        errors.push({
          row: rowIndex + 1,
          field,
          message: `${field} must be a valid email address`
        });
      }
    });

    return errors;
  };

  const validateData = async (parsedData: CSVRow[]): Promise<ValidationResult> => {
    const allErrors: ValidationError[] = [];
    const fieldValues: { [key: string]: Set<string> } = {};

    // Initialize sets for unique field validation
    validationRules.uniqueFields.forEach(field => {
      fieldValues[field] = new Set();
    });

    // Validate each row
    parsedData.forEach((row, index) => {
      // Basic validation
      const rowErrors = validateRow(row, index);
      allErrors.push(...rowErrors);

      // Check unique constraints
      validationRules.uniqueFields.forEach(field => {
        if (row[field]) {
          if (fieldValues[field].has(row[field])) {
            allErrors.push({
              row: index + 1,
              field,
              message: `${field} must be unique (duplicate found)`
            });
          } else {
            fieldValues[field].add(row[field]);
          }
        }
      });
    });

    const validRows = parsedData.length - new Set(allErrors.map(e => e.row)).size;

    return {
      isValid: allErrors.length === 0,
      totalRows: parsedData.length,
      validRows,
      errors: allErrors,
      parsedData
    };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setValidationResult(null);
    setIsValidating(true);

    try {
      const content = await uploadedFile.text();
      const parsedData = parseCSV(content);

      if (parsedData.length === 0) {
        throw new Error('CSV file is empty or has no data rows');
      }

      const validation = await validateData(parsedData);
      setValidationResult(validation);

      if (validation.isValid) {
        onValidatedData(validation.parsedData);
        toast({
          title: "Validation successful",
          description: `${validation.validRows} rows ready for import`,
        });
      } else {
        toast({
          title: "Validation errors found",
          description: `${validation.errors.length} errors in ${validation.totalRows - validation.validRows} rows`,
          variant: "destructive"
        });
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to parse CSV file';
      setError(errorMessage);
      toast({
        title: "Parse error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  }, [validationRules, onValidatedData, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const resetParser = () => {
    setFile(null);
    setValidationResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-primary">Drop the CSV file here...</p>
        ) : (
          <div>
            <p className="text-foreground font-medium">Drop your CSV file here, or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1">
              Client-side validation for {importType} import
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
            <Button variant="ghost" size="sm" onClick={resetParser} className="ml-4">
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
            <span>Validating CSV data...</span>
            <span>Processing...</span>
          </div>
          <Progress value={undefined} className="animate-pulse" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Validation Results</span>
              <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                {validationResult.isValid ? "Valid" : `${validationResult.errors.length} Errors`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{validationResult.totalRows}</div>
                <div className="text-blue-700">Total Rows</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{validationResult.validRows}</div>
                <div className="text-green-700">Valid</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-600">{validationResult.totalRows - validationResult.validRows}</div>
                <div className="text-red-700">Invalid</div>
              </div>
            </div>

            {/* Error Details */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Validation Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {validationResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border border-red-200">
                      <strong>Row {error.row}:</strong> {error.field} - {error.message}
                    </div>
                  ))}
                  {validationResult.errors.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ... and {validationResult.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
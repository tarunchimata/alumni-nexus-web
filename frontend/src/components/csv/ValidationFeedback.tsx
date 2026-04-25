import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationError {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  totalRows: number;
  validRows: number;
  stage: 'parsing' | 'validating' | 'complete' | 'idle';
  progress: number;
}

interface ValidationFeedbackProps {
  result: ValidationResult;
  onShowDetails?: () => void;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  result,
  onShowDetails
}) => {
  const getStageIcon = () => {
    switch (result.stage) {
      case 'parsing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'validating':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'complete':
        return result.isValid 
          ? <CheckCircle className="w-5 h-5 text-success" />
          : <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStageText = () => {
    switch (result.stage) {
      case 'parsing':
        return 'Parsing CSV file...';
      case 'validating':
        return 'Validating data...';
      case 'complete':
        return result.isValid ? 'Validation complete' : 'Validation failed';
      default:
        return 'Ready to validate';
    }
  };

  const getSummaryVariant = () => {
    if (result.errors.length > 0) return 'destructive';
    if (result.warnings.length > 0) return 'default';
    return 'default';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStageIcon()}
          Validation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(result.stage === 'parsing' || result.stage === 'validating') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{getStageText()}</span>
              <span>{Math.round(result.progress)}%</span>
            </div>
            <Progress value={result.progress} className="w-full" />
          </div>
        )}

        {/* Summary Statistics */}
        {result.stage === 'complete' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{result.totalRows}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">{result.validRows}</div>
              <div className="text-sm text-muted-foreground">Valid Rows</div>
            </div>
            <div className="text-center p-3 bg-destructive/10 rounded-lg">
              <div className="text-2xl font-bold text-destructive">{result.errors.length}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center p-3 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold text-warning">{result.warnings.length}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
          </div>
        )}

        {/* Error Summary */}
        {result.errors.length > 0 && (
          <Alert variant={getSummaryVariant()}>
            <XCircle className="w-4 h-4" />
            <AlertDescription>
              Found {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} that must be fixed before importing.
              {onShowDetails && (
                <button 
                  onClick={onShowDetails}
                  className="ml-2 underline hover:no-underline"
                >
                  View details
                </button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning Summary */}
        {result.warnings.length > 0 && result.errors.length === 0 && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Found {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''}. Review before importing.
              {onShowDetails && (
                <button 
                  onClick={onShowDetails}
                  className="ml-2 underline hover:no-underline"
                >
                  View details
                </button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {result.isValid && result.errors.length === 0 && result.stage === 'complete' && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              All data validated successfully! Ready to import {result.validRows} row{result.validRows !== 1 ? 's' : ''}.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Error Preview */}
        {result.errors.length > 0 && result.errors.length <= 3 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Recent Errors:</h4>
            {result.errors.slice(0, 3).map((error, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-destructive/5 rounded border-l-2 border-destructive">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Row {error.row}</Badge>
                    {error.field && <Badge variant="secondary" className="text-xs">{error.field}</Badge>}
                  </div>
                  <p className="text-sm text-foreground mt-1">{error.message}</p>
                </div>
              </div>
            ))}
            {result.errors.length > 3 && onShowDetails && (
              <button 
                onClick={onShowDetails}
                className="text-sm text-primary hover:underline"
              >
                View all {result.errors.length} errors
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
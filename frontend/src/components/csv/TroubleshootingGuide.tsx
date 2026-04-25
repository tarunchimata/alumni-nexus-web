import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Search,
  RefreshCw
} from 'lucide-react';

interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  solution: string;
  severity: 'low' | 'medium' | 'high';
  category: 'format' | 'data' | 'authentication' | 'network' | 'validation';
}

interface TroubleshootingGuideProps {
  errorType?: string;
  errorMessage?: string;
  onDownloadTemplate?: () => void;
  onRetryImport?: () => void;
  onValidateData?: () => void;
}

const troubleshootingSteps: TroubleshootingStep[] = [
  {
    id: 'auth-failed',
    title: 'Authentication Failed',
    description: 'Import fails with "Authentication required" error',
    solution: 'Please log out and log back in to refresh your authentication token. If the problem persists, contact your administrator.',
    severity: 'high',
    category: 'authentication'
  },
  {
    id: 'invalid-csv-format',
    title: 'Invalid CSV Format',
    description: 'CSV file is not properly formatted or has missing columns',
    solution: 'Download the latest template and ensure your CSV file matches the exact column names and order. Remove any extra commas or special characters.',
    severity: 'medium',
    category: 'format'
  },
  {
    id: 'missing-required-fields',
    title: 'Missing Required Fields',
    description: 'Some rows have empty required fields',
    solution: 'Check that all required columns (marked with *) have values for every row. Use the validation preview to identify specific missing fields.',
    severity: 'medium',
    category: 'validation'
  },
  {
    id: 'duplicate-emails',
    title: 'Duplicate Email Addresses',
    description: 'Multiple rows contain the same email address',
    solution: 'Ensure each email address appears only once in your CSV file. Email addresses must be unique across the system.',
    severity: 'medium',
    category: 'data'
  },
  {
    id: 'invalid-email-format',
    title: 'Invalid Email Format',
    description: 'Email addresses are not in valid format',
    solution: 'Check that all email addresses follow the format: username@domain.com. Remove any spaces or special characters.',
    severity: 'low',
    category: 'validation'
  },
  {
    id: 'school-not-found',
    title: 'School ID Not Found',
    description: 'Referenced school ID does not exist in the system',
    solution: 'Verify that the school ID exists in your system. Contact your administrator if you need to add new schools first.',
    severity: 'high',
    category: 'data'
  },
  {
    id: 'network-timeout',
    title: 'Network Timeout',
    description: 'Import fails due to network connectivity issues',
    solution: 'Check your internet connection and try again. For large files, consider splitting them into smaller batches.',
    severity: 'medium',
    category: 'network'
  },
  {
    id: 'file-too-large',
    title: 'File Size Too Large',
    description: 'CSV file exceeds the maximum allowed size',
    solution: 'Split your CSV file into smaller files (recommended: 100-500 rows per file) and import them separately.',
    severity: 'medium',
    category: 'format'
  }
];

export const TroubleshootingGuide: React.FC<TroubleshootingGuideProps> = ({
  errorType,
  errorMessage,
  onDownloadTemplate,
  onRetryImport,
  onValidateData
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleExpanded = (stepId: string) => {
    setExpandedItems(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'format':
        return <FileText className="w-4 h-4" />;
      case 'authentication':
        return <AlertTriangle className="w-4 h-4" />;
      case 'validation':
        return <CheckCircle className="w-4 h-4" />;
      case 'network':
        return <RefreshCw className="w-4 h-4" />;
      case 'data':
        return <Search className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  // Auto-expand relevant steps based on error
  React.useEffect(() => {
    if (errorMessage) {
      const relevantSteps = troubleshootingSteps
        .filter(step => 
          errorMessage.toLowerCase().includes(step.title.toLowerCase()) ||
          errorMessage.toLowerCase().includes(step.category)
        )
        .map(step => step.id);
      
      setExpandedItems(relevantSteps);
    }
  }, [errorMessage]);

  const filteredSteps = troubleshootingSteps.filter(step =>
    selectedCategory === 'all' || step.category === selectedCategory
  );

  const categories = ['all', ...Array.from(new Set(troubleshootingSteps.map(step => step.category)))];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Import Troubleshooting Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Error Alert */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Current Error:</strong> {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {onDownloadTemplate && (
            <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          )}
          {onValidateData && (
            <Button variant="outline" size="sm" onClick={onValidateData}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Validate Data
            </Button>
          )}
          {onRetryImport && (
            <Button variant="outline" size="sm" onClick={onRetryImport}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Import
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Issues' : category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        {/* Troubleshooting Steps */}
        <div className="space-y-3">
          {filteredSteps.map((step) => (
            <Collapsible
              key={step.id}
              open={expandedItems.includes(step.id)}
              onOpenChange={() => toggleExpanded(step.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(step.category)}
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    <Badge variant={getSeverityColor(step.severity)}>
                      {step.severity}
                    </Badge>
                  </div>
                  {expandedItems.includes(step.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 border-l-2 border-primary bg-primary/5 ml-3 mt-2 rounded">
                  <h5 className="font-medium text-foreground mb-2">Solution:</h5>
                  <p className="text-sm text-foreground">{step.solution}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* General Tips */}
        <Alert>
          <Lightbulb className="w-4 h-4" />
          <AlertDescription>
            <strong>Pro Tips:</strong> Always download the latest template before creating your CSV. 
            Test with a small sample (5-10 rows) before importing large datasets. 
            Keep a backup of your original data.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default TroubleshootingGuide;
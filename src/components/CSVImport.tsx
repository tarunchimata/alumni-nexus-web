
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface CSVImportProps {
  type: 'schools' | 'users';
  onSuccess?: () => void;
}

const CSVImport = ({ type, onSuccess }: CSVImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const endpoint = type === 'schools' ? '/api/schools/bulk' : '/api/users/bulk';
      const response = await apiClient.uploadFile(endpoint, file);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(response);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateUrl = type === 'schools' 
      ? '/templates/schools-template.csv' 
      : '/templates/users-template.csv';
    
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = `${type}-template.csv`;
    link.click();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import {type === 'schools' ? 'Schools' : 'Users'} from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import {type}. Make sure your file follows the required format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Download Template</p>
              <p className="text-sm text-blue-600">Get the correct CSV format</p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadTemplate} size="sm">
            Download
          </Button>
        </div>

        {/* File Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select CSV File</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {file.name}
              </span>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Import completed! Created {result.created} {type}, 
              {result.errors > 0 && ` with ${result.errors} errors`}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Import ${type}`}
        </Button>

        {/* Format Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Required columns for {type}:</strong></p>
          {type === 'schools' ? (
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>name - School name</li>
              <li>udise_code - Unique school identifier</li>
              <li>school_type - Primary, Secondary, or Higher Secondary</li>
              <li>management_type - Government or Private</li>
              <li>address - Complete address</li>
              <li>contact_number - Phone number (optional)</li>
            </ul>
          ) : (
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>email - User email address</li>
              <li>first_name - First name</li>
              <li>last_name - Last name</li>
              <li>role - student, teacher, alumni, or school_admin</li>
              <li>school_udise_code - Associated school's UDISE code</li>
              <li>phone_number - Phone number (optional)</li>
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImport;

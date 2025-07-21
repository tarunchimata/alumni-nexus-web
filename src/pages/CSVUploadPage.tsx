
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  GraduationCap
} from 'lucide-react';

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ValidationError[];
}

const CSVUploadPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if user has permission to upload
  const canUpload = user?.role === 'school_admin' || user?.role === 'platform_admin';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', activeTab);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
      } else {
        const error = await response.json();
        setUploadResult({
          success: false,
          totalRows: 0,
          successCount: 0,
          errorCount: 1,
          errors: [{ row: 0, field: 'general', message: error.message || 'Upload failed', value: '' }]
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'general', message: 'Network error occurred', value: '' }]
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setTimeout(() => setUploadResult(null), 10000); // Clear result after 10 seconds
    }
  };

  const downloadTemplate = (type: 'students' | 'teachers') => {
    const templateFile = type === 'students' ? 
      '/templates/students-upload-template.csv' : 
      '/templates/teachers-upload-template.csv';
    
    const link = document.createElement('a');
    link.href = templateFile;
    link.download = `${type}-upload-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canUpload) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the CSV upload feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              This feature is only available for school administrators and platform administrators.
            </p>
            <Badge variant="outline" className="capitalize">
              Your Role: {user?.role.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CSV Bulk Upload</h1>
          <p className="text-gray-600 mt-2">
            Upload student and teacher data in bulk using CSV files
          </p>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Teachers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Bulk Upload
                </CardTitle>
                <CardDescription>
                  Upload multiple student records at once using a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Download */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Step 1: Download Template
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    Download the CSV template with the correct format and sample data
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadTemplate('students')}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Student Template
                  </Button>
                </div>

                {/* File Upload */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Step 2: Upload CSV File
                  </h3>
                  <p className="text-green-800 text-sm mb-3">
                    Select your completed CSV file to upload student data
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                        <Upload className="w-4 h-4 mr-2" />
                        Select CSV File
                      </Button>
                    </label>
                    {selectedFile && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                {selectedFile && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      Step 3: Process Upload
                    </h3>
                    <p className="text-purple-800 text-sm mb-3">
                      Process the CSV file and create student accounts
                    </p>
                    <Button 
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isUploading ? 'Processing...' : 'Upload Students'}
                    </Button>
                  </div>
                )}

                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing CSV file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* Results */}
                {uploadResult && (
                  <div className="space-y-4">
                    <Alert className={uploadResult.success ? 'border-green-500' : 'border-red-500'}>
                      <div className="flex items-center gap-2">
                        {uploadResult.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <AlertDescription>
                          {uploadResult.success ? 
                            `Successfully uploaded ${uploadResult.successCount} students` :
                            `Upload failed with ${uploadResult.errorCount} errors`
                          }
                        </AlertDescription>
                      </div>
                    </Alert>

                    {uploadResult.errors.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                        <div className="space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-800">
                              Row {error.row}: {error.field} - {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Teacher Bulk Upload
                </CardTitle>
                <CardDescription>
                  Upload multiple teacher records at once using a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Download */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Step 1: Download Template
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    Download the CSV template with the correct format and sample data
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadTemplate('teachers')}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Teacher Template
                  </Button>
                </div>

                {/* File Upload */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Step 2: Upload CSV File
                  </h3>
                  <p className="text-green-800 text-sm mb-3">
                    Select your completed CSV file to upload teacher data
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                        <Upload className="w-4 h-4 mr-2" />
                        Select CSV File
                      </Button>
                    </label>
                    {selectedFile && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800">{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                {selectedFile && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      Step 3: Process Upload
                    </h3>
                    <p className="text-purple-800 text-sm mb-3">
                      Process the CSV file and create teacher accounts
                    </p>
                    <Button 
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isUploading ? 'Processing...' : 'Upload Teachers'}
                    </Button>
                  </div>
                )}

                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing CSV file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* Results */}
                {uploadResult && (
                  <div className="space-y-4">
                    <Alert className={uploadResult.success ? 'border-green-500' : 'border-red-500'}>
                      <div className="flex items-center gap-2">
                        {uploadResult.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <AlertDescription>
                          {uploadResult.success ? 
                            `Successfully uploaded ${uploadResult.successCount} teachers` :
                            `Upload failed with ${uploadResult.errorCount} errors`
                          }
                        </AlertDescription>
                      </div>
                    </Alert>

                    {uploadResult.errors.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
                        <div className="space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-800">
                              Row {error.row}: {error.field} - {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Guidelines */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Upload Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">File Requirements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CSV format only (.csv)</li>
                  <li>• Maximum 1000 rows per upload</li>
                  <li>• UTF-8 encoding required</li>
                  <li>• No empty rows or columns</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Data Validation:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Email addresses must be unique</li>
                  <li>• Phone numbers must be valid</li>
                  <li>• Date format: YYYY-MM-DD</li>
                  <li>• All required fields must be filled</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSVUploadPage;

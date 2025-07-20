
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, AlertTriangle, CheckCircle, X } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadResult {
  total: number;
  successful: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

const CSVUploadPage = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userType, setUserType] = useState<'students' | 'teachers'>('students');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

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
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userType', userType);
    
    try {
      const response = await fetch('/api/admin/csv-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (type: 'students' | 'teachers') => {
    const templates = {
      students: '/templates/students-template.csv',
      teachers: '/templates/teachers-template.csv'
    };
    
    const link = document.createElement('a');
    link.href = templates[type];
    link.download = `${type}-template.csv`;
    link.click();
  };

  if (user?.role !== 'school_admin' && user?.role !== 'platform_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader />
          <div className="p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access this page.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bulk User Upload</h2>
              <p className="text-gray-600">Upload students and teachers using CSV files</p>
            </div>

            <Tabs value={userType} onValueChange={(value) => setUserType(value as 'students' | 'teachers')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="teachers">Teachers</TabsTrigger>
              </TabsList>

              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Students</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student-file">Select CSV File</Label>
                        <Input
                          id="student-file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="outline" 
                          onClick={() => downloadTemplate('students')}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• First Name</li>
                        <li>• Last Name</li>
                        <li>• Email</li>
                        <li>• Date of Birth (YYYY-MM-DD)</li>
                        <li>• Grade/Year</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teachers">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Teachers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teacher-file">Select CSV File</Label>
                        <Input
                          id="teacher-file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="outline" 
                          onClick={() => downloadTemplate('teachers')}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• First Name</li>
                        <li>• Last Name</li>
                        <li>• Email</li>
                        <li>• Date of Birth (YYYY-MM-DD)</li>
                        <li>• Department</li>
                        <li>• Subject</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {selectedFile && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Upload Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {uploadResult && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Upload Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{uploadResult.total}</div>
                        <p className="text-sm text-blue-800">Total Records</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{uploadResult.successful}</div>
                        <p className="text-sm text-green-800">Successful</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</div>
                        <p className="text-sm text-red-800">Errors</p>
                      </div>
                    </div>

                    {uploadResult.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {uploadResult.errors.map((error, index) => (
                            <div key={index} className="p-2 bg-red-50 rounded text-sm">
                              <span className="font-medium">Row {error.row}:</span> {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CSVUploadPage;

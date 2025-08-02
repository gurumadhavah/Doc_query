import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Link, FileText, File, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadFormProps {
  onDocumentSubmit: (documentUrl: string) => void;
  isLoading: boolean;
}

export const UploadForm = ({ onDocumentSubmit, isLoading }: UploadFormProps) => {
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const { toast } = useToast();

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (documentUrl.trim()) {
      onDocumentSubmit(documentUrl.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'message/rfc822',
      'application/vnd.ms-outlook'
    ];

    const allowedExtensions = ['.pdf', '.docx', '.doc', '.eml', '.msg'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOCX, or email file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    
    // Convert file to data URL for processing
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onDocumentSubmit(dataUrl);
    };
    reader.readAsDataURL(file);

    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <File className="h-4 w-4 text-blue-500" />;
      case 'eml':
      case 'msg':
        return <Mail className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full shadow-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Document Upload</CardTitle>
            <CardDescription>
              Upload documents via URL or direct file upload (PDF, DOCX, Email)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="url" onValueChange={(value) => setUploadMode(value as 'url' | 'file')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-url" className="text-sm font-medium">
                  Document URL
                </Label>
                <div className="relative">
                  <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="document-url"
                    type="url"
                    placeholder="https://example.com/policy.pdf"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!documentUrl.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Loading URL...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Load from URL
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-file" className="text-sm font-medium">
                  Upload Document
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    id="document-file"
                    type="file"
                    accept=".pdf,.docx,.doc,.eml,.msg"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <label htmlFor="document-file" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-medium text-primary">Click to upload</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PDF, DOCX, or Email files (max 10MB)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  {getFileIcon(uploadedFile)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Badge variant="outline" className="border-success text-success">
                    Uploaded
                  </Badge>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-xs text-warning-foreground">
                  <p className="font-medium mb-1">Supported formats:</p>
                  <ul className="space-y-0.5">
                    <li>• PDF documents (.pdf)</li>
                    <li>• Word documents (.docx, .doc)</li>
                    <li>• Email files (.eml, .msg)</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { File, FileText, Link, Mail, Upload } from 'lucide-react';
import { useState } from 'react';

// Updated interface for the data sent to the parent component
interface SubmitPayload {
  source: string;
  checksum?: string;
  fileObject?: File;
  isFileUpload: boolean;
}

interface UploadFormProps {
  onDocumentSubmit: (payload: SubmitPayload) => void;
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
      // Send payload for URL submission
      onDocumentSubmit({ source: documentUrl.trim(), isFileUpload: false });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- File Validation ---
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.eml', '.msg'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOCX, or email file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // Increased limit to 25MB
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 25MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    
    try {
      // --- File Processing for Checksum ---
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // FIX: Pass the raw File object up, don't use FileReader
      onDocumentSubmit({
        source: file.name, // Use filename for display
        checksum: checksum,
        fileObject: file, // This is the raw file for FormData
        isFileUpload: true
      });

      toast({
        title: "File Ready",
        description: `${file.name} is ready to be analyzed.`,
      });

    } catch (error) {
        console.error("Error processing file:", error);
        toast({
            title: "Error",
            description: "Could not process the file for upload.",
            variant: "destructive",
        });
    }
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
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Document Processor</CardTitle>
            <CardDescription>
              Submit a document via public URL or direct file upload.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'url' | 'file')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url"><Link className="mr-2 h-4 w-4" />URL</TabsTrigger>
            <TabsTrigger value="file"><Upload className="mr-2 h-4 w-4" />File</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="pt-4">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-url">Document URL</Label>
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
              <Button type="submit" className="w-full" disabled={!documentUrl.trim() || isLoading}>
                {isLoading && uploadMode === 'url' ? (
                  <><Upload className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Link className="mr-2 h-4 w-4" /> Process from URL</>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file" className="pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-file">Upload Document</Label>
                <div className="relative rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50">
                  <input
                    id="document-file"
                    type="file"
                    accept=".pdf,.docx,.doc,.eml,.msg"
                    onChange={handleFileUpload}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm">
                      <span className="font-medium text-primary">Click to upload</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX, DOC, EML, or MSG (Max 25MB)
                    </p>
                  </div>
                </div>
              </div>
              {uploadedFile && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                  {getFileIcon(uploadedFile)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {isLoading && uploadMode === 'file' ? (
                     <Badge variant="secondary">Processing...</Badge>
                  ) : (
                    <Badge variant="secondary" className="border-green-600 text-green-600">
                      Ready
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
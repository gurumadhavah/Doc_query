import { useState } from 'react';
import { UploadForm } from '@/components/UploadForm';
import { QuestionForm } from '@/components/QuestionForm';
import { AnswerList } from '@/components/AnswerList';
import { Loader } from '@/components/Loader';
import { useToast } from '@/hooks/use-toast';
import { Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Helper function to read file as Base64
const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        // Remove the data URI prefix (e.g., "data:application/pdf;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
    };
    reader.onerror = error => reject(error);
});

export const Home = () => {
  const [documentPayload, setDocumentPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const { toast } = useToast();

  const handleDocumentSubmit = (payload) => {
    setDocumentPayload(payload);
    setResults(null);
    toast({
      title: "Document Ready",
      description: "You can now add questions for analysis.",
    });
  };

  const handleQuestionsSubmit = async (questions) => {
    if (!documentPayload?.source) {
      toast({ title: "No Document Loaded", description: "Please upload or link to a document first.", variant: "destructive" });
      return;
    }

    const activeQuestions = questions.filter(q => q.trim() !== '');
    if (activeQuestions.length === 0) {
      toast({ title: "No Questions Provided", description: "Please enter at least one question to analyze.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
        const API_URL = `${import.meta.env.VITE_API_URL}/api/hackrx/run`;
        const API_TOKEN = "af215d20c2561423c20b7ccdfbb4dbc6fe7c5bb9bc869dae38917c8de16368ca";
        let requestBody;

        if (documentPayload.isFileUpload) {
            // Encode the file to Base64
            const fileContentBase64 = await toBase64(documentPayload.fileObject);
            requestBody = {
                filename: documentPayload.fileObject.name,
                file_content_base64: fileContentBase64,
                questions: activeQuestions,
            };
        } else {
            // Standard URL payload
            requestBody = {
                document_url: documentPayload.source,
                questions: activeQuestions,
            };
        }

        const fetchResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!fetchResponse.ok) {
            const errorData = await fetchResponse.json();
            throw new Error(errorData.detail || "Analysis failed.");
        }
        
        const response = await fetchResponse.json();
        const processingTime = Date.now() - startTime;
      
        setResults({
            questions: activeQuestions,
            answers: response.answers || [],
            processingTime,
            documentSource: documentPayload.source
        });

        toast({
            title: "Analysis Complete",
            description: `Successfully analyzed ${activeQuestions.length} question(s) in ${processingTime}ms`,
        });

    } catch (error) {
        console.error('Analysis failed:', error);
        toast({
            title: "Analysis Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-4 rounded-xl bg-primary/10 p-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Brain className="h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold">DocuQuery AI</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Intelligent Query-Retrieval for Insurance, Legal, HR, and Compliance Documents
            </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <UploadForm 
              onDocumentSubmit={handleDocumentSubmit}
              isLoading={isLoading}
            />
            <QuestionForm 
              onQuestionsSubmit={handleQuestionsSubmit}
              isLoading={isLoading}
              documentLoaded={!!documentPayload}
            />
            {documentPayload && (
              <Card className="border-green-600/20 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-green-600 text-green-600">
                      Document Ready
                    </Badge>
                    <span className="truncate text-sm text-muted-foreground">
                      {documentPayload.source.length > 50 
                        ? `${documentPayload.source.substring(0, 50)}...` 
                        : documentPayload.source}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="space-y-6">
            {isLoading ? (
              <Loader message="Analyzing document with AI..." />
            ) : (
              <AnswerList results={results} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
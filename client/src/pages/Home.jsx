import { useState } from 'react';
import { UploadForm } from '@/components/UploadForm';
import { QuestionForm } from '@/components/QuestionForm';
import { AnswerList } from '@/components/AnswerList';
import { Loader } from '@/components/Loader';
import apiClient from '@/api/api';
import { useToast } from '@/hooks/use-toast';
import { Brain, Shield, FileText, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Home = () => {
  const [documentUrl, setDocumentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const { toast } = useToast();

  const handleDocumentSubmit = (url) => {
    setDocumentUrl(url);
    setResults(null);
    toast({
      title: "Document Loaded",
      description: "Document URL has been set. You can now add questions for analysis.",
    });
  };

  const handleQuestionsSubmit = async (questions) => {
    if (!documentUrl) {
      toast({
        title: "No Document",
        description: "Please upload a document first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await apiClient.analyzeDocuments({
        documents: documentUrl,
        questions: questions,
      });
      const processingTime = Date.now() - startTime;
      
      setResults({
        questions,
        answers: response.answers || [],
        processingTime,
        documentUrl
      });

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${questions.length} questions in ${processingTime}ms`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              DocuQuery Wise
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            LLM-Powered Intelligent Query-Retrieval System for Insurance, Legal, HR, and Compliance Documents
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Multi-Format</h3>
              </div>
              <p className="text-xs text-muted-foreground">PDF, DOCX, Email support</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-sm">Fast Analysis</h3>
              </div>
              <p className="text-xs text-muted-foreground">Semantic search & retrieval</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-success" />
                <h3 className="font-semibold text-sm">AI-Powered</h3>
              </div>
              <p className="text-xs text-muted-foreground">LLM-driven insights</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-warning" />
                <h3 className="font-semibold text-sm">Enterprise Ready</h3>
              </div>
              <p className="text-xs text-muted-foreground">Compliance & security focused</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input Forms */}
          <div className="space-y-6">
            <UploadForm 
              onDocumentSubmit={handleDocumentSubmit}
              isLoading={isLoading}
            />
            
            <QuestionForm 
              onQuestionsSubmit={handleQuestionsSubmit}
              isLoading={isLoading}
              documentLoaded={!!documentUrl}
            />

            {/* Status */}
            {documentUrl && (
              <Card className="shadow-card border-success/20 bg-success/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-success text-success">
                      Document Ready
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {documentUrl.length > 50 ? `${documentUrl.substring(0, 50)}...` : documentUrl}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {isLoading ? (
              <Loader stage="analysis" message="Analyzing document with AI..." />
            ) : (
              <AnswerList results={results} isLoading={isLoading} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by advanced LLM technology with semantic search and clause matching
          </p>
        </div>
      </div>
    </div>
  );
};
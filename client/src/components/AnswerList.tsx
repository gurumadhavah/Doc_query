import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock, FileText, Search } from 'lucide-react';

interface AnalysisResult {
  questions: string[];
  answers: string[];
  processingTime?: number;
  documentUrl?: string;
}

interface AnswerListProps {
  results: AnalysisResult | null;
  isLoading: boolean;
}

export const AnswerList = ({ results, isLoading }: AnswerListProps) => {
  if (isLoading) {
    return (
      <Card className="w-full shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-warning to-warning/70 text-warning-foreground">
              <Search className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <CardTitle className="text-xl">Processing Analysis</CardTitle>
              <CardDescription>
                AI is analyzing your document and generating intelligent responses...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="w-full shadow-card border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Analysis Results</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Upload a document and submit your questions to see intelligent analysis results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-success to-success/70 text-success-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Analysis Results</CardTitle>
            <CardDescription>
              Intelligent document analysis with contextual answers
            </CardDescription>
          </div>
          {results.processingTime && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {results.processingTime}ms
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {results.questions.map((question, index) => {
              const answer = results.answers[index];
              return (
                <div key={index} className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        Q{index + 1}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground leading-relaxed">
                          {question}
                        </h4>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-12 space-y-2">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm leading-relaxed text-foreground">
                        {answer || "No answer available for this question."}
                      </p>
                    </div>
                  </div>
                  
                  {index < results.questions.length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {results.documentUrl && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Source:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {results.documentUrl.length > 60 
                  ? `${results.documentUrl.substring(0, 60)}...` 
                  : results.documentUrl
                }
              </code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
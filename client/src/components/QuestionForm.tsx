import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, X, Search } from 'lucide-react';

interface QuestionFormProps {
  onQuestionsSubmit: (questions: string[]) => void;
  isLoading: boolean;
  documentLoaded: boolean;
}

export const QuestionForm = ({ onQuestionsSubmit, isLoading, documentLoaded }: QuestionFormProps) => {
  const [questions, setQuestions] = useState<string[]>(['']);
  const [currentQuestion, setCurrentQuestion] = useState('');

  const addQuestion = () => {
    if (currentQuestion.trim()) {
      const newQuestions = [...questions];
      newQuestions[newQuestions.length - 1] = currentQuestion.trim();
      newQuestions.push('');
      setQuestions(newQuestions);
      setCurrentQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    if (newQuestions.length === 0) {
      newQuestions.push('');
    }
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
    if (index === questions.length - 1) {
      setCurrentQuestion(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validQuestions = questions.filter(q => q.trim()).map(q => q.trim());
    if (validQuestions.length > 0) {
      onQuestionsSubmit(validQuestions);
    }
  };

  const sampleQuestions = [
    "What is the grace period for premium payment?",
    "What are the waiting periods for pre-existing diseases?",
    "Does this policy cover maternity expenses?",
    "What is the extent of coverage for surgical procedures?"
  ];

  const addSampleQuestion = (question: string) => {
    const newQuestions = [...questions];
    if (newQuestions[newQuestions.length - 1] === '') {
      newQuestions[newQuestions.length - 1] = question;
    } else {
      newQuestions.push(question);
    }
    setQuestions(newQuestions);
  };

  return (
    <Card className="w-full shadow-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary text-accent-foreground">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Query Analysis</CardTitle>
            <CardDescription>
              Enter your questions about the document for intelligent analysis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!documentLoaded && (
          <div className="rounded-lg border border-warning bg-warning/5 p-3">
            <p className="text-sm text-warning-foreground">
              Please upload a document first before adding questions.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Sample Questions</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => addSampleQuestion(question)}
                disabled={!documentLoaded || isLoading}
                className="text-xs h-auto py-2 px-3"
              >
                <Plus className="mr-1 h-3 w-3" />
                {question}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Your Questions</Label>
            {questions.map((question, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder={`Question ${index + 1}...`}
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    className="min-h-[60px] resize-none"
                    disabled={!documentLoaded || isLoading}
                  />
                </div>
                {questions.length > 1 && question !== '' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    disabled={isLoading}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              disabled={!currentQuestion.trim() || !documentLoaded || isLoading}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
            <Button
              type="submit"
              disabled={questions.filter(q => q.trim()).length === 0 || !documentLoaded || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Search className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Document
                </>
              )}
            </Button>
          </div>

          {questions.filter(q => q.trim()).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Questions to be analyzed:</Label>
              <div className="flex flex-wrap gap-2">
                {questions.filter(q => q.trim()).map((question, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {question.length > 50 ? `${question.substring(0, 50)}...` : question}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
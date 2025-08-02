import { Card, CardContent } from '@/components/ui/card';
import { Brain, Zap, FileSearch, CheckCircle2 } from 'lucide-react';

interface LoaderProps {
  stage?: 'upload' | 'parsing' | 'analysis' | 'complete';
  message?: string;
}

export const Loader = ({ stage = 'analysis', message }: LoaderProps) => {
  const stages = [
    { key: 'upload', icon: FileSearch, label: 'Processing Document', active: stage === 'upload' },
    { key: 'parsing', icon: Zap, label: 'Extracting Content', active: stage === 'parsing' },
    { key: 'analysis', icon: Brain, label: 'AI Analysis', active: stage === 'analysis' },
    { key: 'complete', icon: CheckCircle2, label: 'Complete', active: stage === 'complete' }
  ];

  return (
    <Card className="w-full max-w-md mx-auto shadow-card">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Processing Your Request</h3>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
          
          <div className="space-y-3">
            {stages.map((stageItem, index) => {
              const Icon = stageItem.icon;
              const isActive = stageItem.active;
              const isCompleted = stages.findIndex(s => s.active) > index;
              
              return (
                <div key={stageItem.key} className="flex items-center gap-3">
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors
                    ${isActive 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'border-success bg-success text-success-foreground'
                        : 'border-muted bg-background text-muted-foreground'
                    }
                  `}>
                    <Icon className={`h-4 w-4 ${isActive ? 'animate-spin' : ''}`} />
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {stageItem.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${(stages.findIndex(s => s.active) + 1) * 25}%` 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  isProcessing: boolean;
  progress: number;
  message: string;
}

export const ProgressBar = ({ isProcessing, progress, message }: ProgressBarProps) => {
  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h3 className="text-lg font-semibold">{message}</h3>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">
          {progress < 25 && "Uploading file..."}
          {progress >= 25 && progress < 50 && "Processing document..."}
          {progress >= 50 && progress < 75 && "AI is analyzing content..."}
          {progress >= 75 && progress < 100 && "Generating flashcards..."}
          {progress >= 100 && "Almost done..."}
        </p>
      </div>
    </div>
  );
};

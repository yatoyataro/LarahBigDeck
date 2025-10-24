import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { Card as CardType } from "@/services/deckService";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface MultipleChoiceProps {
  card: CardType;
  onAnswer: (correct: boolean) => void;
  isProcessing?: boolean;
}

export const MultipleChoice = ({ card, onAnswer, isProcessing = false }: MultipleChoiceProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Shuffle options every time the card changes
  const shuffledOptions = useMemo(() => {
    if (!card.options || card.options.length === 0) return [];
    
    // Create a copy of the options array
    const optionsCopy = [...card.options];
    
    // Fisher-Yates shuffle algorithm
    for (let i = optionsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsCopy[i], optionsCopy[j]] = [optionsCopy[j], optionsCopy[i]];
    }
    
    return optionsCopy;
  }, [card.id, card.options]); // Re-shuffle when card changes

  // Reset state when card changes
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
    setHasAnswered(false);
  }, [card.id]);

  const handleOptionClick = (option: string) => {
    if (showResult || hasAnswered) return;
    
    setSelectedOption(option);
    setShowResult(true);
  };

  const handleNext = () => {
    if (hasAnswered || isProcessing) return; // Prevent multiple clicks
    
    setHasAnswered(true);
    const isCorrect = selectedOption === card.options?.[0];
    onAnswer(isCorrect);
  };

  const getOptionClass = (option: string) => {
    if (!showResult) return "";
    
    const isCorrectAnswer = option === card.options?.[0];
    const isSelected = option === selectedOption;
    
    if (isCorrectAnswer) return "border-green-500 bg-green-500/10";
    if (isSelected && !isCorrectAnswer) return "border-red-500 bg-red-500/10";
    return "opacity-50";
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0">
      <Card className="gradient-card shadow-card p-3 sm:p-5 md:p-6 lg:p-8">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <div className="inline-block px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-2 sm:mb-3 md:mb-4">
            Multiple Choice
          </div>
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold leading-snug sm:leading-relaxed break-words px-1 sm:px-2">
            {card.question}
          </h3>
        </div>

        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          {shuffledOptions.map((option, index) => (
            <Button
              key={`${card.id}-${option}-${index}`}
              variant="outline"
              className={`
                w-full h-auto min-h-[3rem] sm:min-h-[3.5rem] md:min-h-[4rem]
                text-left justify-start
                p-2.5 sm:p-3 md:p-4 lg:p-5
                text-xs sm:text-sm md:text-base
                transition-all duration-200
                hover:scale-[1.01] active:scale-[0.99]
                ${getOptionClass(option)}
              `}
              onClick={() => handleOptionClick(option)}
              disabled={showResult}
            >
              <span className="flex items-start gap-2 sm:gap-2.5 md:gap-3 w-full">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold shadow-card mt-0.5">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 break-words text-left leading-relaxed py-1 whitespace-normal overflow-wrap-anywhere hyphens-auto">
                  {option}
                </span>
                {showResult && option === card.options?.[0] && (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                {showResult && option === selectedOption && option !== card.options?.[0] && (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 flex-shrink-0 mt-0.5" />
                )}
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {showResult && !hasAnswered && (
        <div className="flex justify-center px-2 sm:px-0">
          <Button 
            onClick={handleNext} 
            variant="gradient" 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] text-sm sm:text-base"
            disabled={hasAnswered || isProcessing}
          >
            <span className="mr-1.5 sm:mr-2">Next Question</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

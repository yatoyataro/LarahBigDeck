import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Card as CardType } from "@/services/deckService";
import { Check, X } from "lucide-react";

interface FlipCardProps {
  card: CardType;
  onAnswer?: (correct: boolean) => void;
  showAnswerButtons?: boolean;
  isProcessing?: boolean;
}

export const FlipCard = ({ card, onAnswer, showAnswerButtons = false, isProcessing = false }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setButtonClicked(false);
  }, [card.id]);

  const handleFlip = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!buttonClicked) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleAnswer = (correct: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking buttons
    if (buttonClicked || isProcessing) return; // Prevent multiple clicks
    
    setButtonClicked(true);
    if (onAnswer) {
      onAnswer(correct);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div
        className="flip-card w-full cursor-pointer select-none"
        onClick={handleFlip}
        onTouchEnd={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsFlipped(!isFlipped);
          }
        }}
        aria-label={isFlipped ? "Flip to see question" : "Flip to see answer"}
      >
        <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Front of card */}
          <Card className="flip-card-front gradient-card shadow-card p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
            <div className="text-center w-full px-2">
              <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                Question
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed break-words">
                {card.question}
              </h3>
              <p className="text-muted-foreground mt-4 sm:mt-6 md:mt-8 text-xs sm:text-sm">
                {typeof window !== 'undefined' && 'ontouchstart' in window 
                  ? 'Tap to reveal answer' 
                  : 'Click to reveal answer'}
              </p>
            </div>
          </Card>

          {/* Back of card */}
          <Card className="flip-card-back gradient-primary shadow-card-hover p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
            <div className="text-center w-full px-2">
              <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                Answer
              </div>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-primary-foreground leading-relaxed break-words">
                {card.answer}
              </p>
              <p className="text-primary-foreground/70 mt-4 sm:mt-6 md:mt-8 text-xs sm:text-sm">
                {typeof window !== 'undefined' && 'ontouchstart' in window 
                  ? 'Tap to flip back' 
                  : 'Click to flip back'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Answer buttons - only show when flipped and showAnswerButtons is true */}
      {showAnswerButtons && isFlipped && !buttonClicked && (
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={(e) => handleAnswer(false, e)}
            disabled={buttonClicked || isProcessing}
            className="flex-1 sm:flex-none border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-600 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="ml-1 sm:ml-2">Incorrect</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={(e) => handleAnswer(true, e)}
            disabled={buttonClicked || isProcessing}
            className="flex-1 sm:flex-none border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-600 hover:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="ml-1 sm:ml-2">Correct</span>
          </Button>
        </div>
      )}
    </div>
  );
};

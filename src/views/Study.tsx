import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlipCard } from "@/components/FlipCard";
import { MultipleChoice } from "@/components/MultipleChoice";
import { CardEditor } from "@/components/CardEditor";
import { DeckStatsCard } from "@/components/stats/DeckStatsCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowRight, RotateCw, ListChecks, Flag, Star, Shuffle, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import * as deckService from "@/services/deckService";
import * as statsService from "@/services/statsService";
import { useAuth } from "@/hooks/useAuth";

const Study = () => {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [deck, setDeck] = useState<deckService.Deck | null>(null);
  const [deckCards, setDeckCards] = useState<deckService.Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyMode, setStudyMode] = useState<"flip" | "multiple">("flip");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isStudying, setIsStudying] = useState(false);
  const [flaggedCards, setFlaggedCards] = useState<Set<string>>(new Set());
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [filteredCards, setFilteredCards] = useState<deckService.Card[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);

  // Fetch deck and cards on mount
  useEffect(() => {
    async function loadDeckData() {
      if (!deckId) {
        setError('No deck ID provided');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('Please log in to view this deck');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch deck details
        const deckData = await deckService.getDeck(deckId);
        if (!deckData) {
          setError('Deck not found');
          setLoading(false);
          return;
        }
        setDeck(deckData);

        // Fetch cards for the deck
        const cards = await deckService.getDeckCards(deckId);
        setDeckCards(cards);
        setFilteredCards(cards);

        setLoading(false);
      } catch (err) {
        console.error('Error loading deck:', err);
        setError(err instanceof Error ? err.message : 'Failed to load deck');
        setLoading(false);
      }
    }

    loadDeckData();
  }, [deckId, user]);

  const currentCard = filteredCards[currentCardIndex];
  const progress = filteredCards.length > 0 ? ((currentCardIndex + 1) / filteredCards.length) * 100 : 0;

  // Filter cards when showFlaggedOnly or studyMode changes
  useEffect(() => {
    let filtered = deckCards;
    
    // First filter by study mode if in multiple choice
    if (studyMode === "multiple") {
      filtered = filtered.filter(card => 
        card.card_type === 'multiple_choice' && card.options && card.options.length > 0
      );
    }
    
    // Then apply flagged filter if enabled
    if (showFlaggedOnly) {
      filtered = filtered.filter(card => flaggedCards.has(card.id));
      if (filtered.length === 0) {
        toast({
          title: "No flagged cards",
          description: `No flagged ${studyMode === "multiple" ? "multiple choice " : ""}cards to review.`,
        });
      }
    }
    
    setFilteredCards(filtered);
    setCurrentCardIndex(0);
  }, [showFlaggedOnly, studyMode, deckCards, flaggedCards]);

  // Complete session on component unmount or page leave
  useEffect(() => {
    const completeCurrentSession = async () => {
      if (sessionId) {
        try {
          await statsService.completeStudySession(sessionId);
          console.log('Session completed:', sessionId);
        } catch (error) {
          console.error('Error completing session on cleanup:', error);
        }
      }
    };

    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      if (sessionId) {
        // Use sendBeacon for reliable async request on page unload
        const url = `http://localhost:3001/api/sessions/${sessionId}/beacon`;
        const blob = new Blob(
          [JSON.stringify({ completed_at: new Date().toISOString() })],
          { type: 'application/json' }
        );
        
        if (navigator.sendBeacon) {
          const sent = navigator.sendBeacon(url, blob);
          console.log('Session completion sent via beacon:', sent);
        }
      }
    };

    // Handle visibility change (tab switching) - but don't complete, just track
    let visibilityStartTime = Date.now();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityStartTime = Date.now();
      } else {
        // Tab became visible again
        const hiddenDuration = Date.now() - visibilityStartTime;
        // If tab was hidden for more than 5 minutes, complete the session
        if (hiddenDuration > 5 * 60 * 1000 && sessionId) {
          completeCurrentSession();
        }
      }
    };

    // Add event listeners only when studying
    if (isStudying && sessionId) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup function - runs when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Complete session when component unmounts (e.g., navigate away)
      if (sessionId && isStudying) {
        completeCurrentSession();
      }
    };
  }, [sessionId, isStudying]);

  // Start study session
  const handleStartStudying = async () => {
    setIsStudying(true);
    setSessionStartTime(Date.now());
    
    // Start tracking session
    try {
      const session = await statsService.startStudySession(
        deckId!,
        studyMode === 'flip' ? 'flashcard' : 'multiple_choice'
      );
      setSessionId(session.session_id);
    } catch (error) {
      console.error('Error starting session:', error);
      // Continue anyway even if session tracking fails
    }
  };

  // Handle card navigation with animation
  const handleNext = async () => {
    if (isProcessingAnswer) return; // Prevent multiple rapid clicks
    
    if (currentCardIndex < filteredCards.length - 1) {
      // Trigger exit animation and immediately move to next card
      setIsTransitioning(true);
      setCurrentCardIndex(currentCardIndex + 1);
      
      // Reset animation state after it completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    } else {
      // Session complete
      if (sessionId) {
        try {
          const result = await statsService.completeStudySession(sessionId);
          toast({
            title: "Study session complete! 🎉",
            description: `Accuracy: ${result.accuracy}% • Time: ${result.duration_minutes} min`,
          });
        } catch (error) {
          console.error('Error completing session:', error);
        }
      } else {
        toast({
          title: "Deck complete! 🎉",
          description: `Score: ${score.correct}/${score.total}`,
        });
      }
      setIsStudying(false);
      setSessionId(null);
    }
  };

  // Handle answer in flip card mode
  const handleFlipCardAnswer = async (correct: boolean) => {
    if (isProcessingAnswer) return; // Prevent multiple clicks
    
    setIsProcessingAnswer(true);
    
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));

    // Update card stats in backend (non-blocking)
    if (currentCard) {
      statsService.updateCardStats(currentCard.id, {
        correct,
        sessionId: sessionId || undefined,
        responseTime: sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : undefined,
        interactionType: 'flip'
      }).catch(error => console.error('Error updating card stats:', error));
    }

    // Immediately advance to next card
    handleNext();
    
    // Reset processing state after animation
    setTimeout(() => {
      setIsProcessingAnswer(false);
    }, 200);
  };

  // Handle answer in multiple choice mode
  const handleMultipleChoiceAnswer = async (correct: boolean) => {
    if (isProcessingAnswer) return; // Prevent multiple clicks
    
    setIsProcessingAnswer(true);
    
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }));

    // Update card stats in backend (non-blocking)
    if (currentCard) {
      statsService.updateCardStats(currentCard.id, {
        correct,
        sessionId: sessionId || undefined,
        responseTime: sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : undefined,
        interactionType: 'multiple_choice'
      }).catch(error => console.error('Error updating card stats:', error));
    }

    // Immediately advance to next card
    handleNext();
    
    // Reset processing state after animation
    setTimeout(() => {
      setIsProcessingAnswer(false);
    }, 200);
  };

  // Toggle flag for current card
  const handleToggleFlag = async () => {
    if (!currentCard) return;

    const newFlaggedState = !flaggedCards.has(currentCard.id);
    const newFlaggedCards = new Set(flaggedCards);
    
    if (newFlaggedState) {
      newFlaggedCards.add(currentCard.id);
      toast({
        title: "Card flagged",
        description: "Card flagged for review",
      });
    } else {
      newFlaggedCards.delete(currentCard.id);
      toast({
        title: "Card unflagged",
      });
    }
    
    setFlaggedCards(newFlaggedCards);

    // Update flag status in backend
    try {
      await statsService.toggleCardFlag(currentCard.id, newFlaggedState);
    } catch (error) {
      console.error('Error toggling flag:', error);
      // Revert on error
      setFlaggedCards(flaggedCards);
      toast({
        title: "Error",
        description: "Failed to update flag status",
        variant: "destructive",
      });
    }
  };

  // Delete deck with all associated data
  const handleDeleteDeck = async () => {
    if (!deckId) return;

    try {
      setDeleting(true);
      
      await deckService.deleteDeck(deckId);
      
      toast({
        title: "Deck deleted",
        description: "Deck and all associated data have been permanently removed",
      });
      
      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast({
        title: "Error deleting deck",
        description: error instanceof Error ? error.message : "Failed to delete deck",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Shuffle flagged cards
  const handleShuffleFlagged = () => {
    if (showFlaggedOnly && filteredCards.length > 0) {
      const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
      setFilteredCards(shuffled);
      setCurrentCardIndex(0);
      toast({
        title: "Cards shuffled!",
        description: "Flagged cards have been shuffled",
      });
    }
  };

  const handleCardsUpdate = (updatedCards: deckService.Card[]) => {
    setDeckCards(updatedCards);
    if (!showFlaggedOnly) {
      setFilteredCards(updatedCards);
    }
  };

  const toggleMode = () => {
    const newMode = studyMode === "flip" ? "multiple" : "flip";
    
    // Check if there are multiple choice cards before switching
    if (newMode === "multiple") {
      const multipleChoiceCards = deckCards.filter(card => 
        card.card_type === 'multiple_choice' && card.options && card.options.length > 0
      );
      
      if (multipleChoiceCards.length === 0) {
        toast({
          title: "No multiple choice cards",
          description: "This deck doesn't have any multiple choice cards. Add some in the editor!",
          variant: "destructive"
        });
        return;
      }
    }
    
    setStudyMode(newMode);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center flex-1">
          <p className="text-muted-foreground">Loading deck...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !deck) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center flex-1">
          <p className="text-muted-foreground">{error || 'Deck not found'}</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            {/* Delete Deck Button with Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Deck"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the deck
                    <span className="font-semibold"> "{deck.name}"</span>, all{" "}
                    <span className="font-semibold">{deckCards.length} card{deckCards.length !== 1 ? 's' : ''}</span>,
                    and any associated files from storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteDeck}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {!isStudying ? (
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold">{deck.name}</h2>
                <p className="text-muted-foreground mt-1">{deck.description || 'No description'}</p>
              </div>

              {/* Deck Statistics */}
              <div className="mb-6">
                <DeckStatsCard deckId={deckId!} compact />
              </div>

              {/* Card Editor */}
              <CardEditor 
                deckId={deckId!}
                cards={deckCards} 
                onCardsUpdate={handleCardsUpdate}
                onStartStudying={handleStartStudying}
              />
            </div>
          ) : (
            <>
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                  <div className="w-full sm:w-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold">{deck.name}</h2>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                      Card {currentCardIndex + 1} of {filteredCards.length}
                      {showFlaggedOnly && ` (Flagged only)`}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleToggleFlag}
                      className={`${flaggedCards.has(currentCard?.id) ? "bg-yellow-500/10 border-yellow-500" : ""} w-full sm:w-auto text-xs sm:text-sm`}
                    >
                      {flaggedCards.has(currentCard?.id) ? (
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      <span className="ml-1 sm:ml-2">
                        {flaggedCards.has(currentCard?.id) ? "Flagged" : "Flag for review"}
                      </span>
                    </Button>
                    <Button variant="outline" onClick={toggleMode} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                      {studyMode === "flip" ? <ListChecks className="h-3 w-3 sm:h-4 sm:w-4" /> : <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />}
                      <span className="ml-1 sm:ml-2">
                        {studyMode === "flip" ? "Multiple Choice" : "Flip Mode"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="flagged-only"
                      checked={showFlaggedOnly}
                      onCheckedChange={setShowFlaggedOnly}
                    />
                    <Label htmlFor="flagged-only" className="cursor-pointer text-xs sm:text-sm">
                      Show flagged cards only ({flaggedCards.size})
                    </Label>
                  </div>
                  
                  {showFlaggedOnly && filteredCards.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShuffleFlagged}
                      className="w-full sm:w-auto"
                    >
                      <Shuffle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="ml-1 sm:ml-2">Shuffle</span>
                    </Button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary transition-smooth"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {score.total > 0 && (
                  <div className="mt-4 text-center">
                    <Card className="inline-block px-6 py-3 gradient-card shadow-card">
                      <p className="text-sm font-medium">
                        Score: <span className="text-primary font-bold">{score.correct}/{score.total}</span>
                        {score.total > 0 && (
                          <span className="text-muted-foreground ml-2">
                            ({Math.round((score.correct / score.total) * 100)}%)
                          </span>
                        )}
                      </p>
                    </Card>
                  </div>
                )}
              </div>

              {filteredCards.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-4">
                    No flagged cards to review.
                  </p>
                  <Button onClick={() => setShowFlaggedOnly(false)}>
                    Show all cards
                  </Button>
                </div>
              ) : (
                <>
                  <div 
                    key={currentCard?.id || currentCardIndex}
                    className={`mb-8 ${isTransitioning ? 'card-exit' : 'card-enter'}`}
                  >
                    {studyMode === "flip" ? (
                      <FlipCard 
                        card={currentCard} 
                        onAnswer={handleFlipCardAnswer}
                        showAnswerButtons={true}
                        isProcessing={isProcessingAnswer}
                      />
                    ) : (
                      <MultipleChoice 
                        card={currentCard} 
                        onAnswer={handleMultipleChoiceAnswer}
                        isProcessing={isProcessingAnswer}
                      />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Study;

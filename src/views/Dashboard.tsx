import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen, Calendar, PackageOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { getUserDecks, type DeckWithCardCount } from "@/services/deckService";
import { useToast } from "@/hooks/use-toast";
import { UserStatsOverview } from "@/components/stats/UserStatsOverview";
import { supabase } from "@/utils/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [decks, setDecks] = useState<DeckWithCardCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('OAuth callback error:', error);
            toast({
              title: "Authentication failed",
              description: error.message,
              variant: "destructive",
            });
          } else if (data.session) {
            toast({
              title: "Welcome!",
              description: "You have successfully signed in with Google.",
            });
          }
        } catch (err: any) {
          console.error('OAuth exchange error:', err);
          toast({
            title: "Error",
            description: "An unexpected error occurred during sign in.",
            variant: "destructive",
          });
        } finally {
          // Clean up URL by removing the code parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleOAuthCallback();
  }, [toast]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDecks();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
      setDecks([]);
    }
  }, [isAuthenticated, authLoading]);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const userDecks = await getUserDecks();
      setDecks(userDecks);
    } catch (error) {
      console.error('Error loading decks:', error);
      toast({
        title: "Error loading decks",
        description: "Failed to load your decks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
        <PackageOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center">No Decks Yet</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4 sm:mb-6 text-sm sm:text-base px-2">
        You haven't created any flashcard decks yet. Get started by uploading your first deck!
      </p>
      <Button 
        variant="gradient" 
        size="lg"
        onClick={() => navigate("/upload")}
        className="w-full sm:w-auto"
      >
        <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
        Upload Your First Deck
      </Button>
    </div>
  );

  const renderLoginPrompt = () => (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
        <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-2 text-center">Welcome to LarahBigDeck</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4 sm:mb-6 text-sm sm:text-base px-2">
        Please log in to view and manage your flashcard decks.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 flex-1">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            {isAuthenticated && user ? `Welcome back, ${user.email?.split('@')[0]}!` : 'My Decks'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {isAuthenticated 
              ? 'Select a deck to start studying or create a new one'
              : 'Log in to access your flashcard decks'}
          </p>
        </div>

        {!isAuthenticated && !authLoading && renderLoginPrompt()}

        {isAuthenticated && (
          <>
            {/* User Statistics Overview */}
            <div className="mb-6 sm:mb-8">
              <UserStatsOverview />
            </div>

            <div className="mb-4 sm:mb-6">
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => navigate("/upload")}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Upload New Deck
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 sm:py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-muted-foreground text-sm sm:text-base">Loading your decks...</p>
                </div>
              </div>
            ) : decks.length === 0 ? (
              renderEmptyState()
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {decks.map((deck) => (
                  <Card
                    key={deck.id}
                    className="p-4 sm:p-5 md:p-6 gradient-card shadow-card hover:shadow-card-hover transition-smooth cursor-pointer group active:scale-95 sm:active:scale-100"
                    onClick={() => navigate(`/study/${deck.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg gradient-primary flex items-center justify-center shadow-card group-hover:scale-110 transition-smooth">
                        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{new Date(deck.created_at).toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(deck.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 group-hover:text-primary transition-smooth line-clamp-2">
                      {deck.name}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                      {deck.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border">
                      <span className="text-xs sm:text-sm font-medium">
                        {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
                      </span>
                      <span className="text-xs sm:text-sm text-primary font-medium group-hover:underline">
                        Study →
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;

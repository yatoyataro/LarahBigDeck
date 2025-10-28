import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import * as sharingService from "@/services/sharingService";
import { Loader2, Share2, UserCircle, Calendar, BookOpen, CheckCircle } from "lucide-react";

const SharedDeck = () => {
  const navigate = useNavigate();
  const { shareToken } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyAdded, setAlreadyAdded] = useState(false);

  useEffect(() => {
    async function loadShareInfo() {
      if (!shareToken) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const info = await sharingService.getShareByToken(shareToken);
        
        if (!info) {
          setError('This share link is invalid or has expired');
          setLoading(false);
          return;
        }

        setShareInfo(info);
        setLoading(false);
      } catch (err) {
        console.error('Error loading share info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shared deck');
        setLoading(false);
      }
    }

    loadShareInfo();
  }, [shareToken]);

  const handleAddToDashboard = async () => {
    if (!user) {
      // Redirect to login with return URL
      toast({
        title: "Sign in required",
        description: "Please sign in to add this deck to your dashboard",
      });
      // Store the share token in localStorage to redirect back after login
      localStorage.setItem('pending_share_token', shareToken || '');
      navigate('/');
      return;
    }

    try {
      setAdding(true);
      await sharingService.addSharedDeck(shareToken!);
      
      setAlreadyAdded(true);
      toast({
        title: "Deck added! 🎉",
        description: "This deck has been added to your dashboard",
      });

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error adding shared deck:', err);
      
      if (err instanceof Error && err.message.includes('already has access')) {
        setAlreadyAdded(true);
        toast({
          title: "Already added",
          description: "You already have access to this deck",
        });
      } else {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to add deck',
          variant: "destructive",
        });
      }
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading shared deck...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !shareInfo) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full p-8 text-center">
            <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Link Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'This share link is invalid or has expired'}
            </p>
            <Button onClick={() => navigate('/')} variant="gradient">
              Go to Dashboard
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
            >
              ← Back to Dashboard
            </Button>
          </div>

          <Card className="gradient-card shadow-card p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Share2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{shareInfo.deck.name}</h1>
                {shareInfo.deck.description && (
                  <p className="text-muted-foreground mb-4">
                    {shareInfo.deck.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span>Shared by <span className="font-medium">{shareInfo.deck.owner_name}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{shareInfo.deck.card_count} cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Shared {new Date(shareInfo.share.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {alreadyAdded ? (
              <div className="flex items-center justify-center gap-2 py-4 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Deck added to your dashboard!</span>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-6">
                  Add this deck to your dashboard to start studying. You'll be able to view all cards
                  and track your progress, but you won't be able to edit the cards.
                </p>
                
                <Button
                  onClick={handleAddToDashboard}
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={adding}
                >
                  {adding ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Adding deck...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-5 w-5" />
                      {user ? 'Add to My Dashboard' : 'Sign In to Add Deck'}
                    </>
                  )}
                </Button>

                {!user && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    You'll be prompted to sign in or create an account
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">What you can do with this deck:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Study all cards using flashcard or multiple choice mode</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Track your personal progress and statistics</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Flag cards for review</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Access the deck anytime from your dashboard</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SharedDeck;

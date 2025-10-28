import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Loader2, Link2Off } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import * as sharingService from "@/services/sharingService";

interface ShareButtonProps {
  deckId: string;
  deckName: string;
}

export const ShareButton = ({ deckId, deckName }: ShareButtonProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (open) {
      loadShareLink();
    }
  }, [open, deckId]);

  const loadShareLink = async () => {
    try {
      setLoading(true);
      const existingLink = await sharingService.getShareLink(deckId);
      setShareUrl(existingLink);
    } catch (error) {
      console.error('Error loading share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShareLink = async () => {
    try {
      setLoading(true);
      const result = await sharingService.createShareLink(deckId);
      setShareUrl(result.share_url);
      toast({
        title: "Share link created! 🎉",
        description: "Anyone with this link can add your deck to their dashboard",
      });
    } catch (error) {
      console.error('Error creating share link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create share link',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({
          title: "Link copied!",
          description: "Share link has been copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy the link manually",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeactivateLink = async () => {
    try {
      setDeactivating(true);
      await sharingService.deactivateShareLink(deckId);
      setShareUrl(null);
      toast({
        title: "Share link deactivated",
        description: "The link will no longer work for new users",
      });
    } catch (error) {
      console.error('Error deactivating share link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to deactivate link',
        variant: "destructive",
      });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Share "{deckName}"</DialogTitle>
          <DialogDescription>
            Create a shareable link that allows others to add this deck to their dashboard.
            They'll be able to study the cards but won't be able to edit them.
          </DialogDescription>
        </DialogHeader>

        {loading && !shareUrl ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : shareUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  disabled={copied}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can add your deck to their dashboard.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDeactivateLink}
                disabled={deactivating}
                className="w-full sm:w-auto"
              >
                {deactivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Link2Off className="h-4 w-4 mr-2" />
                    Deactivate Link
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="gradient"
                onClick={handleCopyLink}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-medium mb-2">What happens when you share?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Others can study your cards</li>
                <li>✓ They track their own progress separately</li>
                <li>✗ They cannot edit or delete cards</li>
                <li>✗ Your statistics remain private</li>
              </ul>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="gradient"
                onClick={handleCreateShareLink}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating link...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, FileText, ArrowLeft, Plus, Trash2, ClipboardPaste } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createDeckWithCards, uploadFile, processUploadWithAI, processNotesWithAI, type CardInput } from "@/services/uploadService";
import { useAuth } from "@/hooks/useAuth";
import { ProgressBar } from "@/components/ui/progress-bar";
import { convertDocxToPdf } from "@/lib/docxToPdf";

interface ManualCard {
  id: string;
  question: string;
  answer: string;
  options: string[];
}

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
  // Form state
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  
  const [manualCards, setManualCards] = useState<ManualCard[]>([
    { id: "1", question: "", answer: "", options: ["", "", "", ""] }
  ]);
  
  // Paste Notes state
  const [pastedNotes, setPastedNotes] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        setFileName(file.name);
        setSelectedFile(file);
        toast({
          title: "File selected",
          description: `"${file.name}" is ready to upload`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file only",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        setFileName(file.name);
        setSelectedFile(file);
        toast({
          title: "File selected",
          description: `"${file.name}" is ready to upload`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file only",
          variant: "destructive",
        });
      }
    }
  };

  const addManualCard = () => {
    setManualCards([...manualCards, { id: Date.now().toString(), question: "", answer: "", options: ["", "", "", ""] }]);
  };

  const removeManualCard = (index: number) => {
    setManualCards(manualCards.filter((_, i) => i !== index));
  };

  const updateManualCard = (index: number, field: 'question' | 'answer', value: string) => {
    const newCards = [...manualCards];
    newCards[index] = { ...newCards[index], [field]: value };
    setManualCards(newCards);
  };

  const updateManualCardOption = (cardIndex: number, optionIndex: number, value: string) => {
    const newCards = [...manualCards];
    const newOptions = [...newCards[cardIndex].options];
    newOptions[optionIndex] = value;
    newCards[cardIndex] = { ...newCards[cardIndex], options: newOptions };
    setManualCards(newCards);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload a deck",
        variant: "destructive",
      });
      return;
    }

    if (!deckTitle.trim()) {
      toast({
        title: "Deck title required",
        description: "Please enter a title for your deck",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setProgress(10);
      setProgressMessage("Preparing file...");
      
      let fileToUpload = selectedFile;
      
      // Check if file is DOCX and convert to PDF
      if (selectedFile.name.endsWith('.docx')) {
        setProgressMessage("Converting DOCX to PDF...");
        setProgress(20);
        
        try {
          const pdfBlob = await convertDocxToPdf(selectedFile);
          const pdfFileName = selectedFile.name.replace('.docx', '.pdf');
          fileToUpload = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
          
          toast({
            title: "Conversion successful",
            description: "DOCX file converted to PDF",
          });
        } catch (error) {
          console.error('DOCX conversion error:', error);
          toast({
            title: "Conversion failed",
            description: "Failed to convert DOCX to PDF. Please try uploading a PDF file instead.",
            variant: "destructive",
          });
          setLoading(false);
          setProgress(0);
          return;
        }
      }
      
      // Step 1: Upload file
      setProgressMessage("Uploading file to storage...");
      setProgress(30);
      
      const { deck, upload } = await uploadFile(fileToUpload, deckTitle, deckDescription);
      
      if (!upload) {
        throw new Error('Upload failed - no upload record created');
      }
      
      // Step 2: Process with AI
      setProgressMessage("AI is analyzing your document...");
      setProgress(50);
      
      // Simulate progress during AI processing
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 1000);
      
      const result = await processUploadWithAI((upload as any).id);
      
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage("Finalizing...");
      
      toast({
        title: "Success! 🎉",
        description: `Created ${result.cards_created} flashcards from your document`,
      });
      
      // Navigate to the deck
      setTimeout(() => {
        navigate(`/study/${(deck as any).id}`);
      }, 500);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload deck. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a deck",
        variant: "destructive",
      });
      return;
    }

    if (!deckTitle.trim()) {
      toast({
        title: "Deck title required",
        description: "Please enter a title for your deck",
        variant: "destructive",
      });
      return;
    }

    // Validate cards
    const validCards: CardInput[] = [];
    for (let i = 0; i < manualCards.length; i++) {
      const card = manualCards[i];
      if (!card.question.trim() || !card.answer.trim()) {
        toast({
          title: "Invalid card",
          description: `Card ${i + 1} must have both a question and answer`,
          variant: "destructive",
        });
        return;
      }

      // Check if all options are filled for multiple choice
      const filledOptions = card.options.filter(opt => opt.trim().length > 0);
      if (filledOptions.length > 0 && filledOptions.length < 2) {
        toast({
          title: "Invalid options",
          description: `Card ${i + 1} must have at least 2 options for multiple choice`,
          variant: "destructive",
        });
        return;
      }

      validCards.push({
        question: card.question.trim(),
        answer: card.answer.trim(),
        card_type: filledOptions.length >= 2 ? 'multiple_choice' : 'flashcard',
        options: filledOptions.length >= 2 ? filledOptions : undefined,
        correct_option_index: filledOptions.length >= 2 ? 0 : undefined,
      });
    }

    try {
      setLoading(true);
      await createDeckWithCards({
        name: deckTitle,
        description: deckDescription,
        cards: validCards,
      });
      
      toast({
        title: "Success!",
        description: `Deck "${deckTitle}" created with ${validCards.length} cards`,
      });
      
      navigate("/");
    } catch (error: any) {
      console.error('Create deck error:', error);
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create deck. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasteNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a deck",
        variant: "destructive",
      });
      return;
    }

    if (!deckTitle.trim()) {
      toast({
        title: "Deck title required",
        description: "Please enter a title for your deck",
        variant: "destructive",
      });
      return;
    }

    if (!pastedNotes.trim()) {
      toast({
        title: "Notes required",
        description: "Please paste your notes to generate flashcards",
        variant: "destructive",
      });
      return;
    }

    if (pastedNotes.trim().length < 50) {
      toast({
        title: "Notes too short",
        description: "Please provide at least 50 characters of notes",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setProgress(20);
      setProgressMessage("Analyzing your notes...");
      
      // Simulate progress during AI processing
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 1000);
      
      const result = await processNotesWithAI(pastedNotes, deckTitle, deckDescription);
      
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage("Finalizing...");
      
      toast({
        title: "Success! 🎉",
        description: `Created ${result.cards_created} flashcards from your notes`,
      });
      
      // Navigate to the deck
      setTimeout(() => {
        navigate(`/study/${result.deck_id}`);
      }, 500);
    } catch (error: any) {
      console.error('Process notes error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <ProgressBar 
        isProcessing={loading} 
        progress={progress} 
        message={progressMessage} 
      />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Upload New Deck</h2>
          <p className="text-muted-foreground">Upload a PDF file to create a new study deck</p>
        </div>

        <Card className="p-6 gradient-card shadow-card mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Deck Title</Label>
              <Input
                id="title"
                placeholder="e.g., Computer Science 101"
                className="mt-2"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this deck covers..."
                className="mt-2 min-h-[100px]"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </Card>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={loading}>Upload File</TabsTrigger>
            <TabsTrigger value="paste" disabled={loading}>Paste Notes</TabsTrigger>
            <TabsTrigger value="manual" disabled={loading}>Create Manually</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <form onSubmit={handleFileUpload}>
              <Card
                className={`p-8 gradient-card shadow-card transition-smooth border-2 border-dashed ${
                  dragActive ? "border-primary bg-primary/5" : "border-border"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-card">
                    {fileName ? (
                      <FileText className="h-8 w-8 text-primary-foreground" />
                    ) : (
                      <UploadIcon className="h-8 w-8 text-primary-foreground" />
                    )}
                  </div>

                  {fileName ? (
                    <div>
                      <p className="text-lg font-semibold text-foreground">{fileName}</p>
                      <p className="text-sm text-muted-foreground mt-1">File ready to upload</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        Drag and drop your file here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">or</p>
                    </div>
                  )}

                  <div>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      {fileName ? "Choose Different File" : "Browse Files"}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOCX (Max 20MB)
                  </p>
                </div>
              </Card>

              <div className="flex gap-4 mt-6">
                <Button type="submit" variant="gradient" size="lg" className="flex-1" disabled={loading}>
                  <UploadIcon className="h-5 w-5" />
                  {loading ? "Processing with AI..." : "Upload & Generate Cards"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="paste" className="space-y-6">
            <form onSubmit={handlePasteNotesSubmit}>
              <Card className="p-8 gradient-card shadow-card">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-card">
                      <ClipboardPaste className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Paste Your Notes</h3>
                      <p className="text-sm text-muted-foreground">
                        AI will analyze your notes and generate flashcards automatically
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Your Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Paste your lecture notes, study materials, or any text content here...

Example:
• Photosynthesis is the process by which plants convert light energy into chemical energy
• It occurs in the chloroplasts of plant cells
• The main equation: 6CO2 + 6H2O + light → C6H12O6 + 6O2
• Chlorophyll is the green pigment that absorbs light..."
                      className="mt-2 min-h-[300px] font-mono text-sm"
                      value={pastedNotes}
                      onChange={(e) => setPastedNotes(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {pastedNotes.length} characters • Minimum 50 characters required
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold">💡 Tips for better results:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Include clear definitions and explanations</li>
                      <li>Use bullet points or numbered lists</li>
                      <li>Provide more context for better question quality</li>
                      <li>Include examples, facts, and key concepts</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="flex gap-4 mt-6">
                <Button type="submit" variant="gradient" size="lg" className="flex-1" disabled={loading || pastedNotes.trim().length < 50}>
                  <ClipboardPaste className="h-5 w-5" />
                  {loading ? "Generating Cards..." : "Generate Flashcards"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <form onSubmit={handleManualSubmit}>
              <div className="space-y-4">
                {manualCards.map((card, cardIndex) => (
                  <Card key={card.id} className="p-6 gradient-card shadow-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        Card {cardIndex + 1}
                      </div>
                      {manualCards.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeManualCard(cardIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`question-${cardIndex}`}>Question/Term</Label>
                        <Textarea
                          id={`question-${cardIndex}`}
                          placeholder="Enter the question or term"
                          value={card.question}
                          onChange={(e) => updateManualCard(cardIndex, "question", e.target.value)}
                          className="mt-2 min-h-[80px]"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor={`answer-${cardIndex}`}>Answer/Definition</Label>
                        <Textarea
                          id={`answer-${cardIndex}`}
                          placeholder="Enter the answer or definition"
                          value={card.answer}
                          onChange={(e) => updateManualCard(cardIndex, "answer", e.target.value)}
                          className="mt-2 min-h-[80px]"
                          required
                        />
                      </div>

                      <div>
                        <Label>Multiple Choice Options (First option will be the correct answer)</Label>
                        <div className="space-y-2 mt-2">
                          {card.options?.map((option, optionIndex) => (
                            <Input
                              key={optionIndex}
                              placeholder={`Option ${optionIndex + 1}${optionIndex === 0 ? ' (Correct Answer)' : ''}`}
                              value={option}
                              onChange={(e) => updateManualCardOption(cardIndex, optionIndex, e.target.value)}
                              required
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addManualCard}
                >
                  <Plus className="h-5 w-5" />
                  Add Another Card
                </Button>
              </div>

              <div className="flex gap-4 mt-6">
                <Button type="submit" variant="gradient" size="lg" className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Create Deck"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Upload;

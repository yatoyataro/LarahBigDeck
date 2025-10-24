import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload as UploadIcon, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import * as statsService from "@/services/statsService";

const Import = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deckName, setDeckName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'csv' | 'json'>('json');
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect format from file extension
      if (selectedFile.name.endsWith('.csv')) {
        setFormat('csv');
      } else if (selectedFile.name.endsWith('.json')) {
        setFormat('json');
      }
      
      // Auto-fill deck name from filename if empty
      if (!deckName) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setDeckName(nameWithoutExt.replace(/_/g, ' '));
      }
    }
  };

  const handleImport = async () => {
    if (!deckName.trim()) {
      toast({
        title: "Deck name required",
        description: "Please enter a deck name",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "File required",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await statsService.importDeck(
        deckName,
        file,
        description,
        format
      );

      toast({
        title: "Import successful! 🎉",
        description: `Imported ${result.imported.inserted} cards${
          result.imported.failed > 0 
            ? ` (${result.imported.failed} failed)` 
            : ''
        }`,
      });

      // Navigate to the new deck
      navigate(`/study/${result.deck.id}`);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import deck",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `question,answer,card_type,tags,option_1,option_2,option_3,option_4,correct_option_index
"What is React?","A JavaScript library for building user interfaces","flashcard","react;javascript","","","","",""
"What does JSX stand for?","JavaScript XML","multiple_choice","react","Java Syntax Extension","JSON XML","JavaScript Extra","",0
"What is a hook in React?","Functions that let you use state and lifecycle features","flashcard","react;hooks","","","","",""`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    statsService.downloadBlob(blob, 'sample_deck.csv');
    toast({
      title: "Download complete",
      description: "Sample CSV has been downloaded",
    });
  };

  const downloadSampleJSON = () => {
    const sampleJSON = {
      deck: {
        name: "Sample Deck",
        description: "A sample deck for import",
        created_at: new Date().toISOString()
      },
      cards: [
        {
          question: "What is React?",
          answer: "A JavaScript library for building user interfaces",
          card_type: "flashcard",
          tags: ["react", "javascript"]
        },
        {
          question: "What does JSX stand for?",
          answer: "JavaScript XML",
          card_type: "multiple_choice",
          options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript Extra"],
          correct_option_index: 0,
          tags: ["react"]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sampleJSON, null, 2)], { type: 'application/json' });
    statsService.downloadBlob(blob, 'sample_deck.json');
    toast({
      title: "Download complete",
      description: "Sample JSON has been downloaded",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Import Deck</h2>
            <p className="text-muted-foreground">
              Upload a CSV or JSON file to create a new deck with flashcards
            </p>
          </div>

          <Card className="p-6 gradient-card shadow-card mb-6">
            <div className="space-y-6">
              {/* Deck Name */}
              <div>
                <Label htmlFor="deck-name">Deck Name *</Label>
                <Input
                  id="deck-name"
                  placeholder="e.g., JavaScript Fundamentals"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this deck..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Format Selection */}
              <div>
                <Label>File Format</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant={format === 'json' ? 'default' : 'outline'}
                    onClick={() => setFormat('json')}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button
                    type="button"
                    variant={format === 'csv' ? 'default' : 'outline'}
                    onClick={() => setFormat('csv')}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="file-upload">Upload File *</Label>
                <div className="mt-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept={format === 'csv' ? '.csv' : '.json'}
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </div>

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={isImporting || !deckName || !file}
                className="w-full"
                variant="gradient"
                size="lg"
              >
                <UploadIcon className="h-5 w-5 mr-2" />
                {isImporting ? "Importing..." : "Import Deck"}
              </Button>
            </div>
          </Card>

          {/* Help Section */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Sample Files
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Not sure how to format your import file? Download a sample to see the expected format.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Sample CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleJSON}
              >
                <Download className="h-4 w-4 mr-2" />
                Sample JSON
              </Button>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <h4 className="font-semibold">CSV Format Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Required columns: question, answer</li>
                <li>Optional columns: card_type, tags, option_1-4, correct_option_index</li>
                <li>Use semicolon (;) to separate multiple tags</li>
                <li>Wrap values with commas in quotes</li>
              </ul>

              <h4 className="font-semibold mt-4">JSON Format Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Must contain a "cards" array</li>
                <li>Each card needs "question" and "answer" fields</li>
                <li>For multiple choice: include "options" array and "correct_option_index"</li>
                <li>Tags should be an array of strings</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Import;

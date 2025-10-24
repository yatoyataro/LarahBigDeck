import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card as CardType } from "@/services/deckService";
import { Trash2, Plus, Edit2, Save, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import * as cardService from "@/services/cardService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CardEditorProps {
  deckId: string;
  cards: CardType[];
  onCardsUpdate: (cards: CardType[]) => void;
  onStartStudying: () => void;
}

export const CardEditor = ({ deckId, cards, onCardsUpdate, onStartStudying }: CardEditorProps) => {
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedCard, setEditedCard] = useState<CardType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedCard({ ...cards[index] });
  };

  const handleSave = async () => {
    if (editingIndex !== null && editedCard) {
      try {
        setSaving(true);
        
        // Check if this is a new card (temporary ID) or existing
        const isNewCard = editedCard.id.startsWith('card-');
        
        if (isNewCard) {
          // Create new card
          const newCard = await cardService.createCard(deckId, {
            question: editedCard.question,
            answer: editedCard.answer,
            card_type: editedCard.card_type,
            options: editedCard.options,
            correct_option_index: editedCard.correct_option_index,
            tags: editedCard.tags,
            position: editedCard.position,
            difficulty: editedCard.difficulty,
            times_reviewed: 0,
            times_correct: 0,
          });
          
          const newCards = [...cards];
          newCards[editingIndex] = newCard;
          onCardsUpdate(newCards);
          
          toast({
            title: "Card created",
            description: "New card has been added to the deck",
          });
        } else {
          // Update existing card
          const updatedCard = await cardService.updateCard(editedCard.id, {
            question: editedCard.question,
            answer: editedCard.answer,
            card_type: editedCard.card_type,
            options: editedCard.options,
            correct_option_index: editedCard.correct_option_index,
            tags: editedCard.tags,
          });
          
          const newCards = [...cards];
          newCards[editingIndex] = updatedCard;
          onCardsUpdate(newCards);
          
          toast({
            title: "Card updated",
            description: "Your changes have been saved",
          });
        }
        
        setEditingIndex(null);
        setEditedCard(null);
      } catch (error) {
        console.error('Error saving card:', error);
        toast({
          title: "Error saving card",
          description: error instanceof Error ? error.message : "Failed to save changes",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditedCard(null);
  };

  const handleDelete = async (index: number) => {
    const card = cards[index];
    const isNewCard = card.id.startsWith('card-');
    
    if (isNewCard) {
      // Just remove from local state if it's a new unsaved card
      const newCards = cards.filter((_, i) => i !== index);
      onCardsUpdate(newCards);
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditedCard(null);
      }
      return;
    }
    
    try {
      setDeleting(card.id);
      
      await cardService.deleteCard(card.id);
      
      const newCards = cards.filter((_, i) => i !== index);
      onCardsUpdate(newCards);
      
      if (editingIndex === index) {
        setEditingIndex(null);
        setEditedCard(null);
      }
      
      toast({
        title: "Card deleted",
        description: "Card has been removed from the deck",
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error deleting card",
        description: error instanceof Error ? error.message : "Failed to delete card",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleAddCard = () => {
    const newCard: CardType = {
      id: `card-${Date.now()}`,
      deck_id: deckId,
      question: "",
      answer: "",
      card_type: 'flashcard',
      options: null,
      correct_option_index: null,
      tags: null,
      position: cards.length,
      difficulty: 2.5,
      times_reviewed: 0,
      times_correct: 0,
      created_at: new Date().toISOString()
    };
    onCardsUpdate([...cards, newCard]);
    setEditingIndex(cards.length);
    setEditedCard(newCard);
  };

  const updateOption = (index: number, value: string) => {
    if (editedCard?.options) {
      const newOptions = [...editedCard.options];
      newOptions[index] = value;
      setEditedCard({ ...editedCard, options: newOptions });
    }
  };

  const handleCardTypeChange = (newType: 'flashcard' | 'multiple_choice') => {
    if (!editedCard) return;
    
    if (newType === 'multiple_choice') {
      // Convert to multiple choice - initialize with 4 empty options if not exists
      setEditedCard({
        ...editedCard,
        card_type: 'multiple_choice',
        options: editedCard.options || ['', '', '', ''],
        correct_option_index: editedCard.correct_option_index ?? 0,
      });
    } else {
      // Convert to flashcard - keep options but set type
      setEditedCard({
        ...editedCard,
        card_type: 'flashcard',
      });
    }
  };

  const addOption = () => {
    if (!editedCard) return;
    const currentOptions = editedCard.options || [];
    setEditedCard({
      ...editedCard,
      options: [...currentOptions, ''],
    });
  };

  const removeOption = (index: number) => {
    if (!editedCard?.options) return;
    const newOptions = editedCard.options.filter((_, i) => i !== index);
    setEditedCard({
      ...editedCard,
      options: newOptions.length > 0 ? newOptions : null,
      correct_option_index: newOptions.length > 0 ? Math.min(editedCard.correct_option_index || 0, newOptions.length - 1) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Review & Edit Cards</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {cards.length} card{cards.length !== 1 ? 's' : ''} in this deck
          </p>
        </div>
        <Button onClick={onStartStudying} variant="gradient" size="lg">
          Start Studying
        </Button>
      </div>

      <div className="space-y-4">
        {cards.map((card, index) => (
          <Card key={card.id} className="p-6 gradient-card shadow-card">
            {editingIndex === index && editedCard ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`card-type-${index}`}>Card Type</Label>
                  <Select
                    value={editedCard.card_type}
                    onValueChange={(value) => handleCardTypeChange(value as 'flashcard' | 'multiple_choice')}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flashcard">Flashcard (Question & Answer)</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`question-${index}`}>Question/Term</Label>
                  <Textarea
                    id={`question-${index}`}
                    value={editedCard.question}
                    onChange={(e) => setEditedCard({ ...editedCard, question: e.target.value })}
                    className="mt-2 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label htmlFor={`answer-${index}`}>Answer/Definition</Label>
                  <Textarea
                    id={`answer-${index}`}
                    value={editedCard.answer}
                    onChange={(e) => setEditedCard({ ...editedCard, answer: e.target.value })}
                    className="mt-2 min-h-[80px]"
                  />
                </div>
                {editedCard.card_type === 'multiple_choice' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Multiple Choice Options</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addOption}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      First option is the correct answer. Add at least 2 options.
                    </p>
                    <div className="space-y-2">
                      {(editedCard.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <span className="text-sm font-medium min-w-[24px]">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          <Input
                            value={option}
                            onChange={(e) => updateOption(optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}${optIndex === 0 ? ' (Correct Answer)' : ''}`}
                            className="flex-1"
                          />
                          {(editedCard.options?.length || 0) > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(optIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Card {index + 1}
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        card.card_type === 'multiple_choice' 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                          : 'bg-green-500/10 text-green-600 dark:text-green-400'
                      }`}>
                        {card.card_type === 'multiple_choice' ? 'Multiple Choice' : 'Flashcard'}
                      </div>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{card.question}</h4>
                    <p className="text-muted-foreground">{card.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(index)}
                      disabled={editingIndex !== null}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(index)}
                      disabled={deleting === card.id || editingIndex !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting === card.id && "..."}
                    </Button>
                  </div>
                </div>
                {card.options && card.options.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-2">Multiple Choice Options:</p>
                    <ul className="space-y-1">
                      {card.options.map((option, optIndex) => (
                        <li key={optIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          {option}
                          {optIndex === 0 && <span className="text-green-500 text-xs">(Correct)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button onClick={handleAddCard} variant="outline" className="w-full" size="lg">
        <Plus className="h-5 w-5" />
        Add New Card
      </Button>
    </div>
  );
};

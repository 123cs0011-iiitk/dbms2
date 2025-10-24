import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import type { Entity, Relationship } from '../App';
import { generateDatabase } from '../services/api';
import { backendToFrontend } from '../utils/schemaTransform';

type PromptModalProps = {
  onClose: () => void;
  onGenerate: (entities: Entity[], relationships: Relationship[], sql: string, prompt?: string) => void;
};

export function PromptModal({ onClose, onGenerate }: PromptModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Call the real API
      const result = await generateDatabase(prompt, 'gemini');
      
      if (result.success) {
        // Transform backend schema to frontend format (now async with AI layout)
        const { entities, relationships } = await backendToFrontend(result.schema_data);
        
        setIsGenerating(false);
        toast.success('Schema generated successfully!');
        onGenerate(entities, relationships, result.sql, prompt);
      } else {
        throw new Error(result.message || 'Failed to generate schema');
      }
    } catch (error: any) {
      console.error('Error generating schema:', error);
      setIsGenerating(false);
      toast.error(error.message || 'Failed to generate schema. Please try again.');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#7aa2f7]" />
            Generate ERD with AI
          </DialogTitle>
          <DialogDescription>
            Describe your database schema and we'll generate the ER diagram and SQL for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a university database with students, courses, and enrollments. Students can enroll in multiple courses, and each enrollment should track the grade and semester."
              className="min-h-[150px]"
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Schema
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

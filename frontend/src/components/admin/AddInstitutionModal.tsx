'use client';

import { useState } from 'react';
import { Building, Save, X, Loader2 } from 'lucide-react';

import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AddInstitutionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddInstitutionModal({ onClose, onSuccess }: AddInstitutionModalProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // --- THIS IS THE FIX ---
      // Added `null` as the second argument to match the function's signature.
      await fetchWithAuth(`${API_URL}/v1/institutions`, {
        method: 'POST',
        body: JSON.stringify({ name, domain, logoUrl }),
      });
      onSuccess(); // Trigger refresh of institution list
      onClose();   // Close modal
    } catch (err: any) {
      setError(err.message || 'Failed to create institution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Add New Institution</CardTitle>
                    <CardDescription>Enter the details for the new institution.</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" type="button" onClick={onClose} className="flex-shrink-0">
                  <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">Institution Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., University of Technology"
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., uot.edu"
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
              <Input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !domain}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Institution'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserNameDialogProps {
  onNameSubmit: (name: string) => void;
}

export default function UserNameDialog({ onNameSubmit }: UserNameDialogProps) {
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('userName', name.trim());
      onNameSubmit(name.trim());
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome!</DialogTitle>
          <DialogDescription>
            Please enter your name to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter your name"
              required
              minLength={2}
              maxLength={50}
              autoFocus
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!name.trim()}
            >
              Continue
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
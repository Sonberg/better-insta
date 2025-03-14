'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from 'next/image';
import { useState } from 'react';

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  description: string;
}

export default function ImageDialog({
  isOpen,
  onClose,
  imageUrl,
  description,
}: ImageDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-fit p-0 border-none bg-transparent">
        <DialogHeader className="sr-only">
          <DialogTitle>{description}</DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 hover:scale-110 transition-all duration-200">
          <X className="h-5 w-5" />
        </DialogClose>
        <div className="relative w-[90vw] h-[90vh]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
            </div>
          )}
          <Image
            src={imageUrl}
            alt={description}
            fill
            className={`object-contain transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            sizes="90vw"
            priority
            onLoadingComplete={() => setIsLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 
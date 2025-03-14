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
          <Image
            src={imageUrl}
            alt={description}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 
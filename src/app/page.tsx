import UploadGallery from "@/components/UploadGallery";
import { Camera } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      <h1 className="flex items-center gap-3 text-4xl font-extrabold mx-4 mt-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
        <Camera className="w-12 h-12 text-orange-600" />
        BetterInsta
      </h1>
      <UploadGallery />
    </main>
  );
}

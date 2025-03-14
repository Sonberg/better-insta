import ImageGallery from '../components/ImageGallery';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl text-black font-extrabold text-center mb-8">Åre 2025</h1>
        <ImageGallery />
      </div>
    </main>
  );
}

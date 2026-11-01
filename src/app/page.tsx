import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductShowcase from "@/components/landing/ProductShowcase";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">
      {/* Premium ambient glow effects - adds depth without affecting functionality */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Main content - sits cleanly above the glow */}
      <div className="relative z-10">
        <Hero />
        <HowItWorks />
        <ProductShowcase />
        <Footer />
      </div>
    </main>
  );
}
import Header from "../../components/layout/Header/Header";
import { Features } from "../../components/sections/Features";
import { Hero } from "../../components/sections/Hero";

export default function Home() {
  return (
    <div className="bg-black">
      <Header />
      <main>
        <Hero />
        <Features />
      </main>
    </div>
  );
}

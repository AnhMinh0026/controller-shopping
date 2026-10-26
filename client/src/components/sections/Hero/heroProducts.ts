export interface HeroProduct {
  id: string;
  name: string;
  tagline: string;
  image: string;
}

export const HERO_PRODUCTS: readonly HeroProduct[] = [
  {
    id: "vader-5-pro",
    name: "VADER 5 PRO",
    tagline: "Flagship precision",
    image: "/images/products/vader-5-pro-showcase.png",
  },
  {
    id: "apex-5",
    name: "APEX 5",
    tagline: "Adaptive performance",
    image: "/images/products/apex-5-showcase.png",
  },
  {
    id: "dire-4",
    name: "DIRE 4",
    tagline: "Everyday control",
    image: "/images/products/dire-4-showcase.png",
  },
];


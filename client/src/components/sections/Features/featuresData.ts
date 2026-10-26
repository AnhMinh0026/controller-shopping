export interface Feature {
  id: string;
  title: string;
  imageSrc: string;
  /** Full Tailwind classes (kept literal so Tailwind can detect them). */
  className: string;
  titleColor?: string;
}

export const FEATURES: readonly Feature[] = [
  {
    id: "forceflex-joystick",
    title: "FORCEFLEX™ JOYSTICK",
    imageSrc: "/images/features/fet-1.webp",
    className: "md:col-span-12 md:row-span-2",
  },
  {
    id: "forceswitch-trigger",
    title: "FORCESWITCH™ TRIGGER",
    imageSrc: "/images/features/fet-2.webp",
    className: "md:col-span-6",
  },
  {
    id: "rotary-dpad",
    title: "ROTARY PIVOTED D-PAD",
    imageSrc: "/images/features/fet-3.webp",
    className: "md:col-span-3",
  },
  {
    id: "mechanical-abxy",
    title: "MECHANICAL ABXY 2.0",
    imageSrc: "/images/features/fet-4.webp",
    className: "md:col-span-3",
  },
  {
    id: "forceadapt-trigger",
    title: "FORCEADAPT™ TRIGGER",
    imageSrc: "/images/features/fet-5.webp",
    className: "md:col-span-4",
    titleColor: "text-black",
  },
  {
    id: "lcd-display",
    title: "FULL COLOR LCD DISPLAY",
    imageSrc: "/images/features/fet-6.webp",
    className: "md:col-span-8",
  },
];

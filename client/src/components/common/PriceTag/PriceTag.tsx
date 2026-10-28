import { formatVND } from "../../../utils/formatCurrency";

interface PriceTagProps {
  /** Current selling price in VND. */
  price: number;
  /** Optional original/compare-at price in VND (shown struck-through if > price). */
  originalPrice?: number;
  /** Size variant for card vs. detail page. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<
  NonNullable<PriceTagProps["size"]>,
  { current: string; original: string }
> = {
  sm: {
    current: "text-sm font-bold",
    original: "text-[11px]",
  },
  md: {
    current: "text-lg font-extrabold",
    original: "text-xs",
  },
  lg: {
    current: "text-3xl font-extrabold sm:text-4xl",
    original: "text-base",
  },
};

export default function PriceTag({
  price,
  originalPrice,
  size = "md",
  className = "",
}: PriceTagProps) {
  const hasDiscount =
    typeof originalPrice === "number" && originalPrice > price;
  const styles = SIZE_CLASSES[size];

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`tracking-tight text-white ${styles.current}`}>
        {formatVND(price)}
      </span>
      {hasDiscount && (
        <span className={`text-gray-500 line-through ${styles.original}`}>
          {formatVND(originalPrice)}
        </span>
      )}
    </div>
  );
}


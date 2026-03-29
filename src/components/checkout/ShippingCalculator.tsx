import { useMemo } from "react";
import { Truck, MapPin } from "lucide-react";

interface ShippingCalculatorProps {
  sellerLocation: string;
  buyerLocation: string;
  itemCount: number;
  hasFreeShipping?: boolean;
}

const BICOL_PROVINCES = [
  "Albay",
  "Camarines Norte",
  "Camarines Sur",
  "Catanduanes",
  "Masbate",
  "Sorsogon",
];

// Distance matrix (simplified) - higher = further
const DISTANCE_MATRIX: Record<string, Record<string, number>> = {
  "Albay": { "Albay": 0, "Camarines Norte": 2, "Camarines Sur": 1, "Catanduanes": 2, "Masbate": 2, "Sorsogon": 1 },
  "Camarines Norte": { "Albay": 2, "Camarines Norte": 0, "Camarines Sur": 1, "Catanduanes": 3, "Masbate": 3, "Sorsogon": 3 },
  "Camarines Sur": { "Albay": 1, "Camarines Norte": 1, "Camarines Sur": 0, "Catanduanes": 2, "Masbate": 2, "Sorsogon": 2 },
  "Catanduanes": { "Albay": 2, "Camarines Norte": 3, "Camarines Sur": 2, "Catanduanes": 0, "Masbate": 3, "Sorsogon": 3 },
  "Masbate": { "Albay": 2, "Camarines Norte": 3, "Camarines Sur": 2, "Catanduanes": 3, "Masbate": 0, "Sorsogon": 2 },
  "Sorsogon": { "Albay": 1, "Camarines Norte": 3, "Camarines Sur": 2, "Catanduanes": 3, "Masbate": 2, "Sorsogon": 0 },
};

const extractProvince = (location: string): string => {
  for (const province of BICOL_PROVINCES) {
    if (location.toLowerCase().includes(province.toLowerCase())) {
      return province;
    }
  }
  return "Albay"; // Default
};

const calculateShippingFee = (
  sellerLocation: string,
  buyerLocation: string,
  itemCount: number
): number => {
  const sellerProvince = extractProvince(sellerLocation);
  const buyerProvince = extractProvince(buyerLocation);

  const distance = DISTANCE_MATRIX[sellerProvince]?.[buyerProvince] ?? 2;

  // Base fee: ₱50
  // Per item: ₱10
  // Distance multiplier: 1.0 (same), 1.3 (near), 1.5 (mid), 1.8 (far)
  const baseFee = 50;
  const perItemFee = 10;
  const distanceMultipliers = [1.0, 1.3, 1.5, 1.8];
  const multiplier = distanceMultipliers[Math.min(distance, 3)];

  const fee = baseFee + (itemCount * perItemFee * multiplier) + 20; // Added 20 pesos platform margin

  // Cap at ₱120 (was ₱100 + 20)
  return Math.min(120, Math.round(fee));
}

const ShippingCalculator = ({
  sellerLocation,
  buyerLocation,
  itemCount,
  hasFreeShipping = false,
}: ShippingCalculatorProps) => {
  const originalFee = useMemo(
    () => calculateShippingFee(sellerLocation, buyerLocation, itemCount),
    [sellerLocation, buyerLocation, itemCount]
  );

  // Free shipping deducts ₱50
  const finalFee = hasFreeShipping ? Math.max(0, originalFee - 50) : originalFee;
  const discount = hasFreeShipping ? Math.min(50, originalFee) : 0;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Truck className="w-4 h-4" />
          Shipping
        </span>
        <div className="text-right">
          {hasFreeShipping && originalFee > 0 ? (
            <div className="flex items-center gap-2">
              <span className="line-through text-muted-foreground text-xs">
                {formatPrice(originalFee)}
              </span>
              <span className="font-medium text-success">
                {finalFee === 0 ? "FREE" : formatPrice(finalFee)}
              </span>
            </div>
          ) : (
            <span className="font-medium">{formatPrice(finalFee)}</span>
          )}
        </div>
      </div>
      {hasFreeShipping && discount > 0 && (
        <p className="text-xs text-success mt-1 text-right">
          Free shipping saves you {formatPrice(discount)}!
        </p>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <MapPin className="w-3 h-3" />
        <span className="truncate">{extractProvince(sellerLocation)}</span>
        <span>→</span>
        <span className="truncate">{extractProvince(buyerLocation)}</span>
      </div>
    </div>
  );
};

export { calculateShippingFee, extractProvince, BICOL_PROVINCES };
export default ShippingCalculator;
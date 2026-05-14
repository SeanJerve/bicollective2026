import { useState } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { useCart } from "@/contexts/CartContext";

interface QuickAddDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    variants?: { id: string; size: string; stock_quantity: number }[];
    inStock?: boolean;
  };
}

const QuickAddDrawer = ({ open, onOpenChange, product }: QuickAddDrawerProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<{
    id: string;
    size: string;
    stock_quantity: number;
  } | null>(null);
  const { addToCart } = useCart();

  const variants = product.variants || [];

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addToCart(selectedVariant.id, quantity);
    onOpenChange(false);
    setQuantity(1);
    setSelectedVariant(null);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[55vh]">
        <div className="px-4 pb-6 pt-2">
          {/* Close */}
          <div className="flex justify-end mb-2">
            <DrawerClose asChild>
              <button
                className="p-1.5 hover:bg-secondary rounded-sm transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
          </div>

          {/* Product Info Row */}
          <div className="flex gap-3 mb-4">
            <div className="w-20 h-20 flex-shrink-0 border border-border-subtle overflow-hidden bg-muted">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-heading text-sm uppercase leading-tight line-clamp-2 mb-1">
                {product.name}
              </h4>
              <p className="font-heading text-base">{formatPrice(product.price)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {product.inStock ? "In Stock" : "Out of Stock"}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <span className="font-heading uppercase text-[11px] tracking-wide text-muted-foreground mb-2 block">
              Size
            </span>
            <div className="flex flex-wrap gap-1.5">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  disabled={v.stock_quantity === 0}
                  className={`h-8 min-w-[2rem] px-2 border-2 font-heading text-[11px] transition-colors ${
                    selectedVariant?.id === v.id
                      ? "border-foreground bg-foreground text-background"
                      : v.stock_quantity === 0
                        ? "border-border-subtle text-muted-foreground line-through cursor-not-allowed"
                        : "border-border-subtle hover:border-foreground"
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <span className="font-heading uppercase text-[11px] tracking-wide text-muted-foreground mb-2 block">
              Quantity
            </span>
            <div className="inline-flex items-center border-2 border-foreground">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 h-8 flex items-center justify-center font-heading border-x-2 border-foreground text-xs">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || !selectedVariant}
            className="btn-brutal w-full flex items-center justify-center gap-2 text-xs py-2.5"
          >
            <ShoppingBag className="w-4 h-4" />
            {!product.inStock ? "Out of Stock" : !selectedVariant ? "Select Size" : "Add to Cart"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickAddDrawer;

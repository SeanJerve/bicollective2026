import { Tag, Plus } from "lucide-react";

const VendorPromotions = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-4">Promotions</h1>
      <p className="text-muted-foreground mb-8">Create promo codes and discounts for your products</p>
      <div className="card-brutal p-12 text-center">
        <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-heading text-xl uppercase mb-2">Promotion Management</h2>
        <p className="text-muted-foreground mb-6">Create percentage discounts, fixed discounts, or free shipping offers</p>
        <button className="btn-brutal"><Plus className="w-4 h-4 mr-2" />Create Promotion</button>
      </div>
    </div>
  );
};

export default VendorPromotions;
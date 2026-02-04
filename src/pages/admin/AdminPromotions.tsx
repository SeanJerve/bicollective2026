import { Tag } from "lucide-react";

const AdminPromotions = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-4">Platform Promotions</h1>
      <p className="text-muted-foreground mb-8">Manage sitewide discounts, seller promos, and location-based offers</p>
      <div className="card-brutal p-12 text-center">
        <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Promotion management coming soon</p>
      </div>
    </div>
  );
};

export default AdminPromotions;
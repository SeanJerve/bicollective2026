import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPromotionsContent from "@/components/admin/promotions/AdminPromotionsContent";
import AdminVouchers from "./AdminVouchers";
import AdminLuckyPromo from "./AdminLuckyPromo";
import AdminSitePopups from "@/components/admin/promotions/AdminSitePopups";
import { Tag, Ticket, Gift, Globe } from "lucide-react";

const AdminPromotions = () => {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Marketing & Promotions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage platform-wide discounts, vouchers, popups, and the lucky promo system.
        </p>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="bg-secondary p-1 h-auto flex flex-wrap gap-1 justify-start">
          <TabsTrigger
            value="campaigns"
            className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Discount Campaigns</span>
            <span className="inline sm:hidden">Campaigns</span>
          </TabsTrigger>
          <TabsTrigger
            value="vouchers"
            className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Ticket className="w-4 h-4" />
            Vouchers
          </TabsTrigger>
          <TabsTrigger
            value="lucky-promo"
            className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Lucky Promo</span>
            <span className="inline sm:hidden">Lucky</span>
          </TabsTrigger>
          <TabsTrigger
            value="popups"
            className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Site Popups</span>
            <span className="inline sm:hidden">Popups</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6 outline-none">
          <AdminPromotionsContent />
        </TabsContent>

        <TabsContent value="vouchers" className="mt-6 outline-none">
          <AdminVouchers />
        </TabsContent>

        <TabsContent value="lucky-promo" className="mt-6 outline-none">
          <AdminLuckyPromo />
        </TabsContent>

        <TabsContent value="popups" className="mt-6 outline-none">
          <AdminSitePopups />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPromotions;

import { ReactNode } from "react";
import SaleBanner from "./SaleBanner";
import LuckyPromoPopup from "@/components/promotions/LuckyPromoPopup";
import Header from "./Header";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SaleBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <LuckyPromoPopup />
    </div>
  );
};

export default PageLayout;

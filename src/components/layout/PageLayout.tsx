import { ReactNode } from "react";
import SaleBanner from "./SaleBanner";
import LuckyPromoPopup from "@/components/promotions/LuckyPromoPopup";
import Header from "./Header";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

const PageLayout = ({ children, hideHeader, hideFooter }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SaleBanner />
      {!hideHeader && <Header />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
      <LuckyPromoPopup />
    </div>
  );
};

export default PageLayout;

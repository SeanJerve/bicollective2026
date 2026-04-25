import { ReactNode } from "react";
import SaleBanner from "./SaleBanner";
import LuckyPromoPopup from "@/components/promotions/LuckyPromoPopup";
import Header from "./Header";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideSaleBanner?: boolean;
  header?: ReactNode;
  minimalHeader?: boolean;
}

const PageLayout = ({ children, hideHeader, hideFooter, hideSaleBanner, header, minimalHeader }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideSaleBanner && <SaleBanner />}
      {!hideHeader && (header || <Header minimal={minimalHeader} />)}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
      <LuckyPromoPopup />
    </div>
  );
};

export default PageLayout;

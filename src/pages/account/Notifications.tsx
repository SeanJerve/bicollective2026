import { Link } from "react-router-dom";
import { Bell, ShoppingCart, MessageSquare, Shield, Package, Check, Clock } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";

const Notifications = () => {
  const { recentNotifications, loading, markAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "order": return <ShoppingCart className="w-5 h-5" />;
      case "message": return <MessageSquare className="w-5 h-5" />;
      case "verification": return <Shield className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground bg-secondary/10">
        <div className="section-container">
          <nav className="text-xs md:text-sm mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>Notifications</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center border-2 border-foreground shadow-brutal">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tighter">Notification History</h1>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="section-container max-w-3xl">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 skeleton-brutal" />
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-4">
              {recentNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`card-brutal p-6 flex gap-4 transition-all ${notif.read_at ? "opacity-70 bg-secondary/20" : "bg-background shadow-brutal-hover"}`}
                >
                  <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 border-2 border-foreground ${notif.read_at ? "bg-muted" : "bg-primary text-primary-foreground shadow-brutal-sm"}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-heading text-lg uppercase leading-tight">{notif.title}</h3>
                      {!notif.read_at && (
                        <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase border border-foreground shadow-brutal-xs">New</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(notif.created_at), "MMM d, h:mm a")}
                      </div>
                      <div className="flex gap-3">
                        {notif.link && (
                          <Link 
                            to={notif.link} 
                            onClick={() => !notif.read_at && markAsRead(notif.id)}
                            className="text-xs font-heading underline uppercase hover:text-primary transition-colors"
                          >
                            View Details
                          </Link>
                        )}
                        {!notif.read_at && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs font-heading underline uppercase hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-muted-foreground/30">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h2 className="font-heading text-2xl uppercase text-muted-foreground">No notifications yet</h2>
              <p className="text-muted-foreground mt-2">When you get updates, they'll appear here.</p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Notifications;

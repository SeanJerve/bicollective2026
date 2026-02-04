import { BarChart3 } from "lucide-react";

const AdminAnalytics = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-4">Analytics</h1>
      <p className="text-muted-foreground mb-8">Platform performance insights</p>
      <div className="card-brutal p-12 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Analytics dashboard coming soon</p>
      </div>
    </div>
  );
};

export default AdminAnalytics;
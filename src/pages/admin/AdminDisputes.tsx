import { AlertTriangle } from "lucide-react";

const AdminDisputes = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-4">Dispute Resolution</h1>
      <p className="text-muted-foreground mb-8">Review and resolve customer disputes</p>
      <div className="card-brutal p-12 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No disputes to review</p>
      </div>
    </div>
  );
};

export default AdminDisputes;
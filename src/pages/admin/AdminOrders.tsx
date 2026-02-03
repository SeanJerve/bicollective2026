import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Loader2, ShoppingCart, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending_payment: "bg-warning text-warning-foreground",
  payment_uploaded: "bg-info text-info-foreground",
  paid: "bg-info text-info-foreground",
  processing: "bg-info text-info-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  payment_uploaded: "Payment Uploaded",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`
          *,
          vendor_orders(
            id,
            status,
            subtotal,
            brand:brands(name, slug)
          )
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by vendor order status if needed
      let filteredData = data || [];
      if (filter !== "all") {
        filteredData = filteredData.filter((order) =>
          order.vendor_orders?.some((vo: any) => vo.status === filter)
        );
      }

      setOrders(filteredData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_name.toLowerCase().includes(search.toLowerCase())
  );

  const getOverallStatus = (vendorOrders: any[]) => {
    if (!vendorOrders || vendorOrders.length === 0) return "pending_payment";
    
    // Return the "lowest" status
    const statusOrder = [
      "cancelled",
      "pending_payment",
      "payment_uploaded",
      "paid",
      "processing",
      "shipped",
      "delivered",
    ];
    
    let lowestIndex = statusOrder.length - 1;
    for (const vo of vendorOrders) {
      const index = statusOrder.indexOf(vo.status);
      if (index < lowestIndex) lowestIndex = index;
    }
    return statusOrder[lowestIndex];
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            View all platform orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-brutal w-full pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-brutal w-full sm:w-auto"
        >
          <option value="all">All Status</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="payment_uploaded">Payment Uploaded</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card-brutal p-8 md:p-12 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl uppercase mb-2">No Orders</h3>
          <p className="text-muted-foreground text-sm">No orders match your search</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => {
              const overallStatus = getOverallStatus(order.vendor_orders);
              return (
                <div key={order.id} className="card-brutal p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm">{order.shipping_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "PP")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs uppercase ${statusColors[overallStatus]}`}
                    >
                      {statusLabels[overallStatus]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading">{formatPrice(Number(order.total_amount))}</span>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="p-2 hover:bg-secondary"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card-brutal overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-heading text-sm uppercase">Order ID</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Customer</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Vendors</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Date</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Total</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Status</th>
                    <th className="text-right p-4 font-heading text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredOrders.map((order) => {
                    const overallStatus = getOverallStatus(order.vendor_orders);
                    return (
                      <tr key={order.id}>
                        <td className="p-4 font-mono text-sm">#{order.id.slice(0, 8)}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{order.shipping_name}</p>
                            <p className="text-xs text-muted-foreground">{order.shipping_phone}</p>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {order.vendor_orders
                            ?.map((vo: any) => vo.brand?.name)
                            .filter(Boolean)
                            .join(", ") || "-"}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {format(new Date(order.created_at), "PP")}
                        </td>
                        <td className="p-4 font-heading">
                          {formatPrice(Number(order.total_amount))}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-xs uppercase ${statusColors[overallStatus]}`}
                          >
                            {statusLabels[overallStatus]}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end">
                            <Link
                              to={`/account/orders/${order.id}`}
                              className="p-2 hover:bg-secondary"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders;

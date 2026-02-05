 import { useState, useEffect } from "react";
 import { Link } from "react-router-dom";
 import { Heart, ShoppingBag, Trash2 } from "lucide-react";
 import PageLayout from "@/components/layout/PageLayout";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useCart } from "@/contexts/CartContext";
 import { useToast } from "@/hooks/use-toast";
 
 interface WishlistItem {
   id: string;
   product: {
     id: string;
     name: string;
     slug: string;
     price: number;
     original_price: number | null;
     image_url: string | null;
     in_stock: boolean;
     brand: {
       name: string;
       slug: string;
     };
   };
 }
 
 const Wishlist = () => {
   const { user } = useAuth();
   const { addToCart } = useCart();
   const { toast } = useToast();
   const [items, setItems] = useState<WishlistItem[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchWishlist = async () => {
       if (!user) return;
 
       try {
         const { data, error } = await supabase
           .from("wishlists")
           .select(`
             id,
             product:products (
               id,
               name,
               slug,
               price,
               original_price,
               image_url,
               in_stock,
               brand:brands (name, slug)
             )
           `)
           .eq("user_id", user.id)
           .order("created_at", { ascending: false });
 
         if (error) throw error;
         setItems((data as any) || []);
       } catch (error) {
         console.error("Error fetching wishlist:", error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchWishlist();
   }, [user]);
 
   const removeFromWishlist = async (wishlistId: string) => {
     try {
       await supabase.from("wishlists").delete().eq("id", wishlistId);
       setItems(items.filter((item) => item.id !== wishlistId));
       toast({ title: "Removed from wishlist" });
     } catch (error) {
       console.error("Error removing from wishlist:", error);
     }
   };
 
   const handleAddToCart = (productId: string) => {
     addToCart(productId, 1, "M"); // Default to M size
   };
 
   const formatPrice = (amount: number) =>
     new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
 
   if (loading) {
     return (
       <PageLayout>
         <div className="section-container py-12">
           <div className="skeleton-brutal h-8 w-48 mb-8" />
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="skeleton-brutal h-64" />
             ))}
           </div>
         </div>
       </PageLayout>
     );
   }
 
   return (
     <PageLayout>
       <section className="py-12 border-b-2 border-foreground">
         <div className="section-container">
           <h1 className="font-heading text-4xl md:text-5xl uppercase">My Wishlist</h1>
           <p className="text-muted-foreground mt-2">{items.length} items saved</p>
         </div>
       </section>
 
       <section className="py-12">
         <div className="section-container">
           {items.length === 0 ? (
             <div className="card-brutal p-12 text-center">
               <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
               <h2 className="font-heading text-2xl uppercase mb-2">No saved items</h2>
               <p className="text-muted-foreground mb-6">
                 Start adding products you love to your wishlist
               </p>
               <Link to="/products" className="btn-brutal">
                 Browse Products
               </Link>
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
               {items.map((item) => (
                 <div key={item.id} className="card-brutal group">
                   <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                     <Link to={`/products/${item.product.slug}`}>
                       {item.product.image_url ? (
                         <img
                           src={item.product.image_url}
                           alt={item.product.name}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <span className="text-muted-foreground">No image</span>
                         </div>
                       )}
                     </Link>
                     <button
                       onClick={() => removeFromWishlist(item.id)}
                       className="absolute top-2 right-2 w-8 h-8 bg-background border-2 border-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                   <div className="p-4">
                     <Link
                       to={`/brands/${item.product.brand.slug}`}
                       className="text-xs text-muted-foreground hover:text-foreground"
                     >
                       {item.product.brand.name}
                     </Link>
                     <Link to={`/products/${item.product.slug}`}>
                       <h3 className="font-heading text-sm uppercase mt-1 line-clamp-2">
                         {item.product.name}
                       </h3>
                     </Link>
                     <div className="flex items-center gap-2 mt-2">
                       <span className="font-heading">{formatPrice(item.product.price)}</span>
                       {item.product.original_price && item.product.original_price > item.product.price && (
                         <span className="text-sm text-muted-foreground line-through">
                           {formatPrice(item.product.original_price)}
                         </span>
                       )}
                     </div>
                     <button
                       onClick={() => handleAddToCart(item.product.id)}
                       disabled={!item.product.in_stock}
                       className="btn-brutal w-full mt-3 text-sm flex items-center justify-center gap-2"
                     >
                       <ShoppingBag className="w-4 h-4" />
                       {item.product.in_stock ? "Add to Cart" : "Out of Stock"}
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </section>
     </PageLayout>
   );
 };
 
 export default Wishlist;
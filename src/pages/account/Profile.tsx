 import { useState, useEffect } from "react";
 import { User, Phone, MapPin, Save, Loader2 } from "lucide-react";
 import PageLayout from "@/components/layout/PageLayout";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 const Profile = () => {
   const { user } = useAuth();
   const { toast } = useToast();
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [formData, setFormData] = useState({
     full_name: "",
     phone: "",
     address: "",
   });
 
   useEffect(() => {
     const fetchProfile = async () => {
       if (!user) return;
 
       try {
         const { data, error } = await supabase
           .from("profiles")
           .select("*")
           .eq("user_id", user.id)
           .single();
 
         if (error) throw error;
 
         if (data) {
           setFormData({
             full_name: data.full_name || "",
             phone: data.phone || "",
             address: data.address || "",
           });
         }
       } catch (error) {
         console.error("Error fetching profile:", error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchProfile();
   }, [user]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     setSaving(true);
     try {
       const { error } = await supabase
         .from("profiles")
         .update({
           full_name: formData.full_name,
           phone: formData.phone,
           address: formData.address,
           updated_at: new Date().toISOString(),
         })
         .eq("user_id", user.id);
 
       if (error) throw error;
 
       toast({
         title: "Profile updated",
         description: "Your profile has been saved successfully",
       });
     } catch (error: any) {
       toast({
         title: "Update failed",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setSaving(false);
     }
   };
 
   if (loading) {
     return (
       <PageLayout>
         <div className="section-container py-12">
           <div className="max-w-xl mx-auto">
             <div className="skeleton-brutal h-8 w-48 mb-8" />
             <div className="card-brutal p-6 space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="skeleton-brutal h-16" />
               ))}
             </div>
           </div>
         </div>
       </PageLayout>
     );
   }
 
   return (
     <PageLayout>
       <section className="py-12">
         <div className="section-container max-w-xl">
           <h1 className="font-heading text-3xl md:text-4xl uppercase mb-6">
             Profile Settings
           </h1>
 
           <div className="card-brutal p-6 md:p-8">
             <form onSubmit={handleSubmit} className="space-y-6">
               <div>
                 <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                   Full Name
                 </label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <input
                     type="text"
                     value={formData.full_name}
                     onChange={(e) =>
                       setFormData({ ...formData, full_name: e.target.value })
                     }
                     className="input-brutal pl-12"
                     placeholder="Juan Dela Cruz"
                   />
                 </div>
               </div>
 
               <div>
                 <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                   Phone Number
                 </label>
                 <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <input
                     type="tel"
                     value={formData.phone}
                     onChange={(e) =>
                       setFormData({ ...formData, phone: e.target.value })
                     }
                     className="input-brutal pl-12"
                     placeholder="+63 9XX XXX XXXX"
                   />
                 </div>
               </div>
 
               <div>
                 <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                   Default Shipping Address
                 </label>
                 <div className="relative">
                   <MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                   <textarea
                     value={formData.address}
                     onChange={(e) =>
                       setFormData({ ...formData, address: e.target.value })
                     }
                     className="input-brutal pl-12 min-h-[100px]"
                     placeholder="Street, Barangay, City, Province"
                   />
                 </div>
               </div>
 
               <div className="pt-4 border-t border-border-subtle">
                 <p className="text-sm text-muted-foreground mb-4">
                   Email: <strong>{user?.email}</strong>
                 </p>
               </div>
 
               <button
                 type="submit"
                 disabled={saving}
                 className="btn-brutal w-full flex items-center justify-center gap-2"
               >
                 {saving ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                   <Save className="w-5 h-5" />
                 )}
                 {saving ? "Saving..." : "Save Changes"}
               </button>
             </form>
           </div>
         </div>
       </section>
     </PageLayout>
   );
 };
 
 export default Profile;
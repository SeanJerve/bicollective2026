import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductVariant {
  id?: string;
  size: string;
  stock_quantity: number;
}

interface ProductFormProps {
  brandId: string;
  categories: { id: string; name: string }[];
  initialData?: {
    id?: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    description?: string;
    categoryId?: string;
    imageUrl?: string;
    images?: string[];
    inStock?: boolean;
    variants?: ProductVariant[];
    listingType?: string;
    releaseDate?: string;
    preorderDiscountPercent?: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const ProductForm = ({
  brandId,
  categories,
  initialData,
  onSuccess,
  onCancel,
}: ProductFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    price: initialData?.price || 0,
    originalPrice: initialData?.originalPrice || 0,
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    imageUrl: initialData?.imageUrl || "",
    images: initialData?.images || [],
    inStock: initialData?.inStock ?? true,
    variants: initialData?.variants || [{ size: "M", stock_quantity: 10 }],
    listingType: initialData?.listingType || "regular",
    releaseDate: initialData?.releaseDate || "",
    preorderDiscountPercent: initialData?.preorderDiscountPercent || 0,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${brandId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      if (!formData.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
      } else {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, publicUrl],
        }));
      }

      toast({
        title: "Image uploaded",
        description: "Product image has been uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadImage(file);
    }
  };

  const removeImage = (url: string) => {
    if (url === formData.imageUrl) {
      const [newMain, ...rest] = formData.images;
      setFormData((prev) => ({
        ...prev,
        imageUrl: newMain || "",
        images: rest,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== url),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.variants.length === 0) {
      toast({
        title: "No variants",
        description: "Please add at least one size variant",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const productData: any = {
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
        original_price: formData.originalPrice || null,
        description: formData.description || null,
        category_id: formData.categoryId || null,
        brand_id: brandId,
        image_url: formData.imageUrl || null,
        in_stock: formData.inStock,
        is_active: true,
        listing_type: formData.listingType,
        release_date: formData.releaseDate || null,
        preorder_discount_percent: formData.preorderDiscountPercent || 0,
      };

      let productId = initialData?.id;

      if (productId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Sync Product Images
      await supabase.from("product_images").delete().eq("product_id", productId);
      const imageInserts = formData.images.map((url, idx) => ({
        product_id: productId,
        image_url: url,
        sort_order: idx + 1,
      }));
      if (imageInserts.length > 0) {
        await supabase.from("product_images").insert(imageInserts);
      }

      // Sync Product Variants
      await supabase.from("product_variants").delete().eq("product_id", productId);
      const variantInserts = formData.variants.map((v) => ({
        product_id: productId,
        size: v.size,
        stock_quantity: v.stock_quantity,
      }));
      if (variantInserts.length > 0) {
        await supabase.from("product_variants").insert(variantInserts);
      }

      toast({ title: initialData?.id ? "Product updated" : "Product created" });
      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const allImages = [formData.imageUrl, ...formData.images].filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Images */}
      <div>
        <label className="font-heading text-sm uppercase tracking-wide mb-3 block">
          Product Images
        </label>
        <div className="flex flex-wrap gap-3">
          {allImages.map((url, idx) => (
            <div
              key={url}
              className="relative w-24 h-24 md:w-32 md:h-32 border-2 border-foreground overflow-hidden group"
            >
              <img
                src={url}
                alt={`Product ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-foreground text-background text-xs text-center py-0.5">
                  Main
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 md:w-32 md:h-32 border-2 border-dashed border-border-subtle hover:border-foreground flex flex-col items-center justify-center gap-2 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-xs text-muted-foreground">Upload</span>
              </>
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Name & Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="input-brutal w-full"
            required
          />
        </div>
        <div>
          <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
            URL Slug
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            className="input-brutal w-full"
          />
        </div>
      </div>

      {/* Price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
            Price (₱) *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
            className="input-brutal w-full"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
            Original Price (₱)
          </label>
          <input
            type="number"
            value={formData.originalPrice}
            onChange={(e) => setFormData((prev) => ({ ...prev, originalPrice: Number(e.target.value) }))}
            className="input-brutal w-full"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
            Category
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="input-brutal w-full"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="input-brutal w-full min-h-[100px] resize-y"
          rows={4}
        />
      </div>

      {/* Listing Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
            Listing Type
          </label>
          <select
            value={formData.listingType}
            onChange={(e) => setFormData((prev) => ({ ...prev, listingType: e.target.value }))}
            className="input-brutal w-full"
          >
            <option value="regular">Regular</option>
            <option value="preorder">Pre-order</option>
            <option value="teaser">Teaser (Coming Soon)</option>
          </select>
        </div>
        {(formData.listingType === "preorder" || formData.listingType === "teaser") && (
          <div>
            <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
              Release Date
            </label>
            <input
              type="date"
              value={formData.releaseDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, releaseDate: e.target.value }))}
              className="input-brutal w-full"
            />
          </div>
        )}
        {formData.listingType === "preorder" && (
          <div>
            <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
              Pre-order Discount %
            </label>
            <input
              type="number"
              value={formData.preorderDiscountPercent}
              onChange={(e) => setFormData((prev) => ({ ...prev, preorderDiscountPercent: Number(e.target.value) }))}
              className="input-brutal w-full"
              min="0"
              max="100"
            />
          </div>
        )}
      </div>

      {/* Variants (Size & Stock) */}
      <div className="card-brutal p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <label className="font-heading text-sm uppercase tracking-wide">
            Product Variants (Sizes)
          </label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, variants: [...prev.variants, { size: "", stock_quantity: 0 }] }))}
            className="text-xs uppercase font-heading underline hover:text-accent"
          >
            + Add Size
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.variants.map((variant, idx) => (
            <div key={idx} className="flex items-end gap-3 animate-slide-in">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Size</label>
                <input
                  type="text"
                  placeholder="e.g. M, 42, OS"
                  value={variant.size}
                  onChange={(e) => {
                    const newVariants = [...formData.variants];
                    newVariants[idx].size = e.target.value.toUpperCase();
                    setFormData(prev => ({ ...prev, variants: newVariants }));
                  }}
                  className="input-brutal py-1.5 px-3 w-full"
                  required
                />
              </div>
              <div className="w-24">
                <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Stock</label>
                <input
                  type="number"
                  value={variant.stock_quantity}
                  onChange={(e) => {
                    const newVariants = [...formData.variants];
                    newVariants[idx].stock_quantity = Number(e.target.value);
                    setFormData(prev => ({ ...prev, variants: newVariants }));
                  }}
                  className="input-brutal py-1.5 px-3 w-full"
                  min="0"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVariants = formData.variants.filter((_, i) => i !== idx);
                  setFormData(prev => ({ ...prev, variants: newVariants }));
                }}
                className="p-2 border-2 border-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors h-[38px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {formData.variants.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No variants added. Please add at least one.</p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-3">
          <input
            type="checkbox"
            id="inStock"
            checked={formData.inStock}
            onChange={(e) => setFormData((prev) => ({ ...prev, inStock: e.target.checked }))}
            className="w-5 h-5 border-2 border-foreground"
          />
          <label htmlFor="inStock" className="font-heading text-sm uppercase">
            Available For Sale
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-brutal flex-1"
        >
          {loading ? "Saving..." : initialData?.id ? "Update Product" : "Create Product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-brutal-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;

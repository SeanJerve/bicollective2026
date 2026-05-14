import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Image } from "lucide-react";

interface AdminPaymentProofProps {
  path: string;
  paymentMethod?: string;
}

const AdminPaymentProof = ({ path, paymentMethod }: AdminPaymentProofProps) => {
  const { data: url } = useQuery({
    queryKey: ["admin-proof-url", path],
    queryFn: async () => {
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 3600);
      return data?.signedUrl || null;
    },
    staleTime: 30 * 60 * 1000,
  });

  if (!url) return null;

  const label =
    paymentMethod === "gcash"
      ? "GCash"
      : paymentMethod === "bank_transfer"
        ? "Bank Transfer"
        : "COD";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
    >
      <Image className="w-3.5 h-3.5" />
      Proof ({label})
    </a>
  );
};

export default AdminPaymentProof;

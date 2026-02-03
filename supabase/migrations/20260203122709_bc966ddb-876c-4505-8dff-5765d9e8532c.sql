-- Vendor Application Status Enum
CREATE TYPE public.vendor_application_status AS ENUM (
  'pending', 'approved', 'needs_resubmission', 'rejected'
);

-- Business Type Enum
CREATE TYPE public.business_type AS ENUM ('established', 'aspiring');

-- Vendor Verification Status Enum
CREATE TYPE public.vendor_verification_status AS ENUM (
  'pending', 'verified', 'needs_resubmission', 'rejected'
);

-- Vendor Applications Table
CREATE TABLE public.vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  business_type public.business_type NOT NULL,
  location TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  description TEXT,
  business_permit_url TEXT,
  valid_id_url TEXT,
  proof_of_products_url TEXT,
  status public.vendor_application_status DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor Verifications Table
CREATE TABLE public.vendor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  dti_registration_url TEXT,
  bir_certificate_url TEXT,
  mayor_permit_url TEXT,
  additional_docs TEXT[],
  status public.vendor_verification_status DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS on both tables
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_applications
CREATE POLICY "Users can view their own applications"
ON public.vendor_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
ON public.vendor_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications"
ON public.vendor_applications FOR UPDATE
USING (auth.uid() = user_id AND status IN ('pending', 'needs_resubmission'));

CREATE POLICY "Admins can view all applications"
ON public.vendor_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all applications"
ON public.vendor_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vendor_verifications
CREATE POLICY "Brand owners can view their verifications"
ON public.vendor_verifications FOR SELECT
USING (public.get_brand_owner(brand_id) = auth.uid());

CREATE POLICY "Brand owners can create verifications"
ON public.vendor_verifications FOR INSERT
WITH CHECK (public.get_brand_owner(brand_id) = auth.uid());

CREATE POLICY "Brand owners can update pending verifications"
ON public.vendor_verifications FOR UPDATE
USING (public.get_brand_owner(brand_id) = auth.uid() AND status IN ('pending', 'needs_resubmission'));

CREATE POLICY "Admins can view all verifications"
ON public.vendor_verifications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all verifications"
ON public.vendor_verifications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for vendor documents (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-documents', 'vendor-documents', false);

-- Storage policies for vendor-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all vendor documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Updated_at trigger for vendor_applications
CREATE TRIGGER update_vendor_applications_updated_at
BEFORE UPDATE ON public.vendor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
  -- Create user roles enum
  CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'customer');

  -- Create order status enum
  CREATE TYPE public.order_status AS ENUM ('pending_payment', 'payment_uploaded', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');

  -- Create vendor status enum
  CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'verified', 'suspended');

  -- Create profiles table
  CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create user_roles table (separate from profiles for security)
  CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
  );

  -- Create brands table
  CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    status vendor_status DEFAULT 'approved' NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create categories table
  CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create products table
  CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    image_url TEXT,
    images TEXT[],
    sizes TEXT[] DEFAULT ARRAY['XS', 'S', 'M', 'L', 'XL'],
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create cart_items table
  CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, product_id, size)
  );

  -- Create orders table (parent order for customer checkout)
  CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_name TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create vendor_orders table (order items grouped by vendor)
  CREATE TABLE public.vendor_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    status order_status DEFAULT 'pending_payment' NOT NULL,
    payment_proof_url TEXT,
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create order_items table
  CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_order_id UUID REFERENCES public.vendor_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create reviews table
  CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    vendor_order_id UUID REFERENCES public.vendor_orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- Create reports table
  CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
  );

  -- Enable RLS on all tables
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

  -- Security definer function to check user role
  CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
  RETURNS BOOLEAN
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  $$;

  -- Function to get brand owner
  CREATE OR REPLACE FUNCTION public.get_brand_owner(_brand_id UUID)
  RETURNS UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT owner_id FROM public.brands WHERE id = _brand_id
  $$;

  -- Profiles policies
  CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- User roles policies (read-only for users, admin can manage)
  CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

  -- Brands policies
  CREATE POLICY "Anyone can view approved/verified brands" ON public.brands
    FOR SELECT USING (status IN ('approved', 'verified'));

  CREATE POLICY "Owners can manage their brand" ON public.brands
    FOR ALL USING (auth.uid() = owner_id);

  CREATE POLICY "Admins can manage all brands" ON public.brands
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

  -- Categories policies (public read)
  CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

  CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

  -- Products policies
  CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

  CREATE POLICY "Brand owners can manage their products" ON public.products
    FOR ALL USING (public.get_brand_owner(brand_id) = auth.uid());

  CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

  -- Cart items policies
  CREATE POLICY "Users can manage their own cart" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id);

  -- Orders policies
  CREATE POLICY "Customers can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = customer_id);

  CREATE POLICY "Customers can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

  CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

  -- Vendor orders policies
  CREATE POLICY "Customers can view their vendor orders" ON public.vendor_orders
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
    );

  CREATE POLICY "Customers can create vendor orders" ON public.vendor_orders
    FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
    );

  CREATE POLICY "Customers can update payment proof" ON public.vendor_orders
    FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND customer_id = auth.uid())
    );

  CREATE POLICY "Vendors can view their orders" ON public.vendor_orders
    FOR SELECT USING (public.get_brand_owner(brand_id) = auth.uid());

  CREATE POLICY "Vendors can update their order status" ON public.vendor_orders
    FOR UPDATE USING (public.get_brand_owner(brand_id) = auth.uid());

  CREATE POLICY "Admins can manage all vendor orders" ON public.vendor_orders
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

  -- Order items policies
  CREATE POLICY "Users can view their order items" ON public.order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.vendor_orders vo
        JOIN public.orders o ON o.id = vo.order_id
        WHERE vo.id = vendor_order_id AND o.customer_id = auth.uid()
      )
    );

  CREATE POLICY "Users can create order items" ON public.order_items
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.vendor_orders vo
        JOIN public.orders o ON o.id = vo.order_id
        WHERE vo.id = vendor_order_id AND o.customer_id = auth.uid()
      )
    );

  CREATE POLICY "Vendors can view their order items" ON public.order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.vendor_orders vo
        WHERE vo.id = vendor_order_id AND public.get_brand_owner(vo.brand_id) = auth.uid()
      )
    );

  -- Reviews policies
  CREATE POLICY "Anyone can view visible reviews" ON public.reviews
    FOR SELECT USING (is_visible = true);

  CREATE POLICY "Users can create reviews for completed orders" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

  -- Reports policies
  CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

  CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

  CREATE POLICY "Admins can manage all reports" ON public.reports
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

  -- Create trigger to auto-create profile on user signup
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    RETURN NEW;
  END;
  $$;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  -- Create updated_at trigger function
  CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$;

  -- Add updated_at triggers
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_vendor_orders_updated_at BEFORE UPDATE ON public.vendor_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  -- Insert default categories
  INSERT INTO public.categories (name, slug, product_count) VALUES
    ('T-Shirts', 't-shirts', 0),
    ('Shirts', 'shirts', 0),
    ('Pants', 'pants', 0),
    ('Hoodies', 'hoodies', 0),
    ('Jackets', 'jackets', 0),
    ('Accessories', 'accessories', 0);
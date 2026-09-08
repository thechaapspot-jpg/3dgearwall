-- 3D Gear Wall: Supabase Database Schema
-- Schema for Products, Categories, and Admin Portal

-- 1. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    scale TEXT DEFAULT '1:36',
    frame_size TEXT DEFAULT '15x20',
    image TEXT NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT NULL,
    stock INTEGER DEFAULT 5,
    out_of_stock BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_customizable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index for fast brand & stock queries
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_out_of_stock ON public.products(out_of_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies:
-- Allow anyone (anonymous public storefront) to READ active products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow authenticated admins to INSERT, UPDATE, and DELETE products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Updated timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. Storage Bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Authenticated admins can upload & delete images
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

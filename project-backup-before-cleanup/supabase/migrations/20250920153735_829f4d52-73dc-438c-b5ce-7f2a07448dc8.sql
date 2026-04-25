-- Create a simple placeholder table to generate Supabase types
CREATE TABLE public.placeholder (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.placeholder ENABLE ROW LEVEL SECURITY;

-- Create a basic policy (this table won't be used, just for type generation)
CREATE POLICY "placeholder_policy" 
ON public.placeholder 
FOR ALL 
USING (true);
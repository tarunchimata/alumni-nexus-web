
-- Allow authenticated users to view school requests
CREATE POLICY "Authenticated users can view school requests"
ON public.school_requests
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update school requests (approve/reject)
CREATE POLICY "Authenticated users can update school requests"
ON public.school_requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete school requests
CREATE POLICY "Authenticated users can delete school requests"
ON public.school_requests
FOR DELETE
TO authenticated
USING (true);

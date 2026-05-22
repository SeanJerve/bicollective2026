-- Allow anyone to read basic profile info (necessary for messaging list/thread user names)
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
CREATE POLICY "Anyone can view basic profile info" ON public.profiles FOR SELECT USING (true);


-- Revoke EXECUTE on handle_new_user so only the trigger runs it (fixes linter warning)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Storage policies for the private "wardrobe" bucket: users access only their own folder (path begins with their uid)
CREATE POLICY "wardrobe_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "wardrobe_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "wardrobe_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "wardrobe_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'wardrobe' AND auth.uid()::text = (storage.foldername(name))[1]);

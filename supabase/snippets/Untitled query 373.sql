UPDATE auth.users 
SET 
  email_change = '',
  email_change_token_new = '',
  email_change_token_current = '',
  phone_change = '',
  phone_change_token = '',
  email_change_confirm_status = 0
WHERE id::text LIKE 'a1000000%' OR id::text LIKE 'c1000000%';

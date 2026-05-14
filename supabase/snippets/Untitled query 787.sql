-- Check identities for seeded users
SELECT u.id, u.email, i.provider, i.provider_id, i.identity_data
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE u.email = 'vendor.syndicate@demo.com';

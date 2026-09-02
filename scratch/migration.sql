-- Migration script to update old Supabase UUIDs to new Clerk IDs
BEGIN;

-- 1. Drop foreign key constraints so we can update the parent profile IDs
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE report_feedback DROP CONSTRAINT IF EXISTS report_feedback_user_id_fkey;
ALTER TABLE general_feedback DROP CONSTRAINT IF EXISTS general_feedback_user_id_fkey;

-- 2. Perform the ID updates (hardcoded pairs)
-- Updating user: workwithhemant007@gmail.com
UPDATE profiles SET id = 'user_3IlIJr9KMEOeERo1b9V14EzxAJ3' WHERE id = '21d6ef4d-3ca5-47a1-ad22-83f3d7e51b6e';
UPDATE reports SET user_id = 'user_3IlIJr9KMEOeERo1b9V14EzxAJ3' WHERE user_id = '21d6ef4d-3ca5-47a1-ad22-83f3d7e51b6e';
UPDATE payments SET user_id = 'user_3IlIJr9KMEOeERo1b9V14EzxAJ3' WHERE user_id = '21d6ef4d-3ca5-47a1-ad22-83f3d7e51b6e';
UPDATE report_feedback SET user_id = 'user_3IlIJr9KMEOeERo1b9V14EzxAJ3' WHERE user_id = '21d6ef4d-3ca5-47a1-ad22-83f3d7e51b6e';
UPDATE general_feedback SET user_id = 'user_3IlIJr9KMEOeERo1b9V14EzxAJ3' WHERE user_id = '21d6ef4d-3ca5-47a1-ad22-83f3d7e51b6e';

-- Updating user: hemantshivankar30@gmail.com
UPDATE profiles SET id = 'user_3Iif9P9zItnHm3D8wUQVcFazOP9' WHERE id = 'f3baa6d3-ddf2-4ce7-9456-bc83b8b72365';
UPDATE reports SET user_id = 'user_3Iif9P9zItnHm3D8wUQVcFazOP9' WHERE user_id = 'f3baa6d3-ddf2-4ce7-9456-bc83b8b72365';
UPDATE payments SET user_id = 'user_3Iif9P9zItnHm3D8wUQVcFazOP9' WHERE user_id = 'f3baa6d3-ddf2-4ce7-9456-bc83b8b72365';
UPDATE report_feedback SET user_id = 'user_3Iif9P9zItnHm3D8wUQVcFazOP9' WHERE user_id = 'f3baa6d3-ddf2-4ce7-9456-bc83b8b72365';
UPDATE general_feedback SET user_id = 'user_3Iif9P9zItnHm3D8wUQVcFazOP9' WHERE user_id = 'f3baa6d3-ddf2-4ce7-9456-bc83b8b72365';

-- Updating user: safebasket2025@gmail.com
UPDATE profiles SET id = 'user_3Iif9I63vIIbxMiIalWdpty3z1J' WHERE id = '5f30b299-cede-4eb9-87a0-f99e4050716a';
UPDATE reports SET user_id = 'user_3Iif9I63vIIbxMiIalWdpty3z1J' WHERE user_id = '5f30b299-cede-4eb9-87a0-f99e4050716a';
UPDATE payments SET user_id = 'user_3Iif9I63vIIbxMiIalWdpty3z1J' WHERE user_id = '5f30b299-cede-4eb9-87a0-f99e4050716a';
UPDATE report_feedback SET user_id = 'user_3Iif9I63vIIbxMiIalWdpty3z1J' WHERE user_id = '5f30b299-cede-4eb9-87a0-f99e4050716a';
UPDATE general_feedback SET user_id = 'user_3Iif9I63vIIbxMiIalWdpty3z1J' WHERE user_id = '5f30b299-cede-4eb9-87a0-f99e4050716a';

-- Updating user: yash@gmail.com
UPDATE profiles SET id = 'user_3Iif9FDrVDdzbO0rB9AQf8nc17A' WHERE id = '9adbdb3e-3f86-4f86-a771-abe1f18ddbe6';
UPDATE reports SET user_id = 'user_3Iif9FDrVDdzbO0rB9AQf8nc17A' WHERE user_id = '9adbdb3e-3f86-4f86-a771-abe1f18ddbe6';
UPDATE payments SET user_id = 'user_3Iif9FDrVDdzbO0rB9AQf8nc17A' WHERE user_id = '9adbdb3e-3f86-4f86-a771-abe1f18ddbe6';
UPDATE report_feedback SET user_id = 'user_3Iif9FDrVDdzbO0rB9AQf8nc17A' WHERE user_id = '9adbdb3e-3f86-4f86-a771-abe1f18ddbe6';
UPDATE general_feedback SET user_id = 'user_3Iif9FDrVDdzbO0rB9AQf8nc17A' WHERE user_id = '9adbdb3e-3f86-4f86-a771-abe1f18ddbe6';

-- Updating user: yashpawar9927@gmail.com
UPDATE profiles SET id = 'user_3Iif97KcTX6zZrtwuBKeBMmKFVC' WHERE id = 'cfadd64a-230e-4266-b7fa-d052258da6d2';
UPDATE reports SET user_id = 'user_3Iif97KcTX6zZrtwuBKeBMmKFVC' WHERE user_id = 'cfadd64a-230e-4266-b7fa-d052258da6d2';
UPDATE payments SET user_id = 'user_3Iif97KcTX6zZrtwuBKeBMmKFVC' WHERE user_id = 'cfadd64a-230e-4266-b7fa-d052258da6d2';
UPDATE report_feedback SET user_id = 'user_3Iif97KcTX6zZrtwuBKeBMmKFVC' WHERE user_id = 'cfadd64a-230e-4266-b7fa-d052258da6d2';
UPDATE general_feedback SET user_id = 'user_3Iif97KcTX6zZrtwuBKeBMmKFVC' WHERE user_id = 'cfadd64a-230e-4266-b7fa-d052258da6d2';

-- Updating user: amazeai0016@gmail.com
UPDATE profiles SET id = 'user_3Iif97b7Llkdm5d6ePc7UIdXtvK' WHERE id = '31f62d3d-505c-4918-be86-5c83d940ed00';
UPDATE reports SET user_id = 'user_3Iif97b7Llkdm5d6ePc7UIdXtvK' WHERE user_id = '31f62d3d-505c-4918-be86-5c83d940ed00';
UPDATE payments SET user_id = 'user_3Iif97b7Llkdm5d6ePc7UIdXtvK' WHERE user_id = '31f62d3d-505c-4918-be86-5c83d940ed00';
UPDATE report_feedback SET user_id = 'user_3Iif97b7Llkdm5d6ePc7UIdXtvK' WHERE user_id = '31f62d3d-505c-4918-be86-5c83d940ed00';
UPDATE general_feedback SET user_id = 'user_3Iif97b7Llkdm5d6ePc7UIdXtvK' WHERE user_id = '31f62d3d-505c-4918-be86-5c83d940ed00';

-- Updating user: hemant@gmail.com
UPDATE profiles SET id = 'user_3Iif9CnuWikO3WW9VH41LsEelwF' WHERE id = '1b094a51-42c8-43d6-9361-5ea545897ec1';
UPDATE reports SET user_id = 'user_3Iif9CnuWikO3WW9VH41LsEelwF' WHERE user_id = '1b094a51-42c8-43d6-9361-5ea545897ec1';
UPDATE payments SET user_id = 'user_3Iif9CnuWikO3WW9VH41LsEelwF' WHERE user_id = '1b094a51-42c8-43d6-9361-5ea545897ec1';
UPDATE report_feedback SET user_id = 'user_3Iif9CnuWikO3WW9VH41LsEelwF' WHERE user_id = '1b094a51-42c8-43d6-9361-5ea545897ec1';
UPDATE general_feedback SET user_id = 'user_3Iif9CnuWikO3WW9VH41LsEelwF' WHERE user_id = '1b094a51-42c8-43d6-9361-5ea545897ec1';

-- Updating user: yashpawar1122@gmail.com
UPDATE profiles SET id = 'user_3Iif96SFwHk3x8nZXo6OIVlxjH4' WHERE id = 'e91eb430-d00a-48a9-bcbe-cdba6761d55b';
UPDATE reports SET user_id = 'user_3Iif96SFwHk3x8nZXo6OIVlxjH4' WHERE user_id = 'e91eb430-d00a-48a9-bcbe-cdba6761d55b';
UPDATE payments SET user_id = 'user_3Iif96SFwHk3x8nZXo6OIVlxjH4' WHERE user_id = 'e91eb430-d00a-48a9-bcbe-cdba6761d55b';
UPDATE report_feedback SET user_id = 'user_3Iif96SFwHk3x8nZXo6OIVlxjH4' WHERE user_id = 'e91eb430-d00a-48a9-bcbe-cdba6761d55b';
UPDATE general_feedback SET user_id = 'user_3Iif96SFwHk3x8nZXo6OIVlxjH4' WHERE user_id = 'e91eb430-d00a-48a9-bcbe-cdba6761d55b';

-- Updating user: pawarvedant0008@gmail.com
UPDATE profiles SET id = 'user_3Iif8zy62RD4YTpG4XOEFc3WHE3' WHERE id = '62d6d351-e24e-4807-b94a-2459fbee636e';
UPDATE reports SET user_id = 'user_3Iif8zy62RD4YTpG4XOEFc3WHE3' WHERE user_id = '62d6d351-e24e-4807-b94a-2459fbee636e';
UPDATE payments SET user_id = 'user_3Iif8zy62RD4YTpG4XOEFc3WHE3' WHERE user_id = '62d6d351-e24e-4807-b94a-2459fbee636e';
UPDATE report_feedback SET user_id = 'user_3Iif8zy62RD4YTpG4XOEFc3WHE3' WHERE user_id = '62d6d351-e24e-4807-b94a-2459fbee636e';
UPDATE general_feedback SET user_id = 'user_3Iif8zy62RD4YTpG4XOEFc3WHE3' WHERE user_id = '62d6d351-e24e-4807-b94a-2459fbee636e';

-- Updating user: piyushsidhu89@gmail.com
UPDATE profiles SET id = 'user_3Iif95whBdiW5yUh3cAotjuiA50' WHERE id = '2edc26cd-7117-4d61-80c1-7d41b0bb5181';
UPDATE reports SET user_id = 'user_3Iif95whBdiW5yUh3cAotjuiA50' WHERE user_id = '2edc26cd-7117-4d61-80c1-7d41b0bb5181';
UPDATE payments SET user_id = 'user_3Iif95whBdiW5yUh3cAotjuiA50' WHERE user_id = '2edc26cd-7117-4d61-80c1-7d41b0bb5181';
UPDATE report_feedback SET user_id = 'user_3Iif95whBdiW5yUh3cAotjuiA50' WHERE user_id = '2edc26cd-7117-4d61-80c1-7d41b0bb5181';
UPDATE general_feedback SET user_id = 'user_3Iif95whBdiW5yUh3cAotjuiA50' WHERE user_id = '2edc26cd-7117-4d61-80c1-7d41b0bb5181';

-- Updating user: rs12853@gmail.com
UPDATE profiles SET id = 'user_3Iif8tIhh7a0AoeTTU39BnFipgc' WHERE id = '04993d3f-2ce1-4c8c-9b62-c1bec3982372';
UPDATE reports SET user_id = 'user_3Iif8tIhh7a0AoeTTU39BnFipgc' WHERE user_id = '04993d3f-2ce1-4c8c-9b62-c1bec3982372';
UPDATE payments SET user_id = 'user_3Iif8tIhh7a0AoeTTU39BnFipgc' WHERE user_id = '04993d3f-2ce1-4c8c-9b62-c1bec3982372';
UPDATE report_feedback SET user_id = 'user_3Iif8tIhh7a0AoeTTU39BnFipgc' WHERE user_id = '04993d3f-2ce1-4c8c-9b62-c1bec3982372';
UPDATE general_feedback SET user_id = 'user_3Iif8tIhh7a0AoeTTU39BnFipgc' WHERE user_id = '04993d3f-2ce1-4c8c-9b62-c1bec3982372';

-- Updating user: shreyamaurya832006@gmail.com
UPDATE profiles SET id = 'user_3Iif8t1vDS0iJQGNLnRjzM3aYXr' WHERE id = '5800b391-5a3a-4ec0-87c8-0b5496d7ff16';
UPDATE reports SET user_id = 'user_3Iif8t1vDS0iJQGNLnRjzM3aYXr' WHERE user_id = '5800b391-5a3a-4ec0-87c8-0b5496d7ff16';
UPDATE payments SET user_id = 'user_3Iif8t1vDS0iJQGNLnRjzM3aYXr' WHERE user_id = '5800b391-5a3a-4ec0-87c8-0b5496d7ff16';
UPDATE report_feedback SET user_id = 'user_3Iif8t1vDS0iJQGNLnRjzM3aYXr' WHERE user_id = '5800b391-5a3a-4ec0-87c8-0b5496d7ff16';
UPDATE general_feedback SET user_id = 'user_3Iif8t1vDS0iJQGNLnRjzM3aYXr' WHERE user_id = '5800b391-5a3a-4ec0-87c8-0b5496d7ff16';

-- Updating user: w9567979@gmail.com
UPDATE profiles SET id = 'user_3Iif8n6EFs01KLdnufJa6QdvyCq' WHERE id = 'e4ccc3e9-0d63-4d9c-957d-a93017404769';
UPDATE reports SET user_id = 'user_3Iif8n6EFs01KLdnufJa6QdvyCq' WHERE user_id = 'e4ccc3e9-0d63-4d9c-957d-a93017404769';
UPDATE payments SET user_id = 'user_3Iif8n6EFs01KLdnufJa6QdvyCq' WHERE user_id = 'e4ccc3e9-0d63-4d9c-957d-a93017404769';
UPDATE report_feedback SET user_id = 'user_3Iif8n6EFs01KLdnufJa6QdvyCq' WHERE user_id = 'e4ccc3e9-0d63-4d9c-957d-a93017404769';
UPDATE general_feedback SET user_id = 'user_3Iif8n6EFs01KLdnufJa6QdvyCq' WHERE user_id = 'e4ccc3e9-0d63-4d9c-957d-a93017404769';

-- Updating user: bharatp22@gmail.com
UPDATE profiles SET id = 'user_3Iif8nafxORZOy0fCx0EX6caSAN' WHERE id = '88d2dddc-bb00-4150-bc23-6448ff48058b';
UPDATE reports SET user_id = 'user_3Iif8nafxORZOy0fCx0EX6caSAN' WHERE user_id = '88d2dddc-bb00-4150-bc23-6448ff48058b';
UPDATE payments SET user_id = 'user_3Iif8nafxORZOy0fCx0EX6caSAN' WHERE user_id = '88d2dddc-bb00-4150-bc23-6448ff48058b';
UPDATE report_feedback SET user_id = 'user_3Iif8nafxORZOy0fCx0EX6caSAN' WHERE user_id = '88d2dddc-bb00-4150-bc23-6448ff48058b';
UPDATE general_feedback SET user_id = 'user_3Iif8nafxORZOy0fCx0EX6caSAN' WHERE user_id = '88d2dddc-bb00-4150-bc23-6448ff48058b';

-- Updating user: sanjaykumar9792819078@gmail.com
UPDATE profiles SET id = 'user_3Iif8orZtkh8yghNNoy9irNRoCp' WHERE id = '2dd0ac3e-65ba-453c-9906-c5b10786ea94';
UPDATE reports SET user_id = 'user_3Iif8orZtkh8yghNNoy9irNRoCp' WHERE user_id = '2dd0ac3e-65ba-453c-9906-c5b10786ea94';
UPDATE payments SET user_id = 'user_3Iif8orZtkh8yghNNoy9irNRoCp' WHERE user_id = '2dd0ac3e-65ba-453c-9906-c5b10786ea94';
UPDATE report_feedback SET user_id = 'user_3Iif8orZtkh8yghNNoy9irNRoCp' WHERE user_id = '2dd0ac3e-65ba-453c-9906-c5b10786ea94';
UPDATE general_feedback SET user_id = 'user_3Iif8orZtkh8yghNNoy9irNRoCp' WHERE user_id = '2dd0ac3e-65ba-453c-9906-c5b10786ea94';

-- 3. Re-add foreign key constraints
ALTER TABLE reports ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE report_feedback ADD CONSTRAINT report_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE general_feedback ADD CONSTRAINT general_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

COMMIT;

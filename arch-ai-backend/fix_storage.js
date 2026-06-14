const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xwcjaqnbhrjohpbnjxzb',
  password: 'Jakarta123!456',
  ssl: { rejectUnauthorized: false }
});

async function fixStorage() {
  try {
    console.log('Inserting storage policies for avatar bucket...');
    
    // Check if bucket exists
    await pool.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('avatar', 'avatar', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    
    // Add policies
    await pool.query(`
      CREATE POLICY "Avatar Public Select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatar');
    `).catch(e => console.log('Policy Select might already exist: ', e.message));

    await pool.query(`
      CREATE POLICY "Avatar Public Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'avatar');
    `).catch(e => console.log('Policy Insert might already exist: ', e.message));

    await pool.query(`
      CREATE POLICY "Avatar Public Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'avatar');
    `).catch(e => console.log('Policy Update might already exist: ', e.message));
    
    await pool.query(`
      CREATE POLICY "Avatar Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'avatar');
    `).catch(e => console.log('Policy Delete might already exist: ', e.message));

    console.log('✅ Storage policies applied successfully.');
    
    // Also check if avatar_id is large enough in users table
    await pool.query(`ALTER TABLE public.users ALTER COLUMN avatar_id TYPE VARCHAR(1000);`);
    console.log('✅ Altered users.avatar_id length.');
    
  } catch (err) {
    console.error('🔥 Error:', err);
  } finally {
    pool.end();
  }
}

fixStorage();

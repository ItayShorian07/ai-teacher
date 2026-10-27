import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('account migrations enforce usernames, grades, owner access and atomic limits', async () => {
  const db = new PGlite();
  const alice = '00000000-0000-4000-8000-000000000001';
  const bob = '00000000-0000-4000-8000-000000000002';
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql as
        $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
      insert into auth.users values
        ('${alice}','alice@example.test',now()),('${bob}','bob@example.test',null);
    `);
    await db.exec(
      await readFile(
        new URL('../database/002_profiles.sql', import.meta.url),
        'utf8',
      ),
    );
    const migration = await readFile(
      new URL('../database/005_username_login.sql', import.meta.url),
      'utf8',
    );
    await db.exec(migration);
    await db.exec(migration); // Migration is safe to reapply.
    const gradeMigration = await readFile(
      new URL('../database/006_profile_grade.sql', import.meta.url),
      'utf8',
    );
    await db.exec(gradeMigration);
    await db.exec(gradeMigration);
    await db.query(
      `insert into public.profiles(id,username,first_name,last_name,city,age,grade,phone,locale)
      values ($1,'alice','Alice','One','Haifa',18,11,'+972501234567','en'),($2,'bob','Bob','Two','Haifa',18,11,'+972501234568','en')`,
      [alice, bob],
    );
    await assert.rejects(
      db.query(`update public.profiles set grade=13 where id=$1`, [alice]),
      /check constraint/i,
    );
    await assert.rejects(
      db.query(`update public.profiles set username='alice' where id=$1`, [
        bob,
      ]),
      /unique/i,
    );
    await assert.rejects(
      db.query(`update public.profiles set username='ALICE' where id=$1`, [
        bob,
      ]),
      /check constraint/i,
    );
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(
        db.query(`select public.resolve_login_email('alice')`),
        /permission denied/i,
      );
      await assert.rejects(
        db.query(
          `select public.consume_password_login_limit($1,'identifier')`,
          ['a'.repeat(64)],
        ),
        /permission denied/i,
      );
      await db.exec('reset role');
    }
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub='${alice}'`,
    );
    const own = await db.query(`select username from public.profiles`);
    assert.deepEqual(own.rows, [{ username: 'alice' }]);
    assert.equal(
      (
        await db.query(
          `update public.profiles set username='hijacked' where id=$1 returning id`,
          [bob],
        )
      ).rows.length,
      0,
    );
    await db.exec('reset role; set role service_role');
    assert.deepEqual(
      (await db.query(`select public.resolve_login_email(' ALICE ') as email`))
        .rows,
      [{ email: 'alice@example.test' }],
    );
    assert.deepEqual(
      (await db.query(`select public.resolve_login_email('bob') as email`))
        .rows,
      [{ email: null }],
    );
    assert.deepEqual(
      (await db.query(`select public.resolve_login_email('missing') as email`))
        .rows,
      [{ email: null }],
    );
    const requests = await Promise.all(
      Array.from({ length: 11 }, () =>
        db.query<{ allowed: boolean }>(
          `select public.consume_password_login_limit($1,'identifier') as allowed`,
          ['a'.repeat(64)],
        ),
      ),
    );
    assert.equal(
      requests.filter((result) => result.rows[0].allowed).length,
      10,
    );
  } finally {
    await db.close();
  }
});

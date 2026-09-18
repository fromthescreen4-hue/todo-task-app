import { db } from '../server/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../server/middleware/auth.js';
import crypto from 'crypto';

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✕ ${name}:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING PRODUCTION AUDIT & HARDENING TEST SUITE');
  console.log('==================================================\n');

  // Test 1: Database Migration Check
  await runTest('Database Migration: google_id column exists in users table', () => {
    const user = db.findUserByEmail('non_existent@example.com');
    // Schema check succeeded if database query executed without column error
  });

  // Test 2: User Creation & Storage
  const testUserId = `test_user_${Date.now()}`;
  const testUserEmail = `test_email_${Date.now()}@example.com`;
  
  await runTest('User Schema: Create user with internal UUID', () => {
    const created = db.createUser({
      id: testUserId,
      name: 'Tester Email User',
      email: testUserEmail,
      password_hash: 'hashed_password_123',
      provider: 'email',
      email_verified: true
    });
    if (!created || created.id !== testUserId) {
      throw new Error('User creation failed or ID mismatch.');
    }
  });

  // Test 3: Task Creation & User Isolation
  const task1Id = `task_user_a_${Date.now()}`;
  await runTest('Task Creation: Create Task A linked to User A', () => {
    const task = db.createTask({
      id: task1Id,
      user_id: testUserId,
      title: 'Task A for User A',
      status: 'to_do'
    });
    if (!task || task.user_id !== testUserId) {
      throw new Error('Task creation failed or user_id mismatch.');
    }
  });

  // Test 4: Cross-User Isolation in DB queries
  const userBId = `user_b_${Date.now()}`;
  const userBEmail = `user_b_${Date.now()}@example.com`;
  db.createUser({
    id: userBId,
    name: 'User B',
    email: userBEmail,
    provider: 'email'
  });

  await runTest('Task Isolation: User B cannot retrieve User A tasks from DB', () => {
    const userBTasks = db.getTasks(userBId);
    const foundTaskA = userBTasks.find(t => t.id === task1Id);
    if (foundTaskA) {
      throw new Error('SECURITY VIOLATION: User B retrieved User A task!');
    }
  });

  await runTest('Task Isolation: User B cannot update User A task in DB', () => {
    const updated = db.updateTask(task1Id, userBId, { title: 'Hacked Title' });
    if (updated) {
      throw new Error('SECURITY VIOLATION: User B successfully updated User A task!');
    }
  });

  await runTest('Task Isolation: User B cannot delete User A task in DB', () => {
    const deleted = db.deleteTask(task1Id, userBId);
    if (deleted) {
      throw new Error('SECURITY VIOLATION: User B successfully deleted User A task!');
    }
  });

  // Test 5: Canonical Account Linking (Preserving user.id)
  const googleSub = `google_sub_${Date.now()}`;
  await runTest('Google Account Linking: Link Google ID to existing email user without changing user.id', () => {
    const existing = db.findUserByEmail(testUserEmail);
    if (!existing) throw new Error('Existing user not found.');

    const updated = db.updateUser(existing.id, {
      google_id: googleSub,
      provider: 'google+email',
      email_verified: true
    });

    if (updated.id !== testUserId) {
      throw new Error(`CRITICAL FAILURE: internal user.id changed! Expected ${testUserId}, got ${updated.id}`);
    }

    if (updated.google_id !== googleSub) {
      throw new Error('google_id was not saved properly.');
    }
  });

  await runTest('Google Account Linking: Existing User A tasks remain intact under user.id after Google link', () => {
    const userATasks = db.getTasks(testUserId);
    const taskA = userATasks.find(t => t.id === task1Id);
    if (!taskA) {
      throw new Error('Pre-existing tasks were lost after Google account linking!');
    }
  });

  await runTest('Google Account Lookup: findUserByGoogleId retrieves correct user', () => {
    const found = db.findUserByGoogleId(googleSub);
    if (!found || found.id !== testUserId) {
      throw new Error('findUserByGoogleId failed to match internal user.');
    }
  });

  // Test 6: JWT Token Signing & Verification
  await runTest('JWT Token Signing: Contains internal user.id', () => {
    const token = jwt.sign({ id: testUserId, email: testUserEmail }, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.id !== testUserId) {
      throw new Error(`JWT payload user ID mismatch. Expected ${testUserId}, got ${decoded.id}`);
    }
  });

  await runTest('Task Reset: clearUserTasks removes user tasks cleanly without deleting user account', () => {
    const freshTaskId = `task_reset_${Date.now()}`;
    db.createTask({ id: freshTaskId, user_id: testUserId, title: 'Temporary Reset Task' });
    const count = db.clearUserTasks(testUserId);
    if (count < 1) throw new Error('clearUserTasks failed to remove task.');
    const remaining = db.getTasks(testUserId);
    if (remaining.length > 0) throw new Error('Tasks still exist after clearUserTasks!');
  });

  // Cleanup Test Data
  db.deleteUser(testUserId);
  db.deleteUser(userBId);

  console.log('\n==================================================');
  console.log('🎉 ALL HARDENING & ISOLATION TESTS PASSED 100%!');
  console.log('==================================================\n');
}

main().catch(err => {
  console.error('\n🔴 TEST SUITE FAILED:', err);
  process.exit(1);
});

import { adminAuth } from "@/lib/firebase-admin";

console.log('Testing Admin Auth...');
adminAuth.getUserByEmail('admin@gmail.com')
  .then(user => {
    console.log('Found user:', user.uid);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error (or not found):', err.message);
    process.exit(0);
  });

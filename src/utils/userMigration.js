/**
 * Firestore User Migration Script
 * Migrates existing users to new schema with status, department, and timestamps
 * 
 * Run this script ONCE after deploying the new authentication system
 * 
 * Usage:
 * 1. Make sure you're logged in as admin
 * 2. Open browser console on the app
 * 3. Copy and paste this entire script
 * 4. Call: await migrateUsers()
 */

import { db } from './services/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Migrate all existing users to new schema
 */
export const migrateUsers = async () => {
    try {
        console.log('🔄 Starting user migration...');

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;
        let migratedCount = 0;
        let skippedCount = 0;

        console.log(`📊 Found ${totalUsers} users to migrate`);

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;

            // Check if user already has new schema fields
            if (userData.status && userData.createdAt) {
                console.log(`⏭️  Skipping ${userData.email} - already migrated`);
                skippedCount++;
                continue;
            }

            // Prepare migration data
            const migrationData = {
                // Add status if missing (default to active)
                status: userData.status || 'active',

                // Add department if missing
                department: userData.department || 'General',

                // Keep existing role or default to employee
                role: userData.role || 'employee',

                // Add timestamps if missing
                createdAt: userData.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp(),

                // Add session timeout (30 minutes default)
                sessionTimeout: userData.sessionTimeout || 30
            };

            // Update user document
            await updateDoc(doc(db, 'users', userId), migrationData);

            migratedCount++;
            console.log(`✅ Migrated ${userData.email || userId} - Role: ${migrationData.role}, Status: ${migrationData.status}`);
        }

        console.log('');
        console.log('🎉 Migration completed!');
        console.log(`✅ Migrated: ${migratedCount}`);
        console.log(`⏭️  Skipped: ${skippedCount}`);
        console.log(`📊 Total: ${totalUsers}`);
        console.log('');
        console.log('⚠️  IMPORTANT: Update Firestore security rules next!');

        return {
            success: true,
            migrated: migratedCount,
            skipped: skippedCount,
            total: totalUsers
        };
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create initial admin user (if needed)
 * @param {string} email - Admin email
 * @param {string} userId - User ID from Firebase Auth
 */
export const createAdminUser = async (email, userId) => {
    try {
        const userData = {
            email,
            role: 'admin',
            status: 'active',
            department: 'Management',
            fullName: 'System Administrator',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            sessionTimeout: 30
        };

        await updateDoc(doc(db, 'users', userId), userData);

        console.log('✅ Admin user created:', email);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to create admin:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check migration status
 */
export const checkMigrationStatus = async () => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;
        let migrated = 0;
        let needsMigration = 0;

        usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.status && data.createdAt) {
                migrated++;
            } else {
                needsMigration++;
            }
        });

        console.log('📊 Migration Status:');
        console.log(`Total Users: ${totalUsers}`);
        console.log(`Migrated: ${migrated}`);
        console.log(`Needs Migration: ${needsMigration}`);
        console.log(`Progress: ${((migrated / totalUsers) * 100).toFixed(1)}%`);

        return {
            total: totalUsers,
            migrated,
            needsMigration,
            complete: needsMigration === 0
        };
    } catch (error) {
        console.error('Error checking migration status:', error);
        return null;
    }
};

// Export for use in browser console or admin panel
export default {
    migrateUsers,
    createAdminUser,
    checkMigrationStatus
};

// Browser console helper
if (typeof window !== 'undefined') {
    window.userMigration = {
        migrate: migrateUsers,
        createAdmin: createAdminUser,
        checkStatus: checkMigrationStatus
    };
    console.log('💡 User migration tools loaded! Use:');
    console.log('   - window.userMigration.migrate()');
    console.log('   - window.userMigration.checkStatus()');
    console.log('   - window.userMigration.createAdmin(email, userId)');
}

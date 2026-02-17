import { DataSource } from 'typeorm';
import { AppDataSource } from './src/database/data-source';

async function fixEnumName() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    // Check if the wrong enum exists
    const wrongEnumCheck = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role_enum'
      )
    `);

    if (wrongEnumCheck[0].exists) {
      console.log('Found wrong enum name (user_role_enum), fixing...');

      // Rename the enum type
      await AppDataSource.query(`
        ALTER TYPE "user_role_enum" RENAME TO "users_role_enum"
      `);

      console.log('✅ Enum renamed from user_role_enum to users_role_enum');
    } else {
      console.log('✅ Enum already has correct name (users_role_enum)');
    }

    await AppDataSource.destroy();
    console.log('✅ Database fix complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing enum:', error);
    process.exit(1);
  }
}

fixEnumName();

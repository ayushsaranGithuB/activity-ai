import { migrateBackupJsonToSQLite, getAllActivities, getAllCategories, getAggregatesByPeriod } from './db';

async function runMigration() {
    try {
        console.log('Starting migration from backup JSON to SQLite...');
        const result = await migrateBackupJsonToSQLite();
        console.log('Migration complete:', result);

        // Verify data
        const activities = await getAllActivities();
        const categories = await getAllCategories();
        const aggregatesWeek = await getAggregatesByPeriod('week');
        const aggregatesMonth = await getAggregatesByPeriod('month');
        const aggregatesYear = await getAggregatesByPeriod('year');

        console.log('Activities:', activities);
        console.log('Categories:', categories);
        console.log('Aggregates (week):', aggregatesWeek);
        console.log('Aggregates (month):', aggregatesMonth);
        console.log('Aggregates (year):', aggregatesYear);
        console.log('Verification complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();

import 'reflect-metadata';
import { AppDataSource } from './config/ormconfig';

const main = async () => {
  try {
    // Initialize the data source
    await AppDataSource.initialize();

    // Optionally log a success message
    console.log('Data Source has been initialized.');

    // Sync schema with the database
    await AppDataSource.synchronize();

    console.log('Database schema synchronized.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Optionally close the data source
    await AppDataSource.destroy();
  }
};

main();

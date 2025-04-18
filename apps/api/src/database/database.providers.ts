import { connect, Mongoose } from 'mongoose';
import { environment } from '../environments/environment';


export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<Mongoose> => connect(environment.mongoDbUri)
  }
];

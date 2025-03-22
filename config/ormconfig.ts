import { DataSource } from 'typeorm';
import { User } from '../entity/User/user';
import { Referral } from '../entity/Referral/Refferal';
import { Log } from '../entity/log';
import { TempOtp } from '../entity/tempotp';
import { Role } from '../entity/User/roles';
require('dotenv').config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User,Log,TempOtp,Referral, Role],
  synchronize: true,
});
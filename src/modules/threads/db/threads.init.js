import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  database: 'resmemory',
  username: process.env.THREADS_MYSQL_USER_NAME,
  port: '3306',
  password: process.env.THREADS_MYSQL_PASSWORD,
  host: process.env.THREADS_MYSQL_HOST,
  dialect: 'mysql',
});
export default sequelize;

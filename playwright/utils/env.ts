import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}. Copie .env.example en .env puis configure-la.`);
  }
  return value;
}

export const env = {
  baseURL: required('BASE_URL'),
  apiBaseURL: required('API_BASE_URL'),
  userEmail: required('USER_EMAIL'),
  userPassword: required('USER_PASSWORD'),
  adminEmail: process.env.ADMIN_EMAIL || required('USER_EMAIL'),
  adminPassword: process.env.ADMIN_PASSWORD || required('USER_PASSWORD'),
  roleUserEmail: required('QA_USER_EMAIL'),
  roleUserPassword: required('QA_USER_PASSWORD'),
};

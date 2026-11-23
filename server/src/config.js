import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://sigpiar:sigpiar@localhost:5432/sigpiar',
  jwtSecret: process.env.JWT_SECRET || 'clave-desarrollo-no-usar-en-produccion',
  jwtExpires: process.env.JWT_EXPIRES || '8h',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

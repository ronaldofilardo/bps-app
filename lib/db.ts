import { neon } from '@neondatabase/serverless'
import pg from 'pg'

const { Pool } = pg

// Detecta o ambiente
const environment = process.env.NODE_ENV || 'development'
const isDevelopment = environment === 'development'
const isTest = environment === 'test'
const isProduction = environment === 'production'

// Tipo para as queries
export type QueryResult<T = any> = {
  rows: T[]
  rowCount: number
}

// Conexão Neon (Produção)
let neonSql: ReturnType<typeof neon> | null = null

if (isProduction && process.env.DATABASE_URL) {
  neonSql = neon(process.env.DATABASE_URL)
}

// Conexão PostgreSQL Local (Desenvolvimento e Testes)
let localPool: pg.Pool | null = null

// Selecionar URL do banco baseado no ambiente
const getDatabaseUrl = () => {
  if (isTest && process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL
  } else if (isDevelopment && process.env.LOCAL_DATABASE_URL) {
    return process.env.LOCAL_DATABASE_URL
  }
  return null
}

const databaseUrl = getDatabaseUrl()

if ((isDevelopment || isTest) && databaseUrl) {
  localPool = new Pool({
    connectionString: databaseUrl,
    max: isTest ? 5 : 10, // Menos conexões para testes
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
}

// Função unificada de query
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    if ((isDevelopment || isTest) && localPool) {
      // PostgreSQL Local (Desenvolvimento e Testes)
      const result = await localPool.query(text, params)
      const duration = Date.now() - start
      console.log(`[DEBUG] Query local (${duration}ms): ${text.substring(0, 100)}...`)
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      }
    } else if (isProduction && neonSql) {
      // Neon Database (Produção)
      // Garantir search_path em produção
      if (!text.trim().toLowerCase().startsWith('set search_path')) {
        await neonSql('SET search_path TO public;')
      }
      const rows = await neonSql(text, params || [])
      const duration = Date.now() - start
      console.log(`[DEBUG] Query Neon (${duration}ms): ${text.substring(0, 100)}...`)
      return {
        rows: rows as T[],
        rowCount: Array.isArray(rows) ? rows.length : 0,
      }
    } else {
      throw new Error(`Nenhuma conexão configurada para ambiente: ${environment}`)
    }
  } catch (error) {
    const duration = Date.now() - start
    console.error(`Erro na query do banco (${environment}, ${duration}ms):`, error)
    throw error
  }
}

// Função para testar conexão
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now, current_database() as database')
    console.log(`✅ Conexão OK [${environment}]:`, result.rows[0])
    return true
  } catch (error) {
    console.error(`❌ Erro ao conectar [${environment}]:`, error)
    return false
  }
}

// Função para obter informações do ambiente atual
export function getDatabaseInfo() {
  return {
    environment,
    isDevelopment,
    isTest,
    isProduction,
    databaseUrl: databaseUrl ? databaseUrl.replace(/password=[^&\s]+/g, 'password=***') : 'N/A',
    hasLocalPool: !!localPool,
    hasNeonSql: !!neonSql,
  }
}

// Fechar pool local (útil para testes)
export async function closePool() {
  if (localPool) {
    await localPool.end()
    localPool = null
  }
}

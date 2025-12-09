# Script PowerShell para sincronizar dados do banco de desenvolvimento para produção
# Uso: ./sync-dev-to-prod.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SINCRONIZAÇÃO DEV -> PROD" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# URLs de conexão
$localConnString = "postgresql://postgres:123456@localhost:5432/nr-bps_db"
$prodConnString = "postgresql://neondb_owner:npg_NfJGO8vck9ob@ep-steep-credit-acckkvg4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Arquivos temporários
$tempDir = "temp_sync"
$schemaFile = "$tempDir/schema_export.sql"
$dataFile = "$tempDir/data_export.sql"

# Verifica se o psql está disponível
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql não encontrado. Instale o PostgreSQL Client Tools."
    exit 1
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Error "pg_dump não encontrado. Instale o PostgreSQL Client Tools."
    exit 1
}

# Cria diretório temporário
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

Write-Host "1. Exportando schema do banco de desenvolvimento..." -ForegroundColor Yellow
$env:PGPASSWORD = "123456"
pg_dump -h localhost -U postgres -d nr-bps_db --schema-only --no-owner --no-acl -f $schemaFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao exportar schema."
    exit 1
}
Write-Host "✅ Schema exportado" -ForegroundColor Green

Write-Host ""
Write-Host "2. Exportando dados do banco de desenvolvimento..." -ForegroundColor Yellow
pg_dump -h localhost -U postgres -d nr-bps_db --data-only --no-owner --no-acl `
    --table=clinicas `
    --table=empresas_clientes `
    --table=funcionarios `
    --table=avaliacoes `
    --table=respostas `
    --table=resultados `
    --table=lotes_avaliacao `
    --table=lotes_avaliacao_funcionarios `
    --table=laudos `
    -f $dataFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao exportar dados."
    exit 1
}
Write-Host "✅ Dados exportados" -ForegroundColor Green

Write-Host ""
Write-Host "3. Aplicando schema no banco de produção..." -ForegroundColor Yellow
Write-Host "   (Isso irá recriar as tabelas)" -ForegroundColor Gray
$env:PGPASSWORD = "npg_NfJGO8vck9ob"

# Primeiro, configurar o search_path e drop das tabelas existentes
$dropScript = @"
SET search_path TO public;
DROP TABLE IF EXISTS laudos CASCADE;
DROP TABLE IF EXISTS lotes_avaliacao_funcionarios CASCADE;
DROP TABLE IF EXISTS lotes_avaliacao CASCADE;
DROP TABLE IF EXISTS resultados CASCADE;
DROP TABLE IF EXISTS respostas CASCADE;
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS empresas_clientes CASCADE;
DROP TABLE IF EXISTS clinicas CASCADE;
DROP TABLE IF EXISTS questao_condicoes CASCADE;
DROP TABLE IF EXISTS clinicas_empresas CASCADE;
DROP TABLE IF EXISTS relatorio_templates CASCADE;
DROP TABLE IF EXISTS analise_estatistica CASCADE;
"@

$dropScript | psql $prodConnString

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Aviso ao dropar tabelas (pode ser normal se não existirem)."
}

# Aplica o schema
psql $prodConnString -f $schemaFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao aplicar schema."
    exit 1
}
Write-Host "✅ Schema aplicado" -ForegroundColor Green

Write-Host ""
Write-Host "4. Importando dados para produção..." -ForegroundColor Yellow
psql $prodConnString -f $dataFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao importar dados."
    exit 1
}
Write-Host "✅ Dados importados" -ForegroundColor Green

Write-Host ""
Write-Host "5. Atualizando sequences..." -ForegroundColor Yellow
$sequenceScript = @"
SET search_path TO public;
SELECT setval('clinicas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clinicas));
SELECT setval('empresas_clientes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM empresas_clientes));
SELECT setval('funcionarios_id_seq', (SELECT COALESCE(MAX(id), 1) FROM funcionarios));
SELECT setval('avaliacoes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM avaliacoes));
SELECT setval('respostas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM respostas));
SELECT setval('resultados_id_seq', (SELECT COALESCE(MAX(id), 1) FROM resultados));
"@

$sequenceScript | psql $prodConnString

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Aviso ao atualizar sequences."
}
Write-Host "✅ Sequences atualizadas" -ForegroundColor Green

Write-Host ""
Write-Host "6. Verificando sincronização..." -ForegroundColor Yellow

$verifyScript = @"
SET search_path TO public;
SELECT 'Clínicas' as tabela, COUNT(*) as registros FROM clinicas
UNION ALL
SELECT 'Empresas', COUNT(*) FROM empresas_clientes
UNION ALL
SELECT 'Funcionários', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'Avaliações', COUNT(*) FROM avaliacoes
UNION ALL
SELECT 'Respostas', COUNT(*) FROM respostas
UNION ALL
SELECT 'Resultados', COUNT(*) FROM resultados;
"@

Write-Host ""
Write-Host "Contagem de registros em PRODUÇÃO:" -ForegroundColor Cyan
$verifyScript | psql $prodConnString

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ SINCRONIZAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Os dados de desenvolvimento foram copiados para produção." -ForegroundColor White
Write-Host "As APIs em produção agora usarão os mesmos dados." -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Teste o ambiente em: https://nr-bps-popup-clean.vercel.app" -ForegroundColor Gray
Write-Host "2. Verifique se as APIs estão funcionando" -ForegroundColor Gray
Write-Host "3. Faça login com os mesmos usuários de desenvolvimento" -ForegroundColor Gray
Write-Host ""

# Limpeza opcional
$cleanup = Read-Host "Deseja remover os arquivos temporários? (S/N)"
if ($cleanup -eq "S" -or $cleanup -eq "s") {
    Remove-Item -Recurse -Force $tempDir
    Write-Host "✅ Arquivos temporários removidos" -ForegroundColor Green
}

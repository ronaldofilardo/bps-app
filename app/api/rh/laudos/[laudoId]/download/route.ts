import { getSession } from "@/lib/session"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic';

export const GET = async (req: Request, { params }: { params: { laudoId: string } }) => {
  const session = await getSession()
  if (!session || (session.perfil !== 'rh' && session.perfil !== 'admin' && session.perfil !== 'master')) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }
  const user = session

  try {
    const laudoId = parseInt(params.laudoId)
    if (isNaN(laudoId)) {
      return NextResponse.json({ error: "ID do laudo inválido", success: false }, { status: 400 })
    }

    // Verificar se o laudo pertence à clínica do usuário
    const laudoQuery = await query(`
      SELECT
        l.id,
        l.lote_id,
        la.codigo,
        la.titulo,
        la.clinica_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 AND l.status = 'enviado'
    `, [laudoId])

    if (laudoQuery.rows.length === 0) {
      return NextResponse.json({ error: "Laudo não encontrado", success: false }, { status: 404 })
    }

    const laudo = laudoQuery.rows[0]

    // Verificar se o usuário tem acesso (mesma clínica)
    const userClinicaQuery = await query(`
      SELECT clinica_id FROM funcionarios WHERE cpf = $1
    `, [user.cpf])

    if (userClinicaQuery.rows[0].clinica_id !== laudo.clinica_id) {
      return NextResponse.json({ error: "Acesso negado ao laudo", success: false }, { status: 403 })
    }

    // Caminho do arquivo
    const filePath = laudo.caminho_arquivo || path.join(process.cwd(), 'public', 'laudos', `laudo-${laudo.lote_id}.pdf`)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Arquivo do laudo não encontrado", success: false }, { status: 404 })
    }

    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath)


    // Retornar o arquivo para download
    const fileName = `laudo-${laudo.codigo}.pdf`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('Erro ao fazer download do laudo:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
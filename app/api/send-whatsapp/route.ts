import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, name } = body

    // Validação básica (Sênior valida entrada)
    if (!phone || !name) {
      return NextResponse.json({ error: 'Telefone e nome são obrigatórios' }, { status: 400 })
    }

    // Limpeza do telefone (remove caracteres não numéricos)
    const cleanPhone = phone.replace(/\D/g, '')

    console.log(`[API] Iniciando processamento para: ${name} (${cleanPhone})`)

    // VERIFICAÇÃO DE AMBIENTE
    // Se tivermos a URL do Gateway configurada nas variáveis de ambiente, usamos ela.
    // Caso contrário, rodamos em modo "Simulação" (útil para demo e dev).
    const gatewayUrl = process.env.WHATSAPP_API_URL
    const gatewayToken = process.env.WHATSAPP_API_TOKEN

    if (gatewayUrl && gatewayToken) {
      console.log('[API] Conectando ao Gateway Real...')
      
      // Exemplo de estrutura padrão para Z-API ou Evolution API
      const response = await fetch(`${gatewayUrl}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayToken}`,
          'Client-Token': gatewayToken // Alguns usam Client-Token
        },
        body: JSON.stringify({
          phone: `55${cleanPhone}`, // Adicionando DDI Brasil
          message: `Olá ${name}! Confirmando seu agendamento no FlowReminder. Responda SIM para confirmar.`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[API] Erro no Gateway:', errorData)
        throw new Error('Falha no envio via Gateway')
      }

      console.log('[API] Mensagem enviada via Gateway!')
    } else {
      // MODO SIMULAÇÃO (Para quando você for vender a ideia sem gastar com API ainda)
      console.log('[API] Modo Simulação: Variáveis de ambiente não configuradas.')
      await new Promise((r) => setTimeout(r, 1000)) // Delay fake
      console.log('[API] Simulação concluída com sucesso.')
    }

    return NextResponse.json({ success: true, mode: gatewayUrl ? 'real' : 'simulation' })

  } catch (error) {
    console.error('[API] Erro interno:', error)
    return NextResponse.json({ error: 'Falha ao processar envio' }, { status: 500 })
  }
}
# 🍀 Tá Na Mão da SORTE - Bingo Online & Loteria Digital

Aplicativo completo de bingo online e loteria digital diária onde os participantes compram milhares (**0000 a 9999**) por apenas **R$ 2,00 cada** via **Pix (Mercado Pago)**.

O sistema gera automaticamente as 10.000 combinações possíveis sem repetição. Os sorteios acontecem **diariamente às 19:00h**, com premiação de **R$ 500,00**. Caso não haja ganhador, o prêmio acumula até domingo, quando a roleta gira até sair um vencedor e o acumulativo é zerado.

---

## 🎟️ Funcionalidades Implementadas

### 1. Compra de Bilhetes & Grade de 10.000 Milhares
- Lista e navegação fluida por todas as milhares disponíveis (**0000 a 9999**).
- Busca instantânea por milhar exata ou dígitos (ex: `1234`, `777`).
- Filtros por grupos de milhares (`0000-0999`, `1000-1999`, etc.), disponíveis, vendidos e meus bilhetes.
- **Surpresinha da Sorte**: botões para sortear automaticamente 1, 3, 5 ou 10 milhares aleatórias não vendidas.
- Carrinho flutuante com contagem de bilhetes e valor total a pagar.
- Usuário pode comprar quantos bilhetes quiser.

### 2. Integração com Mercado Pago (Pix) & Modo de Teste
- Geração de cobrança Pix com **QR Code** e **Código Copia e Cola**.
- **Modo de Teste (Sandbox) Ativo por Padrão**: Conforme solicitado, antes de subir para produção o sistema roda em modo de teste para validar transações, permitindo simular a aprovação instantânea do Pix sem gastar dinheiro real.
- **Cadastro pós-pagamento**: Modal para preenchimento de **Nome Completo**, **CPF** e **WhatsApp** com validação de formato.
- Confirmação imediata com recibo e emissão dos bilhetes oficiais.

### 3. Sorteio Automático às 19:00h
- Sorteador dinâmico de 4 algarismos (milhar, centena, dezena e unidade) com animação dramática de tambores e efeitos sonoros sintetizados.
- **Caso haja ganhador**:
  - Exibe o **primeiro nome** e os **4 dígitos finais do telefone** do vencedor (ex: `Carlos (xx) xxxxx-4321`).
  - Celebração com fanfarra sonora e chuva de confetes (`canvas-confetti`).
  - Disparo automático de notificação no WhatsApp para todos os cadastrados.
  - Mensagem exclusiva de parabenização enviada ao vencedor.
- **Caso não haja ganhador**:
  - O prêmio acumula para o próximo dia (+ R$ 500,00).
  - Notificação de acúmulo enviada no WhatsApp.
- **Domingo da Sorte**:
  - Aos domingos a roleta gira sucessivamente até sair um ganhador garantido e o acumulativo é zerado.

### 4. Mensagens Automáticas & WhatsApp Hub
- Disparo de lembrete diário antes das 19h: *“Ainda dá tempo de comprar seu bilhete para o sorteio de hoje!”*
- Disparo de resultado com identificação mascarada do ganhador.
- Mensagem de parabenização personalizada para o ganhador.
- Central de Mensagens no app com histórico, filtros e botões para **Abrir diretamente no WhatsApp Web** para testes práticos.
- Suporte para APIs oficiais (Twilio, WhatsApp Business, Evolution API, Z-API) e modo simulador.

### 5. Painel de Controle / Administração
- Métricas em tempo real: bilhetes vendidos, faturamento, participantes cadastrados e prêmio atual.
- Alternador de Modo de Teste / Produção.
- Gerador rápido de vendas simuladas (10 ou 50 bilhetes) para testes imediatos de sorteios com ganhadores.
- Ajuste manual do prêmio e botão de reset de fábrica.

---

## 🗄️ Estrutura do Banco de Dados (Supabase / PostgreSQL)

O arquivo [`supabase/schema.sql`](file:///c:/Users/firme/antigravity/wonderful-curie/supabase/schema.sql) contém o script SQL completo para ser executado no **SQL Editor** do Supabase:

- **`usuarios`**: `id (UUID)`, `nome_completo (TEXT)`, `cpf (TEXT único)`, `whatsapp (TEXT único)`, `data_cadastro (TIMESTAMP)`.
- **`sorteios`**: `id (UUID)`, `data_sorteio (TIMESTAMP)`, `numeros_sorteados (TEXT)`, `ganhador_id (FK)`, `premio (NUMERIC)`, `acumulado (BOOLEAN)`, `status (TEXT)`, `eh_domingo (BOOLEAN)`.
- **`bilhetes`**: `id (UUID)`, `numero_milhar (VARCHAR(4))`, `usuario_id (FK)`, `sorteio_id (FK)`, `data_compra (TIMESTAMP)`, `status_pagamento (BOOLEAN)`, `valor (NUMERIC)`.
- **`mensagens`**: `id (UUID)`, `usuario_id (FK)`, `conteudo (TEXT)`, `tipo (ENUM: lembrete, resultado, parabenizacao)`, `data_envio (TIMESTAMP)`.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ instalado.

### 1. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)

### 2. Configurar variáveis de ambiente (Opcional):
Crie ou edite o arquivo `.env.local` na raiz:

```env
# Modo de Teste (true para testes pré-produção, false para produção real)
NEXT_PUBLIC_TEST_MODE=true

# Mercado Pago Pix (obtenha suas chaves no painel Mercado Pago Developers)
MP_ACCESS_TOKEN=TEST-seu-access-token-aqui
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-sua-public-key-aqui

# Supabase (obtenha em Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui

# WhatsApp API (opcional - Twilio / Evolution API / Z-API)
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
```

---

## 🧪 Como Validar em Modo de Teste (Passo a Passo)

1. Abra a aplicação no navegador em `http://localhost:3000`.
2. O selo **MODO TESTE** estará visível no topo direito.
3. Escolha uma ou mais milhares na grade (ou clique nos botões de **Surpresinha** `+1`, `+3`, `+5`).
4. Clique em **Pagar Pix: R$ X,00**.
5. O modal exibirá o QR Code gerado e o botão **"⚡ Simular Pagamento Pix Aprovado"**.
6. Clique no botão de aprovação. O modal de cadastro de participante aparecerá.
7. Digite seu Nome Completo, CPF e WhatsApp e clique em **Confirmar Participação**.
8. Seus bilhetes aparecerão no botão **"Meus Bilhetes"**.
9. Clique no botão **"Sorteio 19h"** no topo para abrir a Arena da Sorte e clique em **"Iniciar Sorteio"** para ver os 4 tambores rolarem e conferir o resultado e os disparos do WhatsApp!

# Portal de Afiliados — Tá na Mão da Sorte 🍀

Sistema completo de afiliados integrado à identidade visual e arquitetura do **Tá na Mão da Sorte** ([tanamaodasorte.com.br](https://tanamaodasorte.com.br)).

---

## 🚀 Resumo do Projeto

O sistema foi desenvolvido como uma Single Page Application (SPA) moderna, responsiva e de alta performance para gerenciar o programa de indicações e vendas da loteria digital.

### Principais Funcionalidades:
- **Página Pública de Apresentação (`/afiliados`)**:
  - Hero com proposta de valor, taxas de comissão e sorteios diários às 19h.
  - Simulador interativo de ganhos (slider de bilhetes x comissão).
  - Linha do tempo dos 5 passos do programa.
  - Acordeon de Perguntas Frequentes (FAQ).
  - Modais com Regulamento Oficial, Termos de Uso e Política de Privacidade (LGPD).
- **Cadastro Completo com Validações Rigorosas (`/afiliados/cadastro`)**:
  - Validação matemática de CPF e CNPJ.
  - Verificação de idade (+18 anos obrigatório).
  - Máscaras para Telefone, WhatsApp e Documentos.
  - Cadastro de Chave Pix (CPF, CNPJ, E-mail, Celular, EVP).
  - Canais e estratégia de divulgação declarados.
  - Aceite registrado de Termos e LGPD com carimbo de data/hora.
  - Conta inicializada com status `"pendente"` para análise preventiva.
- **Autenticação Segura (`/afiliados/login`)**:
  - Login por E-mail ou CPF.
  - Recuperação de senha com envio seguro de instruções.
  - Botões de acesso rápido para testes (Afiliado Aprovado e Administrador).
- **Painel do Afiliado (`/afiliados/dashboard`)**:
  - KPIs em tempo real: Saldo Disponível, Saldo Pendente, Total Faturado e Taxa de Conversão.
  - Gráficos de desempenho interativos (Recharts) com filtros de período (Hoje, 7 dias, 30 dias).
  - Simulador de compra de teste para validação imediata de comissão creditada.
- **Meus Links (`/afiliados/links`)**:
  - Código exclusivo do afiliado (ex: `LUCK-8821`).
  - Gerador de links personalizados com páginas de destino e tags de campanha (`utm_campaign`).
  - Geração de QR Code automático para download e uso em stories ou panfletos.
  - Botões de compartilhamento 1-clique para WhatsApp, Telegram, Facebook e E-mail.
- **Central de Materiais de Divulgação (`/afiliados/materiais`)**:
  - Banners, Stories, Posts de Feed e Selos Oficiais.
  - Textos e copies prontos que **inserem automaticamente o link exclusivo do afiliado** ao clicar em "Copiar Texto".
  - Filtros por categoria e botões de download e visualização.
- **Relatórios Avançados (`/afiliados/relatorios`)**:
  - Filtros por campanha, status da comissão e busca textual.
  - **Exportação para CSV** com codificação UTF-8 BOM compatível com Microsoft Excel e Google Sheets.
- **Comissões e Solicitação de Pagamento Pix (`/afiliados/comissoes`)**:
  - Extrato detalhado com status: *Pendente*, *Em Análise*, *Disponível*, *Paga*, *Cancelada*.
  - Checklist de elegibilidade para saque (saldo $\ge$ R$ 50,00, conta aprovada e Pix cadastrado).
  - Modal de confirmação com dados bancários e exigência de senha de acesso.
- **Perfil do Afiliado (`/afiliados/perfil`)**:
  - Edição de dados cadastrais e canais.
  - Alteração de senha.
  - Alteração de Chave Pix com dupla confirmação por senha.
  - Central LGPD com registro de consentimentos e solicitação de encerramento de conta.
- **Painel Administrativo Completo (`/afiliados/admin`)**:
  - Dashboard executivo com métricas consolidadas e faturamento gerado.
  - Gestão e moderação de afiliados (Aprovar, Recusar com motivo, Suspender, Reativar).
  - Personalização de comissão individual por afiliado (ex: 15% padrão para 20% ou 25% VIP).
  - Fila de saques Pix: liquidação com registro de ID End-to-End da transação ou recusa com estorno automático.
  - Gerenciador de criativos (upload de novos banners, vídeos e textos).
  - Configurações globais (taxa padrão, valor mínimo de saque, dias de cookie).
  - Trilha de logs de auditoria imutável.
- **Motor de Rastreamento Antifraude (`TrackingService`)**:
  - Captura automática dos parâmetros `?afiliado=CODIGO` e `&campanha=NOME`.
  - Cookie de 30 dias com redundância em `localStorage`.
  - Deduplicação de cliques por janela de 15 minutos (anti-F5/spam).
  - Bloqueio de auto-compra para o mesmo CPF/e-mail do afiliado.
  - Idempotência de conversão para evitar comissões duplicadas.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Ícones & Gráficos**: Lucide React, Recharts
- **Backend & Nuvem**: Firebase Authentication, Cloud Firestore, Cloud Storage
- **Segurança**: Regras de segurança granulares do Firestore (`firestore.rules`)
- **Modo Demonstração Híbrido**: Persistência reativa em `localStorage` para testes locais imediatos sem dependência externa obrigatória.

---

## 👥 Credenciais de Teste Pré-Configuradas

Para testar todos os fluxos imediatamente, utilize as contas de teste abaixo (ou use os botões de atalho na tela de login):

| Perfil | Identificador / E-mail | Senha | Função |
|---|---|---|---|
| **Administrador Master** | `admin@tanamaodasorte.com.br` | `admin123` | Acesso completo a `/afiliados/admin` |
| **Afiliado Aprovado** | `lucas.afiliado@tanamaodasorte.com.br` (ou CPF `12345678909`) | `senha123` | Acesso ao Dashboard com saldo disponível de R$ 345,50 e comissões |
| **Afiliado Pendente** | `mariana.santos@gmail.com` | `senha123` | Demonstra a tela de aviso de conta em análise |

---

## 💻 Como Executar Localmente

### 1. Pré-requisitos
- Node.js versão 18 ou superior instalado.
- Gerenciador de pacotes `npm`.

### 2. Instalação e Execução
No terminal do projeto, execute:

```bash
# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento local
npm run dev
```

O sistema estará acessível no seu navegador no endereço:
**`http://localhost:3000/afiliados`** (ou porta exibida no terminal).

---

## ⚙️ Configuração do Firebase para Produção

O projeto foi construído para funcionar localmente de imediato com dados simulados completos. Para conectar ao seu projeto real do Google Firebase:

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um novo projeto (ex: `tanamaodasorte-app`).
2. Ative os serviços:
   - **Authentication**: Habilite o provedor de Email/Senha.
   - **Cloud Firestore**: Crie o banco de dados em modo de produção na região `southamerica-east1` (São Paulo).
   - **Cloud Storage**: Ative para armazenamento de banners e comprovantes.
3. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
4. Preencha as credenciais da aplicação Web do Firebase no arquivo `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=tanamaodasorte-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tanamaodasorte-app
   VITE_FIREBASE_STORAGE_BUCKET=tanamaodasorte-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```
5. Publique as regras de segurança no Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

### Criando o Primeiro Administrador no Firebase Real
No Firebase Console:
1. Em **Authentication**, crie o usuário com o e-mail do administrador (ex: `admin@tanamaodasorte.com.br`).
2. No **Firestore**, crie a coleção `admins` e adicione um documento com o mesmo `UID` do usuário criado, contendo `{ "role": "admin", "createdAt": "2026-09-28T00:00:00Z" }`.

---

## 🧪 Roteiro de Testes Recomendado

Execute as etapas abaixo para validar todas as funcionalidades:

1. **Acessar a Landing Page**:
   - Abra `http://localhost:3000/afiliados`.
   - Teste o slider da calculadora de rendimentos e veja o cálculo em tempo real.
   - Abra o acordeon de FAQ e consulte o modal de Regulamento e Termos.
2. **Testar Cadastro de Novo Afiliado**:
   - Vá para `/afiliados/cadastro`.
   - Tente submeter com CPF inválido (ex: `111.111.111-11`) e comprove a validação.
   - Insira dados válidos, marque os termos e submeta.
   - Veja a tela de sucesso com o código exclusivo gerado e o aviso de status pendente.
3. **Testar Login e Painel do Afiliado**:
   - Vá para `/afiliados/login`.
   - Clique no botão `"Demo: Afiliado Aprovado"`.
   - Clique em `"Simular Venda"` no topo do dashboard: observe a comissão instantaneamente creditada no saldo em análise e a notificação recebida!
4. **Testar Links e Materiais**:
   - Acesse `/afiliados/links`, copie seu link, gere um link com nova campanha (ex: `stories_hoje`) e abra o modal de QR Code.
   - Acesse `/afiliados/materiais`, filtre por *Stories* ou *Textos* e clique em `"Copiar Texto"`: o texto copiado já conterá o seu link exclusivo embutido.
5. **Testar Solicitação de Saque Pix**:
   - Acesse `/afiliados/comissoes` e clique em `"Solicitar Pagamento Pix"`.
   - Digite a senha da conta (`senha123`) e confirme. Veja o saldo deduzido e o pedido incluído no histórico.
6. **Testar Painel Administrativo**:
   - Saia da conta e clique em `"Demo: Administrador"` (ou use `admin@tanamaodasorte.com.br` / `admin123`).
   - Acesse `/afiliados/admin/afiliados` e aprove cadastros pendentes.
   - Acesse `/afiliados/admin/saques` e liquide o pedido de Pix inserindo o ID End-to-End da transação.
   - Acesse `/afiliados/admin/configuracoes` para alterar a taxa padrão ou restaurar o banco para o estado original.

---

## 📦 Como Publicar em Produção

Para gerar o build otimizado para deploy:

```bash
npm run build
```

A pasta `dist/` conterá os arquivos estáticos otimizados prontos para hospedagem no **Firebase Hosting**, **Vercel**, **Cloudflare Pages** ou servidor web Nginx/Apache.

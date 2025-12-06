# 💰 Sistema de Controle de Despesas Domésticas

Sistema web completo para controle de despesas domésticas com login individual, cadastro e gerenciamento de despesas.

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js + Express
- **Banco de Dados:** MariaDB
- **Frontend:** HTML5 + CSS3 + JavaScript Vanilla
- **Autenticação:** bcrypt + express-session

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- MariaDB instalado e rodando
- npm ou yarn

## 🔧 Instalação

### 1. Clone ou crie a estrutura do projeto

```bash
mkdir sistema-despesas
cd sistema-despesas
```

### 2. Crie a estrutura de pastas

```bash
mkdir -p config middleware routes scripts public/css
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure o banco de dados

Execute o script SQL fornecido (`schema.sql`) no seu MariaDB:

```bash
mysql -u seu_usuario -p < schema.sql
```

Ou execute manualmente no MySQL Workbench/phpMyAdmin.

### 5. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com suas credenciais:

```env
PORT=3000
SESSION_SECRET=sua_chave_secreta_muito_segura_aqui

DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=despesas_domesticas
DB_PORT=3306
```

### 6. Crie os usuários iniciais

```bash
node scripts/criar-usuarios.js
```

**Importante:** Edite o arquivo `scripts/criar-usuarios.js` antes de executar para adicionar os nomes de usuário e nomes corretos.

### 7. Inicie o servidor

```bash
npm start
```

Para desenvolvimento com auto-reload:

```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
sistema-despesas/
├── config/
│   └── database.js          # Configuração do banco de dados
├── middleware/
│   └── auth.js              # Middleware de autenticação
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── dashboard.js         # Rotas de páginas
│   └── despesas.js          # Rotas de despesas (API)
├── scripts/
│   └── criar-usuarios.js    # Script para criar usuários
├── public/
│   ├── css/
│   │   └── style.css        # Estilos da aplicação
│   ├── login.html           # Página de login
│   ├── dashboard.html       # Dashboard principal
│   └── nova-despesa.html    # Formulário de despesas
├── .env                     # Variáveis de ambiente
├── package.json             # Dependências do projeto
├── server.js                # Servidor principal
└── README.md                # Este arquivo
```

## 🎯 Funcionalidades

### ✅ Implementadas

- **Autenticação**
  - Login com usuário e senha
  - Hash seguro de senhas (bcrypt)
  - Sessões com cookies
  - Logout funcional

- **Dashboard**
  - Visualização do mês atual
  - Total de despesas do mês
  - Lista completa de despesas
  - Marcar despesas como pagas
  - Excluir despesas

- **Cadastro de Despesas**
  - Valor em reais
  - Status de pagamento
  - Data de pagamento
  - Descrição
  - Categorias pré-definidas
  - Tipos: Fixa, Variável, Parcelada
  - Dividir despesa entre usuários
  - Parcelamento automático

### 🔮 Funcionalidades Futuras (Opcionais)

- Editar despesas existentes
- Filtros por mês, categoria e status
- Gráficos e relatórios
- Exportação de dados
- Notificações de vencimento
- Repetição automática de despesas fixas

## 📊 Banco de Dados

### Tabelas

- **usuarios:** Armazena os usuários do sistema
- **categorias:** Categorias de despesas (Alimentação, Moradia, etc.)
- **despesas:** Registro de todas as despesas

### Relacionamentos

- Cada despesa pertence a um usuário
- Cada despesa tem uma categoria
- Despesas parceladas são criadas automaticamente

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Sessões seguras com express-session
- Middleware de proteção de rotas
- Validação de dados no backend
- Proteção contra SQL Injection (prepared statements)

## 💡 Uso

### Login

1. Acesse `http://localhost:3000/login`
2. Use as credenciais criadas no script
3. Será redirecionado para o dashboard

### Cadastrar Despesa

1. Clique em "Nova Despesa"
2. Preencha os campos do formulário
3. Para despesas parceladas, selecione "Parcelada" e informe o número de parcelas
4. Marque "Dividir com outro usuário" se a despesa for dividida
5. Clique em "Salvar Despesa"

### Gerenciar Despesas

- **Marcar como paga:** Clique no checkbox ao lado da despesa
- **Excluir:** Clique no ícone de lixeira

## 🐛 Solução de Problemas

### Erro de conexão com o banco

- Verifique se o MariaDB está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `mysql -u seu_usuario -p`

### Erro ao instalar dependências

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Porta 3000 já em uso

Altere a variável `PORT` no arquivo `.env`

## 📝 Notas Importantes

- **Altere as senhas padrão** após criar os usuários
- Mantenha o arquivo `.env` **fora do controle de versão** (adicione ao .gitignore)
- Faça backup regular do banco de dados
- As despesas divididas aparecem para ambos os usuários
- Despesas parceladas são criadas automaticamente para os próximos meses

## 📄 Licença

Este projeto é de uso pessoal.

## 👨‍💻 Suporte

Para dúvidas ou problemas, consulte a documentação das tecnologias utilizadas:

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MariaDB](https://mariadb.org/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)

---

**Desenvolvido para controle de despesas domésticas** 💑💰
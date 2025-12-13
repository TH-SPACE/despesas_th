# 💰 Sistema de Controle de Despesas Domésticas

Sistema web completo para controle de despesas domésticas com login individual, cadastro e gerenciamento de despesas.

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js + Express
- **Banco de Dados:** MariaDB
- **Frontend:** HTML5 + CSS3 + JavaScript Vanilla
- **Autenticação:** bcrypt + express-session

## 📋 Pré-requisitos

- Node.js instalado
- MariaDB instalado e rodando
- npm ou yarn

## 🔧 Instalação Passo a Passo

### 1. Criar estrutura de pastas

```bash
mkdir sistema-despesas
cd sistema-despesas
mkdir -p config middleware routes scripts public/css
```

### 2. Criar os arquivos

Copie os arquivos fornecidos para suas respectivas pastas:

```
sistema-despesas/
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   └── despesas.js
├── scripts/
│   └── criar-usuarios.js
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── prevenir-zoom.js
│   ├── login.html
│   ├── dashboard.html
│   └── nova-despesa.html
├── .env
├── .gitignore
├── package.json
├── server.js
├── schema.sql
└── README.md
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Configurar o banco de dados

Execute o script SQL no seu MariaDB:

```bash
mysql -u root -p < schema.sql
```

Ou importe manualmente no MySQL Workbench/phpMyAdmin.

### 5. Configurar variáveis de ambiente

Edite o arquivo `.env` com suas credenciais:

```env
PORT=3005
SESSION_SECRET=mude_esta_chave_secreta_para_algo_muito_seguro_e_aleatorio

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=despesas_domesticas
DB_PORT=3306
```

### 6. Criar usuários iniciais

Edite o arquivo `scripts/criar-usuarios.js` e adicione os usuários desejados:

```javascript
const usuarios = [
    { usuario: 'joao', nome: 'João Silva', senha: 'senha123' },
    { usuario: 'maria', nome: 'Maria Santos', senha: 'senha123' }
];
```

Execute o script:

```bash
node scripts/criar-usuarios.js
```

### 7. Iniciar o servidor

```bash
npm start
```

Para desenvolvimento com auto-reload:

```bash
npm run dev
```

### 8. Acessar o sistema

Abra o navegador em: **http://localhost:3005**

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação
- **Cadastro de usuário:** Crie sua conta com usuário e senha
- **Login seguro:** Senhas criptografadas com bcrypt
- **Sessões:** Mantém usuário logado
- **Logout:** Encerra a sessão com segurança

### ✅ Dashboard
- **Visualização mensal:** Despesas do mês atual
- **Estatísticas:** Total, pagas e pendentes
- **Lista completa:** Todas as despesas com detalhes
- **Marcar como paga:** Checkbox para alterar status
- **Excluir:** Remover despesas indesejadas
- **Filtro por mês:** Visualize despesas de qualquer mês do ano
- **Navegação por mês:** Botões para avançar, retroceder e voltar ao mês atual
- **Separação visual:** Despesas pagas e pendentes em seções distintas
- **Botão de configurações:** Acesso à gestão de categorias

### ✅ Cadastro de Despesas
- **Valor em reais:** Com duas casas decimais
- **Categorias editáveis:** Alimentação, Moradia, Transporte, etc.
- **Tipos de despesa:**
  - **Fixa:** Aparece automaticamente em todos os meses do ano
  - **Variável:** Única ocorrência
  - **Parcelada:** Cria automaticamente as parcelas nos próximos meses
- **Divisão:** Divida despesas com outros usuários (valor dividido por 2)
- **Data de vencimento:** Controle quando a despesa vence
- **Status de pagamento:** Marque quando pagar
- **Pré-seleção automática:** Ao marcar "Dividir despesa", o primeiro usuário disponível é selecionado automaticamente

### ✅ Exclusão de Despesas
- **Confirmação personalizada:** Modais em vez de alertas padrão do navegador
- **Despesas parceladas:** Opção para excluir somente a parcela atual ou todas as parcelas
- **Despesas fixas:** Exclusão funcional com confirmação adequada

### ✅ Gestão de Categorias
- **Cadastro:** Adicione novas categorias com nomes personalizados
- **Cores:** Selecione cores para as categorias com visualização em tempo real
- **Exclusão:** Remova categorias que não são mais utilizadas
- **Restrição de exclusão:** Impede exclusão de categorias que estão sendo usadas em despesas

### ✅ Interface Otimizada para Mobile
- **Modais personalizados:** Substituição de alert() e confirm() por modais personalizados
- **Layout responsivo:** Design adaptado para dispositivos móveis
- **Botões grandes:** Interfaces táteis com áreas de toque adequadas
- **Prevenção de zoom:** Evita zoom indesejado ao digitar em campos de formulário

## 📊 Como Usar

### Primeiro Acesso

1. Acesse `http://localhost:3005`
2. Clique em **"Cadastrar"**
3. Crie seu usuário e senha
4. Faça login

### Cadastrar uma Despesa

1. No dashboard, clique em **"+ Nova Despesa"**
2. Preencha os campos:
   - **Descrição:** Ex: "Conta de luz"
   - **Valor:** Ex: 250.00
   - **Categoria:** Escolha uma categoria
   - **Tipo:** Selecione Fixa, Variável ou Parcelada
   - **Data de Vencimento:** Quando vence
3. **Opcionais:**
   - Marque "Dividir com outro usuário" para compartilhar (o primeiro usuário disponível será pré-selecionado)
   - Se for parcelada, informe o número de parcelas
4. Clique em **"Salvar Despesa"**

### Despesas Fixas

Quando você cria uma despesa **Fixa**, o sistema automaticamente cria essa despesa para todos os meses restantes do ano. Por exemplo:
- Se você criar em janeiro, a despesa aparecerá de janeiro a dezembro
- Se criar em junho, aparecerá de junho a dezembro

### Despesas Parceladas

Ao criar uma despesa **Parcelada**:
- Informe o número de parcelas (ex: 12x)
- O sistema cria automaticamente 12 despesas mensais
- Cada uma aparece com "(1/12)", "(2/12)", etc.

### Dividir Despesas

Quando você marca "Dividir com outro usuário":
- O valor é automaticamente dividido por 2
- A despesa aparece para você e para o outro usuário
- Cada um vê sua parte da despesa
- O primeiro usuário disponível é pré-selecionado automaticamente

### Gerenciar Despesas

- **Marcar como paga:** Clique no checkbox ao lado da despesa
- **Excluir:** Clique no ícone de lixeira 🗑️
- **Filtrar por mês:** Use o seletor de mês no topo
- **Navegar por meses:** Use os botões de seta ou o botão de voltar ao mês atual
- **Ver seções:** Despesas pendentes e pagas são exibidas em seções separadas

### Configurações e Categorias

- **Acesse configurações:** Clique no ícone de configurações (⚙️) no topo
- **Adicione categorias:** Informe nome e cor para criar novas categorias
- **Exclua categorias:** Remova categorias que não são mais usadas

## 🔐 Segurança

- ✅ Senhas criptografadas (bcrypt com salt)
- ✅ Sessões seguras com cookies HTTP-only
- ✅ Proteção de rotas (middleware de autenticação)
- ✅ Prepared statements (proteção contra SQL Injection)
- ✅ Validação de dados no backend
- ✅ Proteção contra duplicidade de categorias

## 🐛 Solução de Problemas

### Erro: "Cannot connect to database"

1. Verifique se o MariaDB está rodando:
```bash
sudo systemctl status mariadb
```

2. Teste a conexão:
```bash
mysql -u root -p
```

3. Confirme as credenciais no arquivo `.env`

### Erro: "Table doesn't exist"

Execute o script SQL novamente:
```bash
mysql -u root -p despesas_domesticas < schema.sql
```

### Erro ao instalar dependências

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Porta 3005 já está em uso

Altere a porta no arquivo `.env`:
```env
PORT=3006
```

## 💡 Dicas de Uso

1. **Organize suas finanças** usando categorias personalizadas que façam sentido para você
2. **Use despesas fixas** para contas recorrentes (aluguel, internet, etc.)
3. **Use parcelamento** para compras divididas em várias vezes
4. **Divida despesas** com familiares ou colegas de casa para controle compartilhado
5. **Mantenha backup regular** do banco de dados
6. **Aproveite a pré-seleção** de usuários ao dividir despesas para ganhar tempo

## 📝 Próximas Funcionalidades (Sugestões)

- [ ] Editar despesas existentes
- [ ] Gráficos de gastos por categoria
- [ ] Exportar relatórios em PDF/Excel
- [ ] Notificações de vencimento
- [ ] Modo escuro
- [ ] App mobile
- [ ] Backup automático
- [ ] Histórico de alterações

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

## 📄 Licença

Este projeto é de uso pessoal e educacional.

---

**Desenvolvido com ❤️ para facilitar o controle de despesas domésticas**
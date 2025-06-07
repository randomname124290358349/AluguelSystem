# AluguelSystem

Sistema de gestão para aluguel de equipamentos desenvolvido em Django. Permite o cadastro de clientes, equipamentos e controle completo de aluguéis com cálculo automático de valores.

![image](https://github.com/user-attachments/assets/93d7cd6a-caab-4199-9070-b1a8eb541596)

## ⚠️ AVISO IMPORTANTE DE SEGURANÇA

> **🔒 Este projeto foi desenvolvido exclusivamente para execução em ambiente local (localhost).**
>
> **❌ NÃO EXPOR ESTE SISTEMA DIRETAMENTE NA INTERNET sem as devidas configurações de segurança.**

## 🚀 Funcionalidades

- **Dashboard**: Visão geral com estatísticas em tempo real
- **Gestão de Clientes**: Cadastro, edição e remoção de clientes
- **Gestão de Equipamentos**: Controle de inventário com fotos e status
- **Gestão de Aluguéis**: Controle completo do ciclo de aluguel
- **Cálculo Automático**: Valores calculados por hora e diário
- **Sistema de Autenticação**: Acesso protegido via Django Admin

## 🛠️ Tecnologias Utilizadas

- **Backend**: Django 5.2.2
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Banco de Dados**: SQLite (desenvolvimento)
- **Upload de Imagens**: Pillow
- **Gerenciador de Dependências**: uv

## 📦 Instalação

### 1. Instalar o uv (Gerenciador de Pacotes Python)

O uv é um gerenciador de pacotes Python extremamente rápido, escrito em Rust.

#### Windows:
```bash
# Via PowerShell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Via pip (se já tiver Python instalado)
pip install uv
```

#### macOS:
```bash
# Via Homebrew
brew install uv

# Via curl
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Linux:
```bash
# Via curl
curl -LsSf https://astral.sh/uv/install.sh | sh

# Via pip (se já tiver Python instalado)
pip install uv
```

### 2. Clonar o Repositório

```bash
git clone https://github.com/randomname124290358349/AluguelSystem.git
cd AluguelSystem
```

### 3. Configurar o Ambiente

```bash
# Instalar dependências
uv sync

# Ativar o ambiente virtual
source .venv/bin/activate  # Linux/macOS
# ou
.venv\Scripts\activate     # Windows
```

### 4. Configurar o Banco de Dados

```bash
# Aplicar migrações
uv run python manage.py migrate

# Criar superusuário para acessar o admin
uv run python manage.py createsuperuser
```

### 5. Executar o Servidor

```bash
uv run python manage.py runserver
```

Acesse `http://127.0.0.1:8000` no seu navegador.

## 📋 Como Usar

### 1. Primeiro Acesso

1. Acesse `http://127.0.0.1:8000`
2. Faça login com o superusuário criado
3. Você será redirecionado para o dashboard principal

### 2. Cadastrar Equipamentos

1. Vá para a aba "Equipamentos"
2. Clique em "➕ Adicionar Equipamento"
3. Preencha os dados:
   - Nome do equipamento
   - Valor diário
   - Status (Disponível, Alugado, Em Manutenção, Indisponível)
   - Foto (opcional)

### 3. Cadastrar Clientes

1. Vá para a aba "Clientes"
2. Clique em "➕ Adicionar Cliente"
3. Preencha os dados pessoais:
   - Nome completo
   - CPF
   - Email
   - Telefone
   - Endereço
   - Data de nascimento

### 4. Criar Aluguéis

1. Vá para a aba "Aluguéis"
2. Clique em "➕ Novo Aluguel"
3. Selecione o cliente e equipamento
4. Defina data/hora de início
5. Opcionalmente defina data/hora de fim
6. Adicione observações se necessário

### 5. Gerenciar Aluguéis

- **Editar**: Clique no ícone de edição para modificar um aluguel
- **Fechar**: Use o botão "Fechar" para finalizar um aluguel em andamento
- **Excluir**: Remove um aluguel do sistema
- **Cálculo Automático**: O valor é calculado automaticamente quando o aluguel é finalizado

## 📊 Sistema de Status

### Equipamentos:
- **Disponível**: Pronto para aluguel
- **Alugado**: Atualmente em uso
- **Em Manutenção**: Temporariamente indisponível
- **Indisponível**: Fora de operação

### Aluguéis:
- **Aberto**: Aluguel ativo sem data de fim
- **Em Andamento**: Aluguel com período definido
- **Fechado**: Aluguel finalizado e valor calculado
- **Cancelado**: Aluguel cancelado

## ⚙️ Configurações de Desenvolvimento

### Estrutura do Projeto

```
AluguelSystem/
├── AluguelSystem/          # Configurações do Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── Core/                   # App principal
│   ├── models.py          # Modelos (Cliente, Equipamento, Aluguel)
│   ├── views.py           # Views e APIs
│   ├── admin.py           # Configurações do admin
│   ├── templates/         # Templates HTML
│   └── static/            # CSS e JavaScript
├── media/                  # Upload de imagens
├── manage.py              # Script de gerenciamento Django
└── pyproject.toml         # Configurações do projeto
```

### Variáveis de Ambiente

Para produção, configure as seguintes variáveis:

```bash
SECRET_KEY=sua-chave-secreta-segura
DEBUG=False
ALLOWED_HOSTS=seu-dominio.com
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Contato

Se você tiver alguma dúvida, sinta-se à vontade para abrir uma issue no GitHub.

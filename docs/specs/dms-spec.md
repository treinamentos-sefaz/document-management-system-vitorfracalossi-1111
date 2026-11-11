# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos armazenados localmente, com metadados associados a cada documento.

## 2. Escopo

### Dentro do escopo

- Envio de documentos por upload.
- Listagem dos metadados dos documentos enviados.
- Download de um documento pelo identificador.
- Associação de cada documento a um proprietário, conforme regra de identificação a definir.
- Armazenamento dos arquivos no filesystem local e dos metadados em memória.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento de documentos.
- Definição de um mecanismo de autenticação ou autorização nesta especificação.
- Persistência de metadados em banco de dados.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o envio de um documento pelo endpoint de upload. |
| RF-02 | Após o envio, o sistema deve disponibilizar os metadados do documento criado. |
| RF-03 | O sistema deve listar os metadados dos documentos enviados. |
| RF-04 | O sistema deve permitir o download do conteúdo de um documento pelo seu identificador. |
| RF-05 | Cada documento deve possuir um proprietário associado; a origem do identificador do proprietário deve ser definida antes da implementação. |
| RF-06 | O sistema deve tratar entradas inválidas e falhas de leitura ou escrita no limite da aplicação, sem expor detalhes internos do filesystem. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos enviados devem ser gravados no filesystem local, em `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase; eles não precisam sobreviver à reinicialização do processo. |
| RNF-03 | A configuração da aplicação deve seguir o princípio 12-Factor e ser fornecida por variáveis de ambiente; os nomes e valores concretos dessas variáveis devem ser definidos antes da implementação. |
| RNF-04 | Nenhum provedor externo de armazenamento ou serviço de upload de terceiros deve ser utilizado. |
| RNF-05 | O backend deve seguir a separação de responsabilidades definida na seção 7. |
| RNF-06 | Como arquivos locais podem permanecer após uma reinicialização enquanto os metadados em memória são perdidos, essa inconsistência é uma limitação conhecida desta fase. |

## 5. Modelo de dados (metadados do documento)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único do documento, usado para localizá-lo nas operações de listagem e download. |
| `originalName` | string | Nome original do arquivo enviado. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload no formato ISO 8601. |
| `owner` | string | Identificador do usuário proprietário; a origem e a política de preenchimento ainda precisam ser definidas. |

Os metadados são mantidos em memória. O identificador ou mecanismo interno usado para localizar o arquivo no disco não faz parte do contrato público de metadados e deve ser definido na implementação sem expor caminhos locais ao cliente.

## 6. Contratos de API

Os endpoints abaixo são requisitos previstos. O frontend deve consumi-los sob o prefixo `/api`, conforme o proxy do Vite. Os formatos exatos de erro e os códigos HTTP devem ser padronizados antes da implementação.

### `POST /upload`

- **Objetivo:** receber um documento e registrar seus metadados.
- **Entrada:** um arquivo em `multipart/form-data`.
- **Processamento esperado:** gravar o conteúdo em `backend/storage` usando Multer com `diskStorage` e manter os metadados em memória.
- **Saída esperada:** metadados do documento criado, conforme o modelo da seção 5.
- **Pendente:** nome do campo multipart, limites de tamanho, tipos de arquivo aceitos, política para nomes duplicados e respostas de erro/status.

### `GET /documents`

- **Objetivo:** listar documentos disponíveis.
- **Entrada:** sem corpo de requisição.
- **Saída esperada:** lista de metadados conforme o modelo da seção 5.
- **Pendente:** se a listagem inclui todos os documentos ou somente os do proprietário identificado, além dos códigos HTTP e formato de erro.

### `GET /documents/:id/download`

- **Objetivo:** baixar o conteúdo do documento identificado por `id`.
- **Entrada:** identificador do documento no parâmetro de rota.
- **Saída esperada:** conteúdo binário do arquivo correspondente.
- **Pendente:** comportamento e resposta HTTP para identificador inexistente, arquivo ausente no disco, falha de leitura e restrição de acesso por proprietário.

## 7. Decisões arquiteturais

- O backend utiliza Node.js e Express em CommonJS, organizado em `routes`, `controllers`, `services` e `repositories`.
- O fluxo de dependência é `routes -> controllers -> services -> repositories`. Rotas definem endpoints e delegam aos controllers; controllers tratam a fronteira HTTP; services concentram regras de negócio; repositories tratam persistência. Camadas internas não dependem das externas.
- O armazenamento de arquivos é local, em `backend/storage`, por meio de Multer com `diskStorage`. Metadados permanecem em memória nesta fase.
- O frontend utiliza React e Vite, com componentes funcionais e Hooks, e acessa a API por `fetch` sob o prefixo `/api`.
- Não se introduzem banco de dados, armazenamento externo ou versionamento nesta fase.

## 8. Plano de execução

Etapas funcionais em alto nível. A decomposição de implementação dos arquivos de backend e frontend não faz parte deste plano.

1. Definir as decisões pendentes de identidade do proprietário, autorização, regras de upload e contratos HTTP.
2. Disponibilizar os fluxos de envio e registro dos metadados, listagem e download de documentos, respeitando o armazenamento local especificado.
3. Validar os fluxos de sucesso e falha, incluindo documento inexistente, arquivo indisponível e limitações decorrentes da reinicialização da aplicação.

## 9. Decisões pendentes

- Como o valor de `owner` será obtido, considerando que autenticação não está definida no escopo atual.
- Se listagem e download serão globais ou restritos aos documentos do proprietário.
- Quais tipos de arquivo e tamanho máximo serão aceitos.
- Qual será o nome do campo de arquivo no `multipart/form-data` e como nomes duplicados serão tratados.
- Quais códigos HTTP, formatos de resposta e mensagens de erro serão adotados para entradas inválidas, identificadores inexistentes e falhas de filesystem.
- Quais variáveis de ambiente serão necessárias e se o caminho local poderá ser configurado ou permanecerá fixo em `backend/storage`.
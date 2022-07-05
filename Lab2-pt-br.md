# Lab 2 – Construindo microsserviços Multi-Tenant

### Visão Geral

Em nosso primeiro laboratório, concentramos toda a nossa atenção na integração dos tenants e na criação de um conceito de **Identidade SaaS**, onde a identidade do usuário foi unida a uma identidade de tenant. Com esses elementos em vigor, agora podemos voltar nossa atenção para pensar sobre como realmente construímos os serviços e a funcionalidade de nosso aplicativo de maneira multitenant. Isso significa aplicar a identidade e o contexto do tenant aos serviços que construímos.

Até agora, os serviços que criamos (registro de tenants, gerenciamento de usuários etc.) foram apenas para construir os fundamentos de integração. Agora, vamos dar uma olhada nos serviços que serão utilizados para suportar a funcionalidade real do nosso aplicativo. Para esse cenário, estamos construindo um sistema de gerenciamento de pedidos muito básico. Ele permite que você crie um catálogo de produtos e faça pedidos desses produtos. É importante observar que, como uma solução SaaS com isolamento a nível de pool, os recursos de computação e armazenamento usados para implementar essa funcionalidade serão compartilhados por todos os tenants.

Abaixo temos um diagrama em alto nível dos serviços utilizados:

<p align="center"><img src="./images/lab2/arch_overview.png" alt="Lab 2 Architecture Overview"/></p>

Este é um diagrama muito básico que destaca os serviços e suas interações com os outros aspectos da arquitetura do bootcamp. Observe que esses serviços estão conectados ao aplicativo por meio do **API Gateway**, expondo operações básicas de **CRUD** para criar, ler, atualizar e excluir produtos e pedidos.

Obviamente, como parte da implementação desses serviços, temos que pensar sobre o que deve ser feito para aplicar o conceito de multi-tenancy a esses serviços. Esses serviços precisarão armazenar dados, registrar métricas e obter a identidade do usuário tendo em mente o cenário de multi-tenant. Portanto, temos que pensar em como isso é alcançado e aplicado nesses serviços.

Abaixo temos um diagrama que mostra uma visão conceitual do que significa construir um microserviço que leva em consideração o multi-tenancy *(multi-tenant aware)*:

<p align="center"><img src="./images/lab2/multitenant_diagram.png" alt="Lab 2 Multi-Tenant Overview"/></p>

Esse diagrama um pouco simplificado destaca as principais áreas em que vamos nos concentrar para os microsserviços multi-tenant que implantaremos. No centro do diagrama estão os serviços que estão sendo construídos (no nosso caso, os gerenciadores de produtos e pedidos). Ao redor estão as áreas em que precisamos levar em consideração o multi-tenancy. Isso inclui:

* **Contexto de Identidade e Tenant** - nossos serviços precisam de alguma forma padrão de adquirir a função e a autorização do usuário atual, juntamente com o contexto do tenant. Quase todas as ações em seus serviços acontecem no contexto de um tenant, então precisaremos pensar sobre como adquirimos e aplicamos esse contexto.
* **Particionamento de dados Multi-Tenant** – nossos dois serviços precisarão armazenar dados. Isso significa que nossas operações CRUD precisarão de alguma injeção de contexto do tenant para descobrir como particionar, persistir e adquirir dados em um modelo multi-tenant.
* **Tenant Aware Logging, Metering, and Analytics** – as we record logs and metrics about activity in our system, we'll need some way to attribute those activities to a specific tenant. Our services must inject this context into any activity messages that are published for troubleshooting or downstream analytics.
* **Logs, Métricas e Analytics Tenant Aware** – à medida que gravamos logs e métricas sobre a atividade em nosso sistema, precisaremos de alguma forma de atribuir essas atividades a um tenant específico. Nossos serviços devem injetar esse contexto em qualquer mensagem de atividade gerada para solução de problemas ou análises futuras.

Esse cenário fornece uma visão dos conceitos fundamentais que exploraremos neste laboratório. Embora não estejamos escrevendo os serviços do zero, destacaremos como um serviço evolui para incorporar esses conceitos.


### O que você irá construir
Para demonstrar os conceitos multi-tenant, passaremos por um processo evolucionário em que gradualmente adicionamos o *multi-tenancy awareness* à nossa solução. Começaremos com uma versão single-tenant do nosso serviço de gestão de produtos e, em seguida, adicionaremos progressivamente os componentes necessários para tornar esse serviço totalmente *multi-tenant aware*. As etapas básicas desse processo incluem:

* Implantar um microsserviço gerenciador de produtos single-tenant - esse é um passo base para ilustrar como o serviço seria antes de começarmos a colocar os elementos de multi-tenancy. Será um serviço básico CRUD sem nenhum *multi-tenant awareness*.
* Introduzir o particionamento de dados multi-tenant - a primeira fase de multi-tenancy será adicionar a capacidade de particionar dados baseados em um identificador de tenant fornecido como parte de uma requisição.
* Extrair o contexto de tenant a partir da identidade do usuário - adicionar a capacidade de usar o contexto de segurança das chamadas HTTP ao serviço para extrair e aplicar a identidade de tenant no mecanismo de particionamento de dados.
* Introduzir um segundo tenant para demonstrar o particionamento - registrar um novo tenant e gerenciar produtos através do contexto desse tenant para ilustrar como o sistema particionou os dados na aplicação com sucesso.

## Parte 1 - Implantação de um Serviço Gerenciador de Produtos Single-Tenant

Antes de podermos ver como a estratégia multi-tenant influencia os serviços de negócio de nosso aplicativo, iremos ver um serviço single-tenant em ação, para termos uma base para a exploração dos conceitos de multi-tenancy e como isso influencia na implementação de nosso microsserviço. 

Neste modelo básico, iremos implantar um serviço, criar uma tabela **DynamoDB** para armazenar os dados de produtos, e então usar o cURL a partir da linha de comando para acessar esse novo serviço.

**Passo 1** - Vamos começar o processo observando mais de perto o serviço single-tenant que implantaremos. Da mesma forma que nos laboratórios anteriores, o microsserviço de gestão de produtos é desenvolvido com Node.js e Express. Ele expõe uma série de operações CRUD através de uma interface REST.

O código fonte para esse arquivo está disponível em `Lab2/Part1/product-manager/server.js`.

Ao olhar esse arquivo, você verá diversos *entry points* que correspondem aos métodos REST (`app.get(...)`, `app.post(...)`, etc.). Dentro de cada uma dessas funções está a implementação da operação REST correspondente. Vamos ver em mais detalhes um desses métodos para ter idéia do que está acontecendo.

```javascript
app.get('/product/:id', function (req, res) {
    winston.debug('Fetching product: ' + req.params.id);
    // init params structure with request params
    var params = {
        product_id: req.params.id
    };
    tokenManager.getSystemCredentials(function (credentials) {
        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
        dynamoHelper.getItem(params, credentials, function (err, product) {
            if (err) {
                winston.error('Error getting product: ' + err.message);
                res.status(400).send('{"Error" : "Error getting product"}');
            } else {
                winston.debug('Product ' + req.params.id + ' retrieved');
                res.status(200).send(product);
            }
        });
    });
});
```

Vamos começar olhando a assinatura do método. Aqui temos um caminho tradicional REST, para um método GET ao recurso `/product` seguido de um parâmetro identificador que indica qual produto deve ser obtido. Esse valor é extraído da requisição e populado em uma estrutura chamada `params`. O resto dessa função é basicamente chamar o DynamoDBHelper, que é a camada de acesso aos dados, para obter o item de uma tabela DynamoDB.

**Passo 2** - Vamos fazer a implantação do gerenciador de produtos single-tenant, através da IDE Cloud9. Navegue até o diretório `Lab2/Part1/product-manager`, clique com o botão direito em `deploy.sh` e clique em **Run** para executar o shell script.

<p align="center"><img src="./images/lab2/part1/cloud9_run_script.png" alt="Lab 2 Part 1 Step 2 Cloud9 Run Script"/></p>

**Passo 3** - Aguarde a execução com sucesso do shell script `deploy.sh`.

<p align="center"><img src="./images/lab2/part1/cloud9_run_script_complete.png" alt="Lab 2 Part 1 Step 3 Cloud9 Script Finished"/></p>

**Passo 4** - Agora que nosso serviço foi implantado, temos que introduzir os elementos de suporte. Vamos começar criando a tabela do DynamoDB que será utilizada para armazenar as informações dos produtos. Primeiro, navegue até o serviço DynamoDB na console da AWS e selecione a opção **Tables** da lista de navegação no lado superior esquerdo da página.

<p align="center"><img src="./images/lab2/part1/dynamo_menu_tables.png" alt="Lab 2 Part 1 Step 4 DynamoDB Menu Tables"/></p>

**Passo 5** - Agora clique no botão **Create table** no topo da página. Como nome da tabela, utilize **ProductBootcamp**, e como partition key, utilize **product_id**. O DynamoDB diferencia maiúsculas e minúsculas nos nomes de tabela e chave, então verifique se os valores foram digitados corretamente. Assim que os campos do formulário estiverem preenchidos, clique no botão **Create** à direita, no final da página, para criar a nova tabela.

<p align="center"><img src="./images/lab2/part1/dynamo_create_table.png" alt="Lab 2 Part 1 Step 5 DynamoDB Create Table"/></p>

**Passo 6** - Neste ponto, a tabela já deve ter sido criada e seu serviço deve estar rodando e ser acessível através do **Amazon API Gateway**. Primeiro, nós precisaremos da URL do API Gateway que expõe nossos microsserviços. Vá até o API Gateway na console da AWS e selecione a API **saas-bootcamp-api**.

<p align="center"><img src="./images/lab2/part1/apigw_select_api.png" alt="Lab 2 Part 1 Step 6 API Gateway Select API"/></p>

**Passo 7** - No menu esquerdo, clique em **Stages** e então no *stage* **v1** (versão 1). A URL de chamada será mostrada. Essa é a URL base de todos os microsserviços (_incluindo **/v1** no final_).

<p align="center"><img src="./images/lab2/part1/apigw_invoke_url.png" alt="Lab 2 Part 1 Step 6 API Gateway Select API"/></p>

**Passo 8** - Agora vamos verificar que a base do nosso serviço gerenciador de produtos está funcionando, fazendo uma chamada para seu endpoint de health check. Para este passo e os seguintes, você pode utilizar o **cURL**, Postman ou outra ferramenta de sua preferência. Vamos chamar o método GET em `/product/health` para verificar que o serviço está rodando. Copie e cole o comando abaixo, substituindo **INVOKE-URL** com o endereço e nome do _stage_ que foi disponibilizado no API Gateway no passo anterior.

```bash
curl -w "\n" --header "Content-Type: application/json" INVOKE-URL/product/health
```

**Garanta que você incluiu o nome do _stage_ da API no final da URL _antes_ de /product/health**. Você deve obter uma mensagem de sucesso no formato JSON do comando **cURL** executado, indicando que a requisição foi processada com sucesso e o serviço está pronto para processar outras requisições.

**Passo 9** - Agora que sabemos que o serviço está funcionando, podemos adicionar um novo produto ao catálogo através da API REST. Envie o seguinte comando REST para criar o seu primeiro produto. Copie e cole o seguinte comando (garanta que todo o conteúdo está sendo copiado), substituindo **INVOKE-URL** com a URL base obtida no passo 7.

```bash
curl -w "\n" --header "Content-Type: application/json" --request POST --data '{"sku": "1234", "title": "My Product", "description": "A Great Product", "condition": "Brand New", "conditionDescription": "New", "numberInStock": "1"}' INVOKE-URL/product
```

**Passo 10** - Vamos verificar se os dados enviados foram gravados com sucesso na tabela do DynamoDB que criamos. Vá até o serviço DynamoDB na console AWS e clique em **Tables** na lista de opções no canto superior esquerdo da página. Uma lista de tabelas deve ser exibida no centro da tela. Encontre a tabela **ProductBootcamp** e clique no link com o nome da tabela. Isso irá mostrar algumas informações básicas da tabela. Selecione o botão **Show Items** no topo da tela, e você verá a lista de itens na tabela produtos, que deverá incluir o item que você acabou de adicionar.

<p align="center"><img src="./images/lab2/part1/dynamo_table_items.png" alt="Lab 2 Part 1 Step 10 DynamoDB Table Items"/></p>

**Recap**: Esse exercício inicial ilustra uma versão single-tenant do serviço gerenciador de produtos, que não possui contextos de identidade ou tenant. Em diversos aspectos, ele representa o tipo de serviço que você encontraria em diversos ambientes não-SaaS, e nos dá uma boa base para pensar em como podemos evoluir o serviço para incorporar conceitos multi-tenant.

## Parte 2 - Adicionando Particionamento de Dados Multi-Tenant

O primeiro passo para tornar nosso serviço _multi-tenant aware_ é implementar um modelo de particionamento onde podemos persistir dados de múltiplos tentants em um único banco de dados DynamoDB. Também precisaremos injetar um contexto de tenant nas requisições REST e utilizar esse contexto para cada uma das operações CRUD.

Para fazer isso, precisaremos de uma configuração diferente para o banco de dados DynamoDB, introduzindo um identificador de tenant como partition key. Também precisaremos de uma nova versão do serviço que aceite um identificador de tentant em cada método REST e aplique esse identificador conforme o acesso às tabelas.

O processo de adicionar essas funcionalidades ao serviço gerenciador de produtos serão detalhados no passo-a-passo abaixo.

**Passo 1** - Para essa iteração, precisaremos de uma nova versão do nosso serviço. Embora não iremos modificar o código diretamente, vamos dar uma olhada nas mudanças de código realizadas para suportar o particionamento de dados. Abra o arquivo server.js do gerenciador de produtos na IDE Cloud9. No Cloud9, vá até `Lab2/Part2/product-manager/`, clique com o botão direito do mouse em `server.js` e clique em **Open**.

<p align="center"><img src="./images/lab2/part2/cloud9_open_script.png" alt="Lab 2 Part 2 Step 1 Cloud9 Open Script"/></p>

Este arquivo não parece muito diferente da versão anterior. Na verdade, a única mudança é que adicionamos um identificador de tenant nos parâmetros que fornecemos ao DynamoDBHelper. Abaixo temos um trecho de código do arquivo.

```javascript
app.post('/product', function(req, res) {
	var product = req.body;
	var guid = uuidv4();
	product.product_id = guid;
	product.tenant_id = req.body.tenant_id;
	winston.debug(JSON.stringify(product));
	// construct the helper object
	tokenManager.getSystemCredentials(function(credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.putItem(product, credentials, function(err, product) {
			if (err) {
				winston.error('Error creating new product: ' + err.message);
				res.status(400).send('{"Error": "Error creating product"}');
			} else {
				winston.debug('Product ' + req.body.title + ' created');
				res.status(200).send({status: 'success'});
			}
		});
	});
});
```

A linha `product.tenant_id = req.body.tenant_id;` representa a única mudança que existe entre essa versão e a original. Ela extrai o identificador de tenant da requisição e adiciona ao objeto do produto. Isso, claro, significa que as chamadas REST para esse método devem fornecer um identificador de tenant em cada invocação desse método.

**Passo 2** - Até esse ponto, não olhamos o **DynamoDBHelper** para ver como ele realiza o acesso aos itens da tabela no DynamoDB. Esse módulo encapsula o cliente do DynamoDB da AWS com alguns elementos para permitir o isolamento entre tenants. Na verdade, mesmo colocando esse modelo de identificador de tenant, isso não muda como o DynamoDBHelper processa a requisição. Abaixo temos um trecho de código do DynamoDBHelper para o método `getItem()`:

```javascript
DynamoDBHelper.prototype.getItem = function(keyParams, credentials, callback) {
    this.getDynamoDBDocumentClient(credentials, function (error, docClient) {
        var fetchParams = {
            TableName: this.tableDefinition.TableName,
            Key: keyParams
        }
        docClient.get(fetchParams, function(err, data) {
            if (err) {
                winston.debug(JSON.stringify(docClient.response));
                callback(err);
            } else {
                callback(null, data.Item);
            }
        });
    }.bind(this));
}
```

Você pode perceber que estamos passando todos os parâmetros que construímos no serviço gerenciador de produtos como o valor `keyParams` da estrutura `fetchParams`. O cliente usará esses parâmetros para fazer a correspondência com a partition key da tabela. Podemos concluir que nada de especial foi feito no código para permitir o particionamento por um identificador de tenant. É apenas outra chave na nossa tabela DynamoDB.


**Passo 3** - Agora que você tem uma visão melhor de como esse serviço é alterado para suportar o particionamento de dados, vamos seguir adiante e implantar a versão 2 do gerenciador de produtos, através da IDE Cloud9. Vá até o diretório `Lab2/Part2/product-manager`, clique com o botão direito em `deploy.sh`, e clique em **Run** para rodar o shell script.

<p align="center"><img src="./images/lab2/part2/cloud9_run_script.png" alt="Lab 2 Part 2 Step 3 Cloud9 Run Script"/></p>

**Passo 4** - Aguarde a execução do script `deploy.sh`.

<p align="center"><img src="./images/lab2/part2/cloud9_run_script_complete.png" alt="Lab 2 Part 2 Step 4 Cloud9 Script Finished"/></p>

**Passo 5** - Com esse novo esquema de particionamento, nós também devemos modificar a configuração da tabela do DynamoDB. Se você se lembra, a tabela atual usava **product_id** como partition key. Agora precisamos ter **tenant_id** como partition key e utilizar **product_id** como sort key, já que nós podemos fazer uma ordenação nesse valor. A forma mais fácil de fazer essa mudança é simplesmente **_apagar_** a tabela **ProductBootcamp** existente e criar uma nova com a configuração correta.

Vá até o serviço DynamoDB no console da AWS e selecione a opção **Tables** do menu do lado superior esquerdo da página. Selecione o botão para a tabela **ProductBootcamp**. Após selecionar a tabela de produtos, clique no botão **Delete table**. Você será solicitado a confirmar a remoção dos alarmes do CloudWatch para completar o processo.

<p align="center"><img src="./images/lab2/part2/dynamo_delete_table.png" alt="Lab 2 Part 2 Step 5 DynamoDB Delete Table"/></p>

**Passo 6** - Agora podemos começar o processo de criação da tabela do zero. Clique no botão **Create table** no topo da página. Como anteriormente, utilize **ProductBootcamp** como nome da tabela, mas dessa vez, coloque **tenant_id** como partition key. Agora coloque **product_id** como sort key. Clique no botão **Create** para finalizar o processo.

<p align="center"><img src="./images/lab2/part2/dynamo_create_table.png" alt="Lab 2 Part 2 Step 6 DynamoDB Create Table"/></p>

**Passo 7** - O serviço foi modificado para suportar a introdução de um identificador de tenant e modificamos a tabela do DynamoDB para particionar os dados com base nesse identificador. Agora precisamos validar que a nova versão do serviço está no ar. Execute o seguinte comando do cURL para chamar o health check no serviço. Se necessário, você pode verificar na Parte 1 como obter a URL do API Gateway. Copie e cole o seguinte comando, substituindo **INVOKE-URL** pela URL e _stage name_ que você obteve nas configurações do API Gateway.

```bash
curl -w "\n" --header "Content-Type: application/json" INVOKE-URL/product/health
```
**Garanta que você incluiu o _stage name_ no final da URL antes de /product/health.** Você deverá obter uma mensagem de sucesso no formato JSON do comando **cURL** indicando que a requisição foi processada com sucesso e o serviço está pronto para processar outras requisições.

**Passo 8** - Agora que sabemos que o serviço está no ar, podemos adicionar um novo produto ao catálogo através da API REST. Diferentemente da nossa chamada REST anterior, esta deverá incluir o identificador de tenant como parte da requisição. Execute o seguinte comando REST para criar um produto para o tenant "**123**". Copie e cole o comando a seguir (garanta que você tenha selecionado todo o comando), substituindo **INVOKE-URL** pela URL e _stage name_ que você obteve nas configurações do API Gateway. 

```bash
curl -w "\n" --header "Content-Type: application/json" --request POST --data '{"tenant_id": "123", "sku": "1234", "title": "My Product", "description": "A Great Product", "condition": "Brand New", "conditionDescription": "New", "numberInStock": "1"}' INVOKE-URL/product
```

Esse comando parece muito com o exemplo anterior. No entanto, note que estamos pasando um parâmetro `tenant_id` ("123") no body da requisição.

**Passo 9** - Antes de verificar que essa entrada foi gravada corretamente, vamos inserir um outro produto para outro tenant. Isso demonstra o fato que nosso esquema de particionamento consegue armazenar dados separadamente para cada tenant. Para adicionar um produto para um tenant diferente, nós precisamos apenas executar outro comando POST para um tenant diferente. Realize a chamada POST a seguir para o tenant "**456**". Copie e cole o comando a seguir (garanta que você tenha selecionado todo o comando), substituindo **INVOKE-URL** pela URL e _stage name_ que você obteve nas configurações do API Gateway. 

```bash
curl -w "\n" --header "Content-Type: application/json" --request POST --data '{"tenant_id": "456", "sku": "1234", "title": "My Product", "description": "A Great Product", "condition": "Brand New", "conditionDescription": "New", "numberInStock": "1"}' INVOKE-URL/product
```

**Passo 10** - Vamos verificar que os dados que enviamos foram gravados com sucesso na tabela DynamoDB que criamos. Vá até o serviço DynamoDB na console da AWS e selecione **Tables** da lista de opções no lado superior esquerdo da página. O centro da página deve mostar uma lista de tabelas. Encontre a tabela **ProductBootcamp** e selecione o link com o nome da tabela. Isso irá mostar informações básicas sobre a tabela. Agora selecione o botão **View Items** no topo da tela e você verá a lista de itens na sua tabela, que deverão incluir os dois itens que você acabou de adicionar. Verifique que esses dois itens existem e são particionados com base nos dois identificadores de tenant fornecidos ("123" e "456"). 

<p align="center"><img src="./images/lab2/part2/dynamo_scan_table.png" alt="Lab 2 Part 2 Step 10 DynamoDB Scan Table"/></p>

**Recap**: Você adicionou o particionamento de dados no serviço com sucesso. O microsserviço faz o particionamento ao adicionar um identificador de tenant ao serviço gerenciador de produtos e ao modificar a tabela para usar **tenant_id** como partition key. Agora, todas as operações CRUD são _multi-tenant aware_.

## Parte 3 - Utilizando Contexto de Tenant

Nesse ponto, temos particionamento de dados, mas a maneira que adicionamos o contexto de tenant foi, de certa forma, tosca. Não é uma maneira prática ou segura passar como parâmetro os identificadores de tenant em cada chamada efetuada. Para melhorar esse cenário, o contexto de tenant deve vir dos tokens que são parte do processo de autenticação que configuramos no laboratório anterior.

Nosso próximo passo é habilitar o serviço para extrair o contexto de tenant desses tokens de segurança. Dessa forma, o sistema de particionamento que acabamos de configurar pode depender de um identificador de tenant que foi provisionado durante o cadastro e simplesmente passa até o serviço no header de cada requisição HTTP.

Nesta seção, vamos ver como o serviço gerenciador de produtos é atualizado com códigos novos para extrair esses tokens da requisição HTTP e aplicá-los ao nosso modelo de segurança e particionamento de dados.

**Passo 1** - Para essa iteração, precisaremos de uma nova versão do nosso serviço. Embora não iremos modificar o código diretamente, vamos dar uma olhada nas mudanças de código realizadas para suportar a aquisição do contexto de tenant a partir dos tokens de identidade. Abra a nova versão do serviço gerenciador de produtos no Cloud9 abrindo o arquivo `Lab2/Part3/product-manager/server.js`.

<p align="center"><img src="./images/lab2/part3/cloud9_open_script.png" alt="Lab 2 Part 3 Step 1 Cloud9 Open Script"/></p>

A versão 3 do serviço gerenciador de produtos introduz um novo objeto auxiliar **TokenManager** que abstrai vários aspectos do processamento do token. Vamos dar uma olhada em um trecho dessa nova versão para ver como o contexto do tenant é obtido a partir da identidade do usuário:

```javascript
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    bearerToken = req.get('Authorization');
    if (bearerToken) {
        tenantId = tokenManager.getTenantId(req);
    }
    next();
});
```
A função `getTenantId` do TokenManager mostrada aqui, que aparece na maioria dos serviços de nossa aplicação, fornece o mecanismo para obter o identificador de tenant dos **headers HTTP** para cada requisição REST. Isso é feito através do mecanismo de middleware do framework Express. O middleware permite introduzir uma função que intercepta e pré-processa cada requisição HTTP antes de ser processada pelas funções de cada método REST.

Após os headers da resposta serem definidos, o _bearer token_ é extraído do header **HTTP Authorization**. Esse token possui os dados que queremos utilizar para obter o contexto de tenant. Usamos o **TokenManager** para obter o identificador do tenant da requisição. A chamada para essa função retorna o identificador do tenant e atribui à variavel `tenantId`. Ao longo do código do serviço, são feitas referências a esta variável para obtenção do contexto de tenant.

**Passo 2** - Agora que temos o identificador do tenant, as mudanças são relativamente simples. Você pode ver que mudamos a maneira que obtemos o identificador do tenant, fazendo referência ao **tenantId** que extraímos do _bearer token_ no middleware do Passo 1 (ao invés de obter do body da requisição).

```javascript
app.get('/product/:id', function(req, res) {
	winston.debug('Fetching product: ' + req.params.id);
	// init params structure with request params
	var params = {
		tenant_id: tenantId,
		product_id: req.params.id
	};
	tokenManager.getSystemCredentials(function(credentials) {
		// construct the helper object
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.getItem(params, credentials, function(err, product) {
			if (err) {
				winston.error('Error getting product: ' + err.message);
				res.status(400).send('{"Error": "Error getting product"}');
			} else {
				winston.debug('Product ' + req.params.id + ' retrieved');
				res.status(200).send(product);
			}
		});
	});
});
```

**Passo 3** - Como você pode imaginar, a maioria do trabalho de processar o token foi intencionalmente colocada na classe auxiliar. Vamos dar uma olhada nessa classe para ver como ela extrai esse contexto dos tokens.

Abaixo temos um trecho do código do TokenManager que é chamado para extrair o token. Essa função extrai o token de segurança do header Authorization da requisição HTTP, o decodifica, e obtém o tenantId a partir do token decodificado. _Em um ambiente de produção, essa extração usaria um certificado assinado como medida de segurança para garantir que o conteúdo do token não foi modificado de forma indevida._

```javascript
module.exports.getTenantId = function(req) {
    var tenantId = '';
    var bearerToken = req.get('Authorization');
    if (bearerToken) {
        bearerToken = bearerToken.substring(bearerToken.indexOf(' ') + 1);
        var decodedIdToken = jwtDecode(bearerToken);
        if (decodedIdToken) {
            tenantId = decodedIdToken['custom:tenant_id'];
        }
    }
    return tenantId;
}
```

**Passo 4** - Agora que você tem uma visão geral de como aplicamos o contexto do tenant através dos headers HTTP, vamos implantar a versão 3 do gerenciador de produtos, dentro da IDE Cloud9. Vá até o diretório `Lab2/Part3/product-manager/`, clique com o botão direito em `deploy.sh`, e clique em **Run** para executar o shell script.

<p align="center"><img src="./images/lab2/part3/cloud9_run_script.png" alt="Lab 2 Part 3 Step 4 Cloud9 Run Script"/></p>

**Passo 5** - Aguarde a execução do script `deploy.sh`.

<p align="center"><img src="./images/lab2/part3/cloud9_run_script_complete.png" alt="Lab 2 Part 3 Step 5 Cloud9 Script Finished"/></p>

**Passo 6** - Agora que a aplicação foi implantada, é hora de ver como esse novo contexto de tenant e segurança é processado. Temos que ter um token válido para nosso serviço para termos sucesso. Isso significa voltar à aplicação web, que já possui a habilidade de autenticar um usuário e obter um token válido do _identity provider_, o Cognito. Primeiramente, precisamos garantir que temos ao menos dois tenants registrados.

Você já registrou um tenant no Lab 1. Vamos adicionar um segundo tenant seguindo os mesmos passos do Lab 1. Entre com o endereço da aplicação que você criou no Lab 1 e clique no botão **Register** quando a tela de login aparecer. Se necessário, verifique no guia do Lab 1 como obter a URL da aplicação no serviço **CloudFront**.

**Passo 7** - Preencha o formulário com as informações do novo tenant. Como estamos criando dois tenants, você precisará de **dois endereços de email**. Se você não tiver dois emails, você pode usar a mesma dica do Lab 1, que utiliza o "mais" (**+**) no username antes do arroba (**@**). Após preencher o formulário, clique no botão **Register**.

**Passo 8** - Da mesma forma que no Lab 1, você precisa verificar seu email para a mensagem de validação que foi enviada pelo Cognito. Você irá encontrar uma mensagem que inclui o username (o endereço de email) junto com uma senha temporária (gerada pelo Cognito). A mensagem vai ser parecida com essa:

<p align="center"><img src="./images/lab2/part3/cognito_email.png" alt="Lab 2 Part 3 Step 8 Cognito Validation Email"/></p>

**Passo 9** - Agora podemos fazer login na aplicação usando essas credenciais. Retorne à aplicação usando o endereço públco criado no Lab 1. Entre com as credenciais temporárias que foram providas no email e clique no botão **Login**.

<p align="center"><img src="./images/lab2/part3/login.png" alt="Lab 2 Part 3 Step 9 Login"/></p>

**Passo 10** - O sistema irá detectar que essa é uma senha temporária e indicar que você precisa definir uma nova senha para sua conta. Para isso, a aplicação redireciona para um novo formulário onde você irá definir sua nova senha (como ilustrado abaixo). Crie a nova senha e clique no botão **Confirm**.

<p align="center"><img src="./images/lab2/part3/change_password.png" alt="Lab 2 Part 3 Step 10 Reset Password"/></p>

Depois de ter alterado a senha, você estará logado na aplicação e visualizando a home page. Não iremos entrar nos detalhes específicos da aplicação ainda.

**Passo 11** - Você deve ter dois tenants para terminar os exercícios desse lab. Se você possui apenas um tenant registrado, crie outro, repetindo os passos 6-10 novamente, utilizando um email diferente para esse tenant novo.

**Passo 12** - Agora que os tenants foram criados pelo fluxo de onboarding, vamos criar alguns produtos através da aplicação. Entre na aplicação como o tenant 1 e vá até o item **Catalog** no topo da página.

<p align="center"><img src="./images/lab2/part3/catalog.png" alt="Lab 2 Part 3 Step 12 Catalog Page"/></p>

**Passo 13** - Com a página **Catalog** aberta, clique no botão **Add Product** no canto superior direito da página. Entre com os detalhes do produto, com dados de sua escolha. No entanto, para o **SKU**, coloque **TENANTONE** antes do valor desejado. Por exemplo, o primeiro SKU pode ser "**TENANTONE-ABC**". O que queremos com isso é ter valores _específicos_ no começo do SKU, para claramente identificar os produtos perntencentes a um tenant específico.

<p align="center"><img src="./images/lab3/part1/add_product1.png" alt="Lab 3 Part 1 Step 7 Add Product"/></p>

**Passo 14** - Adicione alguns produtos para o primeiro tenant. Em seguida, clique no menu com o nome deste tenant no canto superior direito da tela e clique em **Logout**. Você será redirecionado à página de login.

<p align="center"><img src="./images/lab2/part3/logout.png" alt="Lab 2 Part 3 Step 14 Logout"/></p>

**Passo 15** - Entre com as credenciais do segundo tenant que você criou, e clique no botão **Login**. Você terá entrado como um tenant diferente, e verá um nome diferente no menu de seleção de perfil no canto superior direito da tela.

**Passo 16** - Agora vá à tela **Catalog** novamente. Note que a lista de produtos está vazia. Os produtos que você criou anteriormente foram associados com outro tenant, por isso não estão sendo mostrados aqui. **Isso demonstra que o particionamento está funcionando.**

**Passo 17** - Como antes, clique em **Add Product** e adicione os dados dos produtos com as informações que desejar. No entanto, para o SKU, comece todos com **TENANTTWO**. Por exemplo, o primeiro SKU pode ser "**TENANTTWO-ABC**". O que queremos com isso é ter valores _específicos_ no começo do SKU, para claramente identificar os produtos perntencentes a este tenant em específico.

<p align="center"><img src="./images/lab3/part1/add_product2.png" alt="Lab 3 Part 1 Step 13 Add Product"/></p>

**Passo 18** - Após completar esse processo e adicionar os produtos para dois tenants separados, podemos ver como esses dados foram gravados no DynamoDB. 

Vá até o serviço **DynamoDB** na console da AWS, clique em **Tables**, na lista de opções no canto superior esquedo da página. Selecione a tabela **ProductBootcamp** e então a aba **Items**. Note que essa tabela é particionada por `tenant_id`. Você deve ver os produtos que você adicionou pela aplicação web enquanto logado como os dois diferentes tenants (separados dos produtos adicionados pela API REST anteriormente no lab).

<p align="center"><img src="./images/lab2/part3/product_table.png" alt="Lab 2 Part 3 Step 18 Product Table"/></p>

**Passo 19** - Se você verificar a tabela **TenantBootcamp**, você deve ver as entradas para os tenants que você criou pela aplicação web, e os GUIDs gerados automaticamente no campo **tenant_id** corresponderão ao campo **tenant_id** nas entradas na tabela **ProductBootcamp**.

**Recap**: Nesse exercício, você melhorou o mecanismo de obtenção do contexto do tenant nos microsserviços ao extrair os "claims" customizados do token de segurança passado no header HTTP Authorization. Nós reduzimos a complexidade para os desenvolvedores utilizarem o contexto do tenant ao criar uma classe auxiliar TokenManager, que utiliza o mecanismo de "middleware" do framework Express para interceptar todas as requisições antes de executar a função que corresponde à chamada REST.

[Continue para o Lab 3](Lab3-pt-br.md)

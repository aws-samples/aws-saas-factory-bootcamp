# Lab 3 – Isolating Tenant Data

### Overview

At this stage, we have addressed many of the core elements of SaaS architecture. What we really haven't touched on, though, is tenant isolation. As a SaaS provider, you must make every attempt to ensure that each tenant's resources are protected from any kind of cross-tenant access. This is especially challenging when these tenants are sharing elements of their infrastructure. If, for some reason, one tenant was able to access another tenant's environment, that could represent a huge setback for a SaaS business.

To address this, we must move beyond basic authentication. We must introduce policies and access controls that ensure that we are doing everything we can to isolate and protect tenant environments. Even in SaaS environments where resources are not shared, we must take extra measures to be sure that we've minimized our exposure to cross-tenant access.

For this bootcamp, we'll focus squarely on how to isolate the data that resides in our DynamoDB tables. Specifically, we want to look at how can we can successfully isolate the tenant data that resides in the product and order tables that hold application data. To achieve this, we need to consider how we've partitioned the data. Below is a diagram that highlights the partitioning scheme of the product and order tables.

<p align="center"><img src="./images/lab3/table_partitioning.png" alt="Lab 3 Isolating Tenant Data Overview Table Partitioning"/></p>

In this example graphic, you'll see that we have data from multiple tenants living side-by-side as items in these tables. So, if I get access to one of these tables, I could presumably get access to any tenant's data.

Our goal then is to implement a security model that can scope access to these tables down to the item level. Essentially, I want to build a view of the table that constrains access to just those items that are valid for a given tenant.

For this bootcamp, we're going to leverage a combination of Amazon Cognito, Amazon Identity and Access Management (IAM), and AWS Security Token Service
(STS) to limit access to these tables. This will connect directly to the notion of SaaS identity we discussed earlier, leveraging the tokens from the experience to bind a user to a scoped set of policies.

There are two key phases to implementing this isolation model. First, when tenants are initially provisioned, we need to create a set of IAM roles for each tenant. For every role that exists in the tenant's environment, we must create policies that scope access to the system's resource for that tenant. Below you'll see a conceptual representation of this the onboarding process and how it creates these roles for each tenant.

<p align="center"><img src="./images/lab3/onboarding.png" alt="Lab 3 Isolating Tenant Data Overview Onboarding"/></p>

On the left is the registration process we built in Lab 1. On the right are collections of policies that are emitted (behind the scenes) for each role. It's important to note that you are not required to have separate roles for each user. Instead, these roles apply to all users for that tenant.

The second phase of isolation comes into play when you are accessing resources from your code. The diagram below illustrates the fundamental moving parts of this process.

<p align="center"><img src="./images/lab3/authentication.png" alt="Lab 3 Isolating Tenant Data Overview Authentication"/></p>

In this example, you'll see that our product manager service is invoked from the UI with a request to get a list of products. The JWT token (acquired during authentication) is passed along here in the Authorization header of our HTTP request. This token includes data about the user identity, role, and tenant identity. While this token is valuable for conveying user and tenant attributes, it does nothing to control a tenant's access to resources. **Instead, we must use the data in this token to acquire the scoped credentials we need to access our DynamoDB tables**.

The remaining bits of the diagram illustrate how these scoped credentials are acquired. Once our `GET` request comes into our product manager service, we'll make a `getCredentialsForIdentity()` call to Cognito, passing in our token. Cognito will then crack that token open, examine the tenant identifier and user role and match it to one of the policies that were created during provisioning. It will then create a **temporary** set of credentials (shown at the bottom) via STS and return those to our product manager service. Our service will use these temporary credentials to access DynamoDB tables with confidence that these credentials will scope access _by tenant id_.

### What You'll Be Building
Our goal in this exercise is to walk you through the configuration and creation of some of the elements that are part of this process. While the concepts are helpful above, we want to expose you to some of the specifics of how they are used in our reference solution. We'll start by introducing the policies during provisioning and how to configure Cognito to connect our policies to user roles. Lastly, we'll look at how this lands in the code of our application services. The basic steps in this process include:

* **Example of Cross Tenant Access** – first you'll look at how, without policies and scoping, a developer can create a situation that violates the cross-tenant boundaries of the system.
* **Configure the Provisioned IAM Policies** – now that you've seen an example of cross tenant access, let's start to introduce policies that can be used to prevent cross-tenant access (intended or un-intended). You'll create a policy for different role/resource combinations to get a sense of how these policies are used to scope access to DynamoDB tables. You'll then provision a new tenant and see how these policies are represented in IAM.
* **Mapping User Roles to Policies** – with Cognito, we can create rules that determine how a user's role will map to the policies that we've created. In this part you'll see how these policies have been configured for our tenant and user roles.
* **Acquiring Tenant-Scoped Credentials** – finally you'll see how to orchestrate the acquisition of credentials that are scoped by the policies outlined above. The credentials will control our access to data. You'll see how this explicitly enforces cross-tenant scoping.

With this piece in place, you'll have added a robust mechanism to your solution that much more tightly controls and scopes access to tenant resources. This solution highlights one of many strategies that could be applied to enforce tenant isolation.

## Part 1 - Example of Cross-Tenant Access
Before we introduce **policies**, it would help to examine a scenario where the absence of richer security policies can open the door to cross-tenant access. We will look at an (admittedly contrived) example where a developer could introduce code that might enable cross-tenant access.

To do this, we'll return to the product manager service and look at how manually injected tenant context could surface data in your application that should not be surfaced. This will set the stage for understanding how the introduction of **policies** can prevent this from happening.

**Step 1** - In [Lab 2](Lab2.md) we added products to the catalogs for each of our two tenants. If you do not have two tenants registered at this point with at least 1 product each, please follow the steps in Lab 2 to complete that now.

To artificially create cross tenant access, we need the unique tenant identifiers. Let's go find the tenant id's for our two different tenants. Navigate to the **DynamoDB** service in the **AWS console** and select the **Tables** option located on the upper left-hand side of the page. Select the **TenantBootcamp** table and then the **Items** tab.

<p align="center"><img src="./images/lab3/part1/dynamo_tenant.png" alt="Lab 3 Part 1 Step 14 Dynamo TenantBootcamp Table"/></p>

**Step 2** - Locate the two tenants you created within the list by matching the tenant with the username/email that you used. **Capture the tenant_id value for both of these tenants**. You'll need these values in subsequent steps.
 
**Step 3** - Now let's go back to the code of our product manager service and make a modification. Open our product manager `server.js` file in our Cloud9 IDE. In Cloud9, navigate to `Lab3/Part1/product-manager/`. Open the file in the editor by either double-clicking or right-click `server.js` and click **Open**.

<p align="center"><img src="./images/lab3/part1/open_server.js.png" alt="Lab 3 Part 1 Step 16 Open server.js"/></p>

**Step 4** - Locate the `GET` function that fetches all products for a tenant. The code function will appear as follows:

```javascript
app.get('/products', function(req, res) {
	var searchParams = {
		TableName: productSchema.TableName,
		KeyConditionExpression: "tenant_id = :tenant_id",
		ExpressionAttributeValues: {
			":tenant_id": tenantId
			//":tenant_id": "<INSERT TENANT TW0 GUID HERE>"
		}
	};
	// construct the helper object
	tokenManager.getSystemCredentials(function(credentials) {
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.query(searchParams, credentials, function(error, products) {
			if (error) {
				winston.error('Error retrieving products: ' + error.message);
				res.status(400).send('{"Error": "Error retrieving products"}');
			} else {
				winston.debug('Products successfully retrieved');
				res.status(200).send(products);
			}
		});
	});
});
```

This function is invoked by the application to acquire a list of products that populate the catalog page of system. You can see that it references the `tenant_id` that was extracted from the security token passed into our application. Let's consider what might happen if were **manually replace** this `tenant_id` with another value. Locate the `tenant_id` that you recorded earlier from DynamoDB for **TenantTwo** and _**replace**_ the `tenant_id` with this value. So, when you're done, it should appear similar to the following:

```javascript
app.get('/products', function (req, res) {
    winston.debug('Fetching Products for Tenant Id: ' + tenantId);
    var searchParams = {
        TableName: productSchema.TableName,
        KeyConditionExpression: "tenant_id = :tenant_id",
        ExpressionAttributeValues: {
            ":tenant_id": "TENANT4c33c2eae9974615951e3dc04c7b9057"
        }
    };
    // construct the helper object
    tokenManager.getSystemCredentials(function (credentials) {
        var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
        dynamoHelper.query(searchParams, credentials, function (error, products) {
            if (error) {
                winston.error('Error retrieving products: ' + error.message);
                res.status(400).send('{"Error" : "Error retrieving products"}');
            } else {
                winston.debug('Products successfully retrieved');
                res.status(200).send(products);
            }

        });
    });
});
```

**Step 5** - Now we need to deploy our updated product manager microservice with our cross tenant access violation in-place. First, save your edited `server.js` file in Cloud9 by clicking **File** on the toolbar followed by **Save**.

<p align="center"><img src="./images/lab3/part1/cloud9_save.png" alt="Lab 3 Part 1 Step 18 Save server.js"/></p>

**Step 6** - To deploy our modified service, navigate to the `Lab3/Part1/product-manager/` directory and right-click `deploy.sh`, and click **Run** to execute the shell script.

<p align="center"><img src="./images/lab3/part1/cloud9_run.png" alt="Lab 3 Part 1 Step 19 Cloud9 Run"/></p>

**Step 7** - Wait for the `deploy.sh` shell script to execute successfully.

<p align="center"><img src="./images/lab3/part1/cloud9_run_script_complete.png" alt="Lab 3 Part 1 Step 20 Cloud9 Script Finished"/></p>

**Step 8** - With our new version of the service deployed, we can now see how this impacted the application. Let's log back into the system with the credentials for **TenantOne** that you created above (if **TenantTwo** is still logged in, log out using the dropdown at the top right of the page).

**Step 9** - Select the **Catalog** menu option at the top of the page. This _should_ display the catalog for your **TenantOne** user you just authenticated as. However, the _**list actually contains products that are from TenantTwo**_. We've now officially crossed the tenant boundary.

**Recap**: The key takeaway here is that authentication alone is not enough to protect your SaaS system. Without additional policies and authorization in place, the code of your system could un-intentionally access data for another tenant. Here we forced this condition more explicitly, but you can imagine how more subtle changes by a developer could have an un-intended side effect.

## Parte 2 - Configurando políticas do IAM


É claro que agora nós precisamos de políticas para melhor proteger nosso sistema crontra acesso cruzado. A questão é: o que podemos fazer para isolar e proteger melhor os dados do tenant? A primeira parte do quebra-cabeça é **políticas do IAM**. Com as políticas do IAM, nós podemos criar regras que controlam o nível de acesso que cada usuário tem aos recursos do tenant.

Ao invés de criar novas políticas do zero, vamos editar políticas já criadas durante o começo do nosso processo. 

Os seguitnes passos irão guiá-lo através do processo de edição das políticas:

**Passo 1** - Para localizar as políticas que queremos editar, navegue até o serviço do IAM na console da AWS, e selecione **Policies** da lista de opções na superior esquerda da página. Isso dará a você uma lista de todas as políticas disponíveis no IAM.

**Passo 2** - Agora, nós queremos encontrar as políticas associadas aos dois tenant que criamos (**TenantOne** e **TenantTwo**). Vamos começar com o TenantOne. Precisamos digitar o nome da política na caixa de pesquisa no topo da tela. Digite o GUID do tenant TenantOne. Você obteve essa informação previamente no DynamoDB.

<p align="center"><img src="./images/lab3/part2/iam_search_policies.png" alt="Lab 3 Part 2 Step 2 IAM Search Policies"/></p>

**Passo 3** - A lista agora deve ser reduzida a apenas 2 políticas para o tenant one. Haverão a política para o tenant **administrador** e uma segunda para o tenant **usuário**. **Selecione o triângulo/seta** na coluna que precede o nome da política **TenantAdmin** para examinar em detalhes a política. Então, selecione o botão **Edit policy** que está próximo ao centro da página.

<p align="center"><img src="./images/lab3/part2/iam_edit_policy.png" alt="Lab 3 Part 2 Step 3 IAM Edit Policy"/></p>

**Passo 4** - A console agora mostrará uma lista de políticas do DynamoDB e do Cognigno User Pool. Nós estamos interessados em editar a política para a tabela **ProductBootcamp**. Entretanto, _sua localização nessa lista de tabelas do Dynamo pode variar_. Abra cada uma das entradas colapsadas do Dynamo na lista **selecionando a seta** do lado esquerdo da borda da lista. Perto da parte inferior de cada conjunto expandido de políticas, você deverá encontrar um seção **Resources**. Localize o conjunto de políticas que fazem referência a tabela **ProductBootcamp**. O ARN será similar ao seguinte:

<p align="center"><img src="./images/lab3/part2/iam_dynamo_arn.png" alt="Lab 3 Part 2 Step 4 IAM Dynamo ARN"/></p>

**Passo 5** - Nosso interesse é no **Request conditions** associado a essa política. Essas condições são o coração da nossa habilitade de controlar que itens um usuário pode acessar na tabela do Dynamo. Queremos que nossa política indique que apenas usuários com valor de chave de partição que corresponda ao identificador do tenant de **TenantOne** terão permissão para acessar esses itens na tabela. Expanda a seção de **Request conditions** e **selecione o texto da condição** isso colocará em modo de edição para as condições.

<p align="center"><img src="./images/lab3/part2/iam_request_conditions.png" alt="Lab 3 Part 2 Step 5 IAM Policy Request Conditions"/></p>

**Passo 6** - Selecione opção **Add condition** na parte de baixo da lista. Selecione **dynamodb:LeadingKeys** para o **Condition key**. Selecione **For all values in request** para o campo **Qualifier**. Selecione **StringEquals** para o campo **Operator**. Finalmente, no campo de texto **Value**, digite o GUID do **TenantOne**. Clique no botão **Add**. Selecione o botão **Review policy** e então selecione o botão **Save Changes** para salvar as mudanças na política.

<p align="center"><img src="./images/lab3/part2/iam_add_request_condition.png" alt="Lab 3 Part 2 Step 6 IAM Policy Add Request Condition"/></p>

Este processo criou uma nova **request condition** para nossa política que agora indica a qual o valor da chave de partição do DynamoDB deve corresponder ao identificador do tenant quando o usuário tentar acessar os itens da tabela.

**Passo 7** - Agora queremos repetir esse mesmo processo para o **TenantTwo**. Complete os passos de 2-6 substituindo todas as referências ao TenantOne com **TenantTwo**. Isso garantirá que o TenantTwo também estará protegido.

**Recapitulando**: Os exercícos desta parte do laboratório mostraram como implementar os elementos necessários para apoiar nossos objetivos de isolamento de tenant. Alteramos nossas **políticas** de tenant introduzindo mudanças que nos permitem definir o escopo do acesso às tabelas do DynamoDB. Isso foi possível adicionando uma nova condição às nossas políticas de tabela ProductBootcamp. Essas políticas, que são específicas do tenant, limitam a visão do usuário da tabela apenas aos itens que contêm nosso identificador de tenant na chave de partição da tabela.

## Parte 3 - Mapeando roles de usuários para políticas

Agora que definimos as políticas, precisamos de algum jeito de conectar essas políticas com as roles de usuários específicas. Nós precisamos de uma maneira de criar uma correspondência entre a role do usuário e o escopo do tenant para um conjunto _específico_ de políticas. Para este cenário, vamos ter o apoio das **capacidade do mapeamento de roles do Cognito**. O Cognito nos permitirá definir um conjunto de condições que serão usadas para criar essa correspondência e, no processo, emitir um **conjunto de credenciais** que será escopo com base nas políticas correspondente - que é exatamente o que precisamos para implementar nosso modelo de isolamento de tenant. 

Neste bootcamp, esses mapeamentos de política já foram criados. Vamos dar uma olhada nelas na **console do Cognito**.

**Passo 1** - Navegue até o Cognito na console da AWS. Na página inicial, selecione o botão **Manage Identity Pools**  para ver a lista de identity pools. A lista incluirá **pool separados** para cada tenant que você realizou o onboarding.

Localize os identity pools para o **TenantOne** e **TenantTwo**. Eles estarão nomeados com o GUID do tenant. Clique no identity pool que é associado com o **TenantOne**.

<p align="center"><img src="./images/lab3/part3/cognito_identity_pools.png" alt="Lab 3 Part 3 Step 1 Cognito Identity Pools"/></p>

**Passo 2** - Uma vez selecionado o identity pool, você vê a página que fornece um resumo da atividade do identity pool. Agora selecione o link **Edit identity pool** no topo direito da página.

<p align="center"><img src="./images/lab3/part3/cognito_identity_pool_details.png" alt="Lab 3 Part 3 Step 2 Cognito Identity Pool Details"/></p>

**Passo 3** - Se você rolar para baixo a página de edição do identity pool, você verá uma seção para **Authentication Providers**. Expanda essa seção, e você verá uma página com configurações do provedor de autorização. 

Você pode ver os mapeamentos de roles em funcionamento para nossas duas roles. Há uma role **TenantAdmin** que representa o administrador e uma role **TenantUser** que mapeia usuários não administradores para cada um do seus sistemas SaaS. Naturalmente, esses tem diferentes níveis de acesso ao sistema e dos recursos.

A coluna de claim tem um valor (URL codificado) que corresponde ao atributo customizado **role** que configuramos no Cognito no Lab 1. Quando esse **claim customizado corresponde** ao nome da role, a política do IAM (com as restrições para o DynamoDB) é aplicada nos **tokens de segurança temporários retornados pelo STS**.

<p align="center"><img src="./images/lab3/part3/cognito_role_matching.png" alt="Lab 3 Part 3 Step 3 Cognito Role Matching"/></p>

**Recapitulando**: Agora você completou a segunda fase do nosso isolamento de tenant. Com esse exercício, observamos as regras de mapeamento de roles no identity pool do Cognito. Esses mapeamentos associam diretamente as roles de tenant (TenantAdmin e TenantUser) às políticas que configuramos na primeira parte deste laboratório.

## Parte 4 - Obtendo credenciais baseado no escopo do tenant

Nesse ponto, todos os elementos do nosso esquema de isolamento estão prontos. Nós temos autenticação com o Cognito, roles provisionadas para cada tenant com escopo para acessar as tabelas do DynamoDB, e nós temos condições de mapeamento de roles configuradas no Cognito que irá conectar todos os usuários autenticados com a políticas correspondentes. Tudo o que resta agora é inserir o código em nossos serviços da aplicação que rodarão esses elementos e obterão credenciais que estabelecerão o escopo adequado de acesso de cada tenant.

Os passos a seguir guiarão você no processo de configuração e implantação da nova versão do serviço de gerenciamento de produtos que obtém essas credenciais baseadas no escopo do tenant.

**Passo 1** - Vamos começar olhando como o serviço de gerenciamento de produtos é modificado para suportar o isolamento de tenant. No Cloud9, navegue ao diretório `Lab3/Part4/product-manager/` e abra o arquivo `server.js` no editor dando um duplo clique ou clicando com o botão direito e selecionando **Open**.

<p align="center"><img src="./images/lab3/part4/cloud9_open_server.js.png" alt="Lab 3 Part 4 Step 1 Cloud9 Open server.js"/></p>

O código abaixo destaca a última parte do quebra-cabeça do isolamento de tenant. Você irá notar que adicionamos uma chamada para nosso `tokenManager` que obtém as credenciais a partir do token de segurança do usuário autenticado. O método `getCredentialsFromToken()` recebe a requisição HTTP request e retorna as credenciais (`credentials`) que são com o **escopo do tenant**. Essas credenciais são utilizadas nas nossas chamadas para o `dynamoHelper` para assegurar que nós **não podemos cruzar os limites do tenant**.

```javascript
app.get('/product/:id', function (req, res) {
    winston.debug('Fetching product: ' + req.params.id);
    tokenManager.getCredentialsFromToken(req, function (credentials) {
        // init params structure with request params
        var params = {
            tenant_id: tenantId,
            product_id: req.params.id
        };
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
**Passo 2** - Para chamar o `getCredentialsFromToken()` descrito acima é onde toda mágica acontece em termos de mapear nosso token/identidade para as políticas apropriadas, e retornar isso em forma de credencial. Dado a importãncia dessa função, vamos olhar mais de perto o que está acontecendo. Abaixo está um pedaço de código do `TokenManager` que implementa a função `getCredentialsFromToken()`:

```javascript
module.exports.getCredentialsFromToken = function (req, updateCredentials) {
    var bearerToken = req.get('Authorization');
    if (bearerToken) {
        var tokenValue = bearerToken.substring(bearerToken.indexOf(' ') + 1);
        if (!(tokenValue in tokenCache)) {
            var decodedIdToken = jwtDecode(tokenValue);
            var userName = decodedIdToken['cognito:username'];
            async.waterfall([
                function (callback) {
                    getUserPoolWithParams(userName, callback);
                },
                function (userPool, callback) {
                    authenticateUserInPool(userPool, tokenValue, callback);
                }
            ], function (error, results) {
                if (error) {
                    winston.error('Error fetching credentials for user');
                    updateCredentials(null);
                } else {
                    tokenCache[tokenValue] = results;
                    updateCredentials(results);
                }
            });
        } else if (tokenValue in tokenCache) {
            winston.debug('Getting credentials from cache');
            updateCredentials(tokenCache[tokenValue]);
        }
    }
};
```

Vamos destacar algums elementos chaves desta função.
* A priemira ação é extrair o `bearerToken` da requisição HTTP. Este é o token que você recebeu do Cognito depois de ter autenticado com seu usuário.
* Nós então decodificamos esse token e extraimos o atributo `userName`.
* Depois, uma série de chamadas são executadas em sequência. Começa pela busca do `userPool` do usuário, depois é chamada o `authenticateUserInPool()`. Essa função, que faz parte da classe auxiliar `TokenManager`, enfim, chama o método do Cognito `getCredentialsForIdentity()` passando o token do usuário.

É essa chamada para o Cognito que **ativa o mapeamento de roles** que configuramos previamente. O Cognito irá extrair a role do token fornecido and relacionar com a política correspondente, então construir um **conjunto temporário de credenciais com escopo** que são retornadas para a função que chamou.

**Passo 3** - Então é isso que o código faz por trás das câmeras. Agora, vamos implantar a nova versão do serviços de gerenciamento de produto para vê-lo em ação. No Cloud9, navegue até o diretório `Lab3/Part4/product-manager`, clique com o botão direto no arquivo `deploy.sh`, e depois clique em **Run** para executar o script shell.

<p align="center"><img src="./images/lab3/part4/cloud9_run.png" alt="Lab 3 Part 4 Step 2 Cloud9 Run"/></p>

**Passo 4** - Aguarde até o script `deploy.sh` executar com sucesso.

<p align="center"><img src="./images/lab3/part4/cloud9_run_script_complete.png" alt="Lab 3 Part 4 Step 3 Cloud9 Script Finished"/></p>

**Passo 5** - Vamos verificar se todas as partes desse processo estão funcionando. Use a mesma URL da aplicação web que utilizamos até agora. Se o **TenantTwo** ainda está logado, deslogue usando o dropdown no topo esquerdo da barra de navegação da aplicação. Agora, logue como o **TenantOne** e acesse seus dados selecionando **Catalog** no menu e vendo os produtos do **TenantOne** aparecendo na tela. **Tudo deveria funcionar**.

Embora seja ótimo ver esse trabalho, é difícil saber se esse novo código está realmente aplicando nosso isolamento de tenant. Esse é sempre um caso difícil de testar. Vamos tentar um pouco do método de força bruta na Parte 5.

**Recapitulando**: Nós olhamos o código fonte para ver como combinamos junto o JWT **token de segurança bearer** dos cabeçalhos HTTP, nossos **claims customizados**, o **mapeamento de role para política** do Cognito, e o retorno das **credenciais temporárias do STS** para aplicar no isolamento de tenant no nosso sistemas. Nós então implantamos uma versão atualizada do serviço de gerenciamento do produto para remover nosso "hack de segurança" manual dos passos anteriores.

## Parte 5 - Verificando credenciais com escopo do tenant

Nesse momento, nós incorporamos segurança a nível de IAM utilizando a função do Cognito
`getCredentialsForIdentity()`, mas não avaliamos se podemos contornar/burlar nossas medidas de segurança. Como fizemos antes, vamos **manualmente sobreescrever o identificador do tenant** para verificar se conseguimos quebrar o isolamento de tenants. Isso irá demonstrar se, contanto que as políticas de acesso e roles definidas anteriormente sejam configuradas corretamente, **nossas medidas de isolamento de tenant não podem ser derrotadas** introduzindo um tenant diferente da identidade SaaS autenticada.

**Passo 1** - Como antes, modificaremos o código-fonte de nosso serviço de gerenciamento de produto mais recente e injetaremos manualmente um identificador de tenant. No Cloud9 navegue até a pasta `Lab3/Part5/product-manager/` e abra o arquivo `server.js` no editor dando um duplo clique ou clicando com o botão direito do mouse e selecionando **Open**.

<p align="center"><img src="./images/lab3/part5/cloud9_open_server.js.png" alt="Lab 3 Part 5 Step 1 Cloud9 Open server.js"/></p>

**Passo 2** - Localize a função `GET` que busca todos os produtos por tenant. O código parecerá como:

```javascript
app.get('/products', function(req, res) {
	winston.debug('Fetching Products for Tenant Id: ' + tenantId);
	tokenManager.getCredentialsFromToken(req, function (credentials) {
		var searchParams = {
			TableName: productSchema.TableName,
			KeyConditionExpression: "tenant_id = :tenant_id",
			ExpressionAttributeValues: {
				":tenant_id": tenantId
				//":tenant_id": "<INSERT TENANTTWO GUID HERE>"
			}
		};
		// construct the helper object
		var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
		dynamoHelper.query(searchParams, credentials, function(error, products) {
			if (error) {
				winston.error('Error retrieving products: ' + error.message);
				res.status(400).send('{"Error": "Error retrieving products"}');
			} else {
				winston.debug('Products successfully retrieved');
				res.status(200).send(products);
			}
		});
	});
});
```

Iremos mais uma vez **injetar manualmente** o `tenant_id` para o **TenantTwo** para verificar se nosso novo código evitará acesso cruzado de tenant. Localize o `tenant_id` que você salvou previamente do DynamoDB para o **TenantTwo** e _**substitua**_ o `tenant_id` com esse valor. Então, quando finalizar, o código parecerá como:

```javascript
app.get('/products', function (req, res) {
    winston.debug('Fetching Products for Tenant Id: ' + tenantId);
    tokenManager.getCredentialsFromToken(req, function (credentials) {
        var searchParams = {
            TableName: productSchema.TableName,
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":tenant_id": "TENANT4c33c2eae9974615951e3dc04c7b9057"
            }
        };
        // construct the helper object
        var dynamoHelper = new DynamoDBHelper(productSchema, credentials, configuration);
        dynamoHelper.query(searchParams, credentials, function (error, products) {
            if (error) {
                winston.error('Error retrieving products: ' + error.message);
                res.status(400).send('{"Error" : "Error retrieving products"}');
            } else {
                winston.debug('Products successfully retrieved');
                res.status(200).send(products);
            }
        });
    });
});
```

**Passo 3** - Agora nós precisamos implantar nosso microsserviço de gerenciamento de produtos atualizado com nossa violação de acesso cruzada entre tenats. Primero, salve o arquivo`server.js` editado no Cloud9 clicando em **File** na barra de tarefas, e depois clique em **Save**.

<p align="center"><img src="./images/lab3/part5/cloud9_save.png" alt="Lab 3 Part 5 Step 3 Save server.js"/></p>

**Passo 4** - Para implantar nosso serviço modificado, navegue até o diretório `Lab3/Part5/product-manager/` e clique com o botão direito do mouse no arquivo `deploy.sh`, e depois clique em **Run** para executar um script shell.

<p align="center"><img src="./images/lab3/part5/cloud9_run.png" alt="Lab 3 Part 5 Step 4 Cloud9 Run"/></p>

**Passo 5** - Aguarde até que o script do `deploy.sh` execute com sucesso.

<p align="center"><img src="./images/lab3/part5/cloud9_run_script_complete.png" alt="Lab 3 Part 5 Step 5 Cloud9 Script Finished"/></p>

**Passo 6** - Com nossa nova versão do serviço implantada, podemos observar como isso impactou a aplicação. Vamos logar de volta no sistema com as credenciais do **TenantOne** que criamos acima (se **TenantTwo** ainda estiver logado, faça deslogue usando o dropdown no topo direito da página).

**Passo 7** - Selecione **Catalog** na opção do menu no topo da página. Isso deve exibir o catálogo de seu usuário **TenantOne** que você acabou de autenticar Você verá que **nenhum produto é mostrado**. De fato, se você olhar o console de logs do Javascript (use as ferramentas de desenvolvedor do seu navegador), você verá que foi gerado um erro. Isso acontece porque estamos logados como **TenantOne** e nosso serviço tem fixado no código o **TenantTwo**. Isso deixa claro que nossas políticas de isolamento estão sendo aplicadas já que as **credenciais que adquirimos nos proibiram de acessar os dados do TenantTwo**.

**Recapitulando**: Com este último passo, nós conectamos todos os conceitos de **isolamento de tenants** no código do serviço de gerenciamento de produto. Nós adicionamos chamadas específicas que fazem a troca do nosso token autenticado por **credenciais com escopo do tenant** que nós utilizamos para acesso o DynamoDB. Com esse **novo nível de aplicação do isolamento**, tentamos fixar algo no código que tentou ultrapassar os limites do tenant o que confirmou que nossas políticas **proibiram o acesso cruzado de tenants**.
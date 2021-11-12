# Lab 3 – Isolamento dos dados dos tenants

### Visão Geral

Até aqui, nós abordamos muitos dos elementos centrais do modelo de arquietura SaaS. Mas um ponto que ainda não entramos foi o isolamento entre tenants. No papel de um provedor de SaaS, você deve fazer todo o possível para garantir que os recursos e dados de cada tenant estão protegidos de qualquer tipo de acesso entre tenants. Isso é um desafio quando esses tenants estão compartilhando elementos de infraestrutura. Se, por algum motivo, um tenant conseguir acessar o ambiente de outro tenant, isso pode causar problemas para um negócio baseado em SaaS.

Para lidar com esse caso, nós devemos ir além da autenticação básica. Devemos introduzir políticas e controles de acesso que garantem que estamos fazendo todo o possível para isolar e proteger os ambientes dos tenants. Até mesmo em ambientes SaaS onde os recursos não são compartilhados, temos que tomar medidas adicionais para garantir que minimizamos a exposição à acessos entre tenants.

Para este bootcamp, vamos focar em como isolar os dados residentes nas tabelas do DynamoDB. Especificamente, queremos ver como podemos isolar os dados do tenant que residem nas tabelas de produto e pedido, que armazenam dados da aplicação. Para conseguirmos, precisamos considerar como foi feito o particionamento dos dados. Abaixo temos um diagrama que mostra o esquema de particionamento das tabelas de produto e pedido.

<p align="center"><img src="./images/lab3/table_partitioning.png" alt="Lab 3 Isolating Tenant Data Overview Table Partitioning"/></p>

Nessa imagem de exemplo, você pode ver que temos dados de múltiplos tenants em uma mesma tabela. Então, se alguém tiver acesso a uma dessas tabelas, teremos acesso aos dados de qualquer um dos tenants.

Nosso objetivo é implementar um modelo de segurança que pode limitar o acesso a essas tabelas de forma granular no nível do item armazenado. Ou seja, queremos montar uma visão da tabela que restringe o acesso à apenas os itens que são válidos para um tenant em específico.

Para esse bootcamp, vamos utilizar uma combinação de Amazon Cognito, Amazon Identity and Access Management (IAM) e AWS Security Token Service (STS) para limitar o acesso à essas tabelas. Isso irá conectar diretamente com a noção de identidade SaaS que discutimos anteriormente, através dos tokens que utilizamos para linkar um usuário à um conjunto de políticas.

Existem duas fases importantes para implementar esse modelo de isolamento. Primeiro, quando os tenants são provisionados incialmente, precisamos criar um conjunto de IAM roles para cada tenant. Para cada role que existe no ambiente do tenant, precisamos criar políticas que restringem o acesso ao recurso do sistema específico daquele tenant. Abaixo temos uma representação conceitual desse processo de onboarding e como são criadas as roles para cada tenant.

<p align="center"><img src="./images/lab3/onboarding.png" alt="Lab 3 Isolating Tenant Data Overview Onboarding"/></p>

Na esquera, temos o processo de registro que criamos no Lab 1. Na direita, temos conjuntos de políticas que são geradas (por trás dos panos) para cada role. É importante notar que não é necessário ter roles separadas para cada usuário. Ao invés disso, as roles serão aplicadas para todos os usuários daquele tenant.

A segunda fase do isolamento acontece quando estamos acessando recursos através do nosso código. O diagrama abaixo ilustra as peças desse processo.

<p align="center"><img src="./images/lab3/authentication.png" alt="Lab 3 Isolating Tenant Data Overview Authentication"/></p>

Nesse exemplo, podemos ver que o serviço gerenciador de produtos é chamado pela interface com uma requisição para obter uma lista de produtos. O token JWT obtido durante a autenticação é passado no header Authorization da requisição HTTP. Esse token contém informações sobre a identidade do usuário, role e identidade do tenant. Embora esse token é valioso para passar atributos do usuário e do tenant, ele não faz nada para controlar o acesso do tenant aos recursos. **Assim, precisamos usar os _dados_ contidos nesse token para obter as credenciais com escopo de acesso às tabelas do DynamoDB.**

O restante do diagrama ilustra como essas credenciais restritas são obtidas. Uma vez que a requisição `GET` chega no nosso sistema de gerenciamento de produtos, ele faz uma chamada `getCredentialsForIdentity()` para o Cognito, passando o token. O Cognito irá abrir o token e comparar o identificador do tenant e role do usuário e corresponder com uma das políticas que foram criadas durante o provisionamento. O Cognito irá criar um conjunto de credenciais **temporárias** (mostradas em baixo) através do STS e as retornará para o serviço gerenciador de produtos. O serviço vai usar essas credenciais temporárias para acessar as tabelas do DynamoDB com a certeza de que essas credenciais irão restringir o acesso _pelo tenant id_.

### O que você irá construir
O objetivo desse exercício é passar pela configuração e criação de alguns elementos que são parte desse processo. Embora os conceitos acima nos ajudam a entender o cenário, vamos ver alguns detalhes de como esses conceitos são aplicados na solução de referência. Vamos começar ao introduzir as políticas durante o provisionamento e como configurar o Cognito para conectar essas políticas às roles de usuário. Por fim, vamos ver como isso é implementado no código da aplicação. Os passos básicos desse processo incluem:

* **Exemplo de acesso entre tenants** - primeiro você verá como, sem políticas e restrições, um desenvolvedor pode criar uma situação que viola os limites entre tenants do sistema.
* **Configurar as políticas do IAM provisionadas** - agora que você viu um exemplo de acesso entre tenants, vamos começar a introduzir políticas para prevenir acessos entre tenants (devidos ou indevidos). Você criará uma política para diferentes combinações entre role/recurso para ver como essas políticas são usadas para limitar o acesso às tabelas do DynamoDB. Você então provisionará um novo tenant e verá como essas políticas são representadas no IAM.
* **Mapear roles de usuário para políticas** - com o Cognito, podemos criar regras que determinam como a role de um usuário será mapeada para as políticas que criamos. Nessa perte, você verá como essas políticas foram configuradas para nosso tenant e roles dos usuários.
* **Adquirir credenciais limitadas a um tenant** - por fim, você verá como orquestrar a aquisição das credenciais que são limitadas pelas poíticas descritas acima. As credenciais vão controlar o acesso aos dados. Você verá como isso explicitamente impõe limites ao acesso entre tenants.

Com esse componente instalado, você terá adicionado um mecanismo robusto à solução que limita e controla o acesso aos recursos dos tenants. Essa solução ilustra uma de várias estratégias que podem ser aplicadas para garantir o isolamento entre tenants.

## Parte 1 - Exemplo de acesso entre tenants
Antes de introduzirmos as **políticas**, é interessante examinar um cenário onde a ausência de controles de segurança adequados podem introduzir acessos a dados de tenants diferentes. Vamos ver um exemplo (de certa forma complicado) onde um desenvolvedor pode adicionar um código que possivelmente permita um acesso entre tenants.

Para fazer isso, vamos voltar ao serviço de gerenciamento de produtos e ver como o contexto de tenant injetado manualmente pode trazer dados da sua aplicação que não deveriam ser obtidos. Esse será o pano de fundo para entender como a introdução de **políticas** podem prevenir isso de acontecer.

**Passo 1** - No [Lab 2](Lab2.md), nós adicionamos produtos aos catálogos para cada um dos tenants. Se você não possui dois tenants registrados até aqui, com pelo menos um produto cada, por favor, siga os passos descritos no Lab 2 para ter esse pré-requisito completo.

Para criar um acesso entre tenants, mesmo que artificial, precisamos dos identificadores únicos para os tenants. Vamos encontrar os identificadores para cada um dos tenants. Vá até o **DynamoDB**, na console da AWS, e clique na opção **Tables** localizado no canto superior esquerdo da página. Selecione a tabela **TenantBootcamp** e então clique na aba **Items**.

<p align="center"><img src="./images/lab3/part1/dynamo_tenant.png" alt="Lab 3 Part 1 Step 14 Dynamo TenantBootcamp Table"/></p>

**Passo 2** - Localize na lista os dois tenants que você criou que você criou comparando com o nome de usuário/email que você utilizou para criá-los. **Copie o valor do tenant_id para esses dois tenants.** Você irá precisar desses valores nos passos a seguir.
 
**Passo 3** - Agora vamos voltar ao código do serviço gerenciador de produtos e fazer uma modificação. Abra o arquivo `server.js` na IDE Cloud9. No Cloud9, vá até `Lab3/Part1/product-manager/`. Abra o arquivo no editor, clicando duas vezes no arquivo `server.js` ou então clicando com o botão direito no arquivo e clicando em **Open**.

<p align="center"><img src="./images/lab3/part1/open_server.js.png" alt="Lab 3 Part 1 Step 16 Open server.js"/></p>

**Passo 4** - Localize a função `GET` responsável por pegar todos os produtos de um tenant. O código será o seguinte:

```javascript
app.get('/products', function(req, res) {
	var searchParams = {
		TableName: productSchema.TableName,
		KeyConditionExpression: "tenant_id = :tenant_id",
		ExpressionAttributeValues: {
			":tenant_id": tenantId
			//":tenant_id": "<INSERT TENANT TWO GUID HERE>"
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
Essa função é chamada pela aplicação para obter uma lista de produtos que populam a página de catálogo do sistema. Você pode ver que ela faz referência ao `tenant_id` que foi extraído do token de segurança passado para nossa aplicação. Agora, vamos considerar o que aconteceria se nós **manualmente trocássemos** esse `tenant_id` com outro valor. Localize o `tenant_id` que você anotou para o **TenantTwo** e **_substitua_** o `tenant_id` por esse valor. Então, quando você tiver concluído, o código deve ser semelhante ao seguinte:

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

**Passo 5** - Agora precisamos implantar o microsserviço gerenciador de produtos com o código que realiza acessos indevidos entre tenants. Primeiramente, salve o arquivo `server.js` modificado no Cloud9: clique em **File** na barra de ferramentas, seguido de **Save**.

<p align="center"><img src="./images/lab3/part1/cloud9_save.png" alt="Lab 3 Part 1 Step 18 Save server.js"/></p>

**Passo 6** - Para implantar o serviço, vá até o diretório `Lab3/Part1/product-manager/` e clique com o botão direito em `deploy.sh`, em seguida clique em **Run** para executar o shell script.

<p align="center"><img src="./images/lab3/part1/cloud9_run.png" alt="Lab 3 Part 1 Step 19 Cloud9 Run"/></p>

**Passo 7** - Aguarde a execução com sucesso do shell script `deploy.sh`.

<p align="center"><img src="./images/lab3/part1/cloud9_run_script_complete.png" alt="Lab 3 Part 1 Step 20 Cloud9 Script Finished"/></p>

**Passo 8** - Com a nova versão do serviço implantada, agora podemos ver como isso impactou a aplicação. Vamos acessar o sistema usando as credenciais do **TenantOne** que você criou anteriormente. (se o **TenantTwo** ainda estiver logado, saia usando o menu do lado superior direito da página).

**Passo 9** - Selecione a opção **Catalog** no menu do topo da página. Ela _deveria_ mostrar o catálogo do **TenantOne** para o usuário que você acabou de se autenticar. No entanto, a **_lista contém os produtos que são do TenantTwo_**. Nós oficialmente cruzamos os limites entre tenants.

**Recap**: O que podemos concluir dessa parte do laboratório é que apenas a autenticação não é suficiente para proteger seu sistema SaaS. Sem políticas adicionais e um mecanismo de autorização, o código do seu sistema poderia acessar dados de outros tenants de forma não intencional. Aqui nós forçamos essa condição explicitamente, mas você pode imaginar que outras mudanças mais sutis feitas por um desenvolvedor podem ter um efeito colateral indesejado.

## Part 2 - Configuring Provisioned IAM Policies

It's clear now that we need policies to better protect our system from cross-tenant access. The question is: what can we do to better isolate and protect tenant data? The first piece of the puzzle is **IAM policies**. With IAM policies, we can create rules that control the level of access a user has to tenant resources.

Instead of creating new policies from scratch, let's edit policies that were provisioned during the start of our process. The following steps will guide through the policy editing process:

**Step 1** - To locate to the policies we want to edit, navigate to the IAM service in the AWS console and select **Policies** from the list of options on the upper left-hand side of the page. This will give you a list of all the polices that are available in IAM.

**Step 2** - Now, we want to find the policies associated with the two tenants that we created (**TenantOne** and **TenantTwo**). Let's start with TenantOne. We need to enter the policy name in the search box near the top of the screen. Enter the GUID of the tenant for TenantOne. You captured this value earlier from DynamoDB.

<p align="center"><img src="./images/lab3/part2/iam_search_policies.png" alt="Lab 3 Part 2 Step 2 IAM Search Policies"/></p>

**Step 3** - The list should now be narrowed to just the 2 policies for tenant one. There will be a policy for tenant **admin** and a second one for tenant **user**. **Select the triangle/arrow** in the column preceding the **TenantAdmin** policy name to drill into the policy. Then, select the **Edit policy** button that's near the center of the page.

<p align="center"><img src="./images/lab3/part2/iam_edit_policy.png" alt="Lab 3 Part 2 Step 3 IAM Edit Policy"/></p>

**Step 4** - The console will now display a list of DynamoDB polices and a Cognito User Pool policy. We're interested in editing the policy for the **ProductBootcamp** table. However, _it's location in this list of DynamoDB tables can vary_. Open each of the collapsed DynamoDB entries in this list by **selecting the arrow** at the left edge of the list. Near the bottom of each expanded set of polices, you should find a **Resources** section. Locate the set of policies that reference the **ProductBootcamp** table. The ARN will be similar to the following:

<p align="center"><img src="./images/lab3/part2/iam_dynamo_arn.png" alt="Lab 3 Part 2 Step 4 IAM Dynamo ARN"/></p>

**Step 5** - Our interest is in the **Request conditions** associated with this policy. These conditions are at the heart of our ability to control which items a user can access within a DynamoDB table. We want our policy to indicate that only users with partition key value that matches **TenantOne**'s tenant identifier will be allowed to access those items in the table. Hover over the **Request conditions** value and **select the text for the conditions** this will put you into edit mode for the conditions.

<p align="center"><img src="./images/lab3/part2/iam_request_conditions.png" alt="Lab 3 Part 2 Step 5 IAM Policy Request Conditions"/></p>

**Step 6** - Select the **Add condition** option at the bottom of the list. Select **dynamodb:LeadingKeys** for the **Condition key**. Select **For all values in request** for the **Qualifier**. Select **StringEquals** for the **Operator**. Finally, in the **Value** text box, enter the GUID of **TenantOne**. Click the **Add** button. Select the  **Review policy** button and then select the **Save Changes** button to save this change to the policy.

<p align="center"><img src="./images/lab3/part2/iam_add_request_condition.png" alt="Lab 3 Part 2 Step 6 IAM Policy Add Request Condition"/></p>

This process created a new **request condition** for our policy that now indicates that the value of our partition key in our DynamoDB table must match the tenant identifier when you user attempts to access items in the table.

**Step 7** - We now want to repeat this same process for **TenantTwo**. Complete steps 2-6 again replacing all references to TenantOne with **TenantTwo**. This will ensure that TenantTwo is also protected.

**Recap**: The exercises in this part of the lab showed how to put in place the elements needed to support our tenant isolation goals. We amended our existing tenant **policies** introducing changes that allow us to scope access to DynamoDB tables. This was achieved by adding a new condition to our ProductBootcamp table policies. These policies, which are tenant-specific, limit a user's view of the table to only those items that contain our tenant identifier in the table's partition key.

## Part 3 - Mapping User Roles to Policies

Now that we have policies defined, we need some way to connect these policies with specific user roles. Ultimately, we need a way to match both the role of the user and the tenant scope to a _specific_ set of policies. For this scenario, we're going to lean on the **role matching capabilities of Cognito**. Cognito will allow us to define a set of conditions that will be used to create this match and, in the process, emit a **set of credentials** that will be scope based on the matching policies —- which is exactly what we need to implement our tenant isolation model.

In this bootcamp these policy mappings have already been created. Let's take a look at them in the **Cognito console**.

**Step 1** - Navigate to the Cognito service in the AWS console. From the landing page, select the **Manage Identity Pools** button to see a list of identity pools. It will include **separate pools** for each of the tenants that you have onboarded.

Locate the identity pools for **TenantOne** and **TenantTwo**. They will be named with the GUID of the tenant. Click on the identity pool that is associated with **TenantOne**.

<p align="center"><img src="./images/lab3/part3/cognito_identity_pools.png" alt="Lab 3 Part 3 Step 1 Cognito Identity Pools"/></p>

**Step 2** - Once you select the identity pool, you see a page that provides and overview of the identity pool activity. Now select the **Edit identity pool** link at the top right of the page.

<p align="center"><img src="./images/lab3/part3/cognito_identity_pool_details.png" alt="Lab 3 Part 3 Step 2 Cognito Identity Pool Details"/></p>

**Step 3** - If you scroll down the edit identity pool page, you'll see a heading for **Authentication Providers**. Expand this section and you'll see a page with authorization provider configurations.

We can now see the role mappings in place for our two roles. There is a **TenantAdmin** role that represents the administrator and there's a **TenantUser** role that maps to individual non-admin users of your SaaS system. Naturally, these have different levels of access to the system and its resources.

The claim column has a value (URL encoded) that matches the custom **role** attribute you configured in Cognito back in Lab 1. When that **custom claim matches** the name of the role, the IAM policy (with the DynamoDB restrictions) is enforced on the **temporary security tokens returned from STS**.

<p align="center"><img src="./images/lab3/part3/cognito_role_matching.png" alt="Lab 3 Part 3 Step 3 Cognito Role Matching"/></p>

**Recap**: You've now completed building out the second phase of our tenant isolation. With this exercise, we saw the role-mapping rules in our Cognito identity pool. These mappings directly associate roles for tenants (TenantAdmin and TenantUser) to the policies that we configured in first part of this lab.

## Part 4 - Acquiring Tenant-Scoped Credentials

At this point, all the elements of our isolation scheme are in place. We have authentication with Cognito, roles provisioned for each tenant that scope access to our DynamoDB tables, and we have role-mapping conditions configured in Cognito that will connect our authenticated users with their corresponding policies. All that remains now is to introduce the code into our application services that exercises these elements and acquires credentials that will properly scope our access to the tenant resources.

The steps that follow will guide you through the process of configuring and deploying a new version of the product manager service that successfully acquires these tenant-scoped credentials.

**Step 1** - Let's start by looking at how the product manager service is modified to support tenant isolation. In Cloud9, navigate to `Lab3/Part4/product-manager/` and open `server.js` in the editor by double-clicking or right-clicking and selecting **Open**.

<p align="center"><img src="./images/lab3/part4/cloud9_open_server.js.png" alt="Lab 3 Part 4 Step 1 Cloud9 Open server.js"/></p>

The code shown below highlights the last key piece of the tenant isolation puzzle. You'll notice that we have added a call to our `tokenManager` that acquires credentials from the authenticated user's security token. The `getCredentialsFromToken()` method takes the HTTP request and returns the `credentials` that are **scoped by tenant**. These credentials are  used in our calls to the `dynamoHelper` to ensure that we **cannot cross tenant boundaries**.

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
**Step 2** - The call to `getCredentialsFromToken()` described above is where all the magic happens in terms of mapping our token/identity to the appropriate policies and returning that in the form of credentials. Given the importance of this function, let's dig in and look more closely at what it is doing. Below is a snippet of code from the `TokenManager` that implements the `getCredentialsFromToken()` function:

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

Let's highlight the key elements of this function.
* The very first action is to extract the security `bearerToken` from the HTTP request. This is the token that you received from Cognito after you authenticated your user.
* We then decode the token and extract the `userName` attribute.
* Next, a series of calls are executed in sequence. It starts by looking up the `userPool` for the current user. It then calls `authenticateUserInPool()`. This function, which is part of the `TokenManager` helper class ultimately calls the Cognito `getCredentialsForIdentity()` method, passing in the token from the user.

It's this call to Cognito that **triggers the role mapping** we configured earlier. Cognito will extract the role from the supplied token and match it to the policy, then construct a **temporary set of scoped credentials** that are returned to the calling function.

**Step 2** - So that's what the code is doing behind the scenes. Now, let's deploy this new version of the product manager service to see it in action. In Cloud9, navigate to the  `Lab3/Part4/product-manager` directory, right-click `deploy.sh`, and click **Run** to execute the shell script.

<p align="center"><img src="./images/lab3/part4/cloud9_run.png" alt="Lab 3 Part 4 Step 2 Cloud9 Run"/></p>

**Step 3** - Wait for the `deploy.sh` shell script to execute successfully.

<p align="center"><img src="./images/lab3/part4/cloud9_run_script_complete.png" alt="Lab 3 Part 4 Step 3 Cloud9 Script Finished"/></p>

**Step 4** - Let's verify that all of the moving parts of this process are working. Use the same web application URL you've used throughout. If **TenantTwo** is stilled logged in, log out using the dropdown at the top left of the application navigation bar. Now, login as **TenantOne** and access your data by selecting the **Catalog** menu item and viewing **TenantOne's** products. **Everything should work**.

While seeing this work is great, it's hard to know that this new code is truly enforcing our tenant isolation. This always of tough case to test. Let's try a bit of a brute force method in Part 5.

**Recap**: We looked at the source code to see how we tie together the JWT **security bearer token** from the HTTP headers, our defined **custom claims**, and Cognito's **role-to-policy mapping** and return of **temporary STS credentials** to enforce tenant isolation in our system. We then deployed a fresh version of the product manager service to remove our manual "security hack" from before.

## Part 5 - Verifying Tenant-Scoped Credentials

At this point, we have incorporated security at the IAM level by leveraging Cognito's
`getCredentialsForIdentity()`, but we have not evaluated if we can circumvent our security measures. As we did before, we will **manually override the tenant identifier** to see if we can break tenant isolation. This will demonstrate that, so long as the access policies and roles defined previously are properly configured, our **tenant isolation measures can't be defeated** by introducing a tenant different from the authenticated SaaS Identity.

**Step 1** - As before, we will modify the source code for our latest product manager service and manually inject a tenant identifier. In Cloud9 navigate to the `Lab3/Part5/product-manager/` folder and open `server.js` in the editor by double-clicking or right-clicking and selecting **Open**.

<p align="center"><img src="./images/lab3/part5/cloud9_open_server.js.png" alt="Lab 3 Part 5 Step 1 Cloud9 Open server.js"/></p>

**Step 2** - Locate the `GET` function that fetches all products for a tenant. The code function will appear as follows:

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

We will once again **manually inject** the `tenant_id` for **TenantTwo** to see if our new code will prevent cross tenant access. Locate the `tenant_id` that you recorded earlier from DynamoDB for **TenantTwo** and _**replace**_ the `tenant_id` with this value. So, when you're done, it should appear similar to the following:

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

**Step 3** - Now we need to deploy our updated product manager microservice with our cross tenant access violation in-place. First, save your edited `server.js` file in Cloud9 by clicking **File** on the toolbar followed by **Save**.

<p align="center"><img src="./images/lab3/part5/cloud9_save.png" alt="Lab 3 Part 5 Step 3 Save server.js"/></p>

**Step 4** - To deploy our modified service, navigate to the `Lab3/Part5/product-manager/` directory and right-click `deploy.sh`, and click **Run** to execute the shell script.

<p align="center"><img src="./images/lab3/part5/cloud9_run.png" alt="Lab 3 Part 5 Step 4 Cloud9 Run"/></p>

**Step 5** - Wait for the `deploy.sh` shell script to execute successfully.

<p align="center"><img src="./images/lab3/part5/cloud9_run_script_complete.png" alt="Lab 3 Part 5 Step 5 Cloud9 Script Finished"/></p>

**Step 6** - With our new version of the service deployed, we can now see how this impacted the application. Let's log back into the system with the credentials for **TenantOne** that you created above (if **TenantTwo** is still logged in, log out using the dropdown at the top right of the page).

**Step 7** - Select the **Catalog** menu option at the top of the page. This should display the catalog for your **TenantOne** user you just authenticated as. You'll see that **no products are displayed**. In fact, if you look at the JavaScript console logs (use your browser's developer tools), you'll see that this threw an error. This is because we're logged in as **TenantOne** and our service has hard-coded **TenantTwo**. This makes it clear that our isolation policies are being enforced since the **credentials we acquired prohibited us from accessing data for TenantTwo**.

**Recap**: With this last step, we connected all the concepts of **tenant isolation** in the code of the product manager service. We added specific calls to exchange our authenticated token for a **tenant-scope set of credentials** which we then used to access our DynamoDB data store. With this **new level of isolation enforcement** in place, we attempted to hard-code something that crossed a tenant boundary and confirmed that our policies **prohibited cross-tenant access**.

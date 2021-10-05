# Lab 1 – Identidade e Onboarding/Integração

## Visão geral

Neste primeiro laboratório, veremos o que é necessário para fazer com que novos tenants sejam integrados em um sistema SaaS. A integração é um dos aspectos mais básicos de SaaS. Ela cria a forma de como os tenants e usuários serão representados em nosso sistema, determinando como os tenants serão identificados e transmitidos à medida que fluem por todas as partes da arquitetura SaaS.

Uma parte importante desse processo é apresentar a noção de uma **Identidade SaaS**. Em muitos sistemas, a identidade do usuário será representada em um provedor de identidade completamente separado de seu relacionamento com um tenant. Um tenant é então resolvido de alguma forma como uma etapa separada. Isso adiciona sobrecarga e complexidade. Em vez disso, neste laboratório, você verá como fazer uma relação mais próxima entre usuários e tenant e criar uma **identidade SaaS** que podemos então encaminhar pelos vários serviços de nosso sistema. Isso simplifica a implementação de serviços que precisam de acesso ao contexto de tenant pois não precisam resolver em uma etapa separada.

Veremos primeiro como os usuários são representados em um provedor de identidade. Mais especificamente, veremos como o **Amazon Cognito** pode ser configurado para suportar os fluxos de autenticação e integração de nossa solução SaaS. Também usaremos essa oportunidade para configurar atributos de usuário que nos permitem criar uma conexão entre usuários e tenant. Isso permitirá que o processo de autenticação do Cognito retorne tokens de autenticação que incluem contexto de tenant.

Depois de configurar os usuários, voltaremos nossa atenção para como os tenants são representados em nossa arquitetura. Os tenants têm seu próprio perfil e dados configurados separadamente dos usuários associados a esse tenant. Apresentaremos um microsserviço que possui a criação e o gerenciamento desses atributos de tenant (níveis, status, políticas, etc.).

Com o gerenciamento de usuários e tenants implementado, voltaremos nossa atenção para a aplicação web do usuário final que atua como front-end para o sistema de integração.

Depois de criar um novo tenant e um usuário com baixo privilégio neste tenant usando a aplicação web, veremos como o sistema de orquestração de autenticação e registro usa o recurso de custom claims do padrão OpenID Connect para intermediar nossa identidade SaaS por meio de tokens de segurança nos cabeçalhos HTTP.

Ao final do Laboratório 1, todos os elementos estarão prontos para integrar e autenticar os tenants e seus usuários. O diagrama abaixo destaca os principais elementos necessários para dar suporte a essa experiência.

<p align="center"><img src="./images/lab1/arch_overview.png" alt="Lab 1 Architecture Overview"/></p>

No topo do diagrama está a aplicação web **Web Application** que fornece a interface para nossos fluxos de integração e autenticação. Ela se conecta aos microsserviços por meio de um gateway de API. Abaixo do Amazon API Gateway estão os vários microsserviços necessários para dar suporte a esses fluxos de integração. O **Tenant Registration** é o orquestrador do processo de integração, invocando o **User Manager** para criar usuários no Amazon Cognito e o **Tenant Manager** para criar os tenants. O **Authentication** autentica usuários por meio do serviço **User Manager**.

### O que você estará construindo
Conforme você avança no Laboratório 1, você criará, configurará e implantará os elementos descritos acima. A seguir está uma análise das etapas que você executará para obter experiência de integração e autenticação SaaS:
* Criar o pool de usuários - neste cenário usaremos os pools de usuários do Cognito para gerenciar e lidar com a identidade do usuário. Nesta parte do laboratório, vamos guiá-lo pelas etapas de configuração do Amazon Cognito.
* Criar e gerenciar usuários - a seguir, examinaremos o microsserviço **User Manager** afim de observar como ele fornece uma API de abstração. Vamos testar o microsserviço manualmente, usando a linha de comando. 
* Criar e gerenciar tenants - na parte 3, examinaremos os recursos do microsserviço **Tenant Manager** afim de observar como ele mantém os dados de nível do tenant separados dos usuários. Vamos testar o microsserviço manualmente, usando a linha de comando. 
* Integração orquestrada - Por fim, utilizando a interface web integraremos um novo tenant e seu primeiro usuário administrador. Isso reúne todas as peças e mostra como o Cognito gerencia o trabalho pesado do fluxo de autenticação. Adicionaremos um usuário não administrador ao mesmo tenant e veremos como a autorização complementa a autenticação para restringir o acesso a determinados recursos. Concluiremos examinando a tecnologia JWT usada nos tokens de segurança.

## Parte 1 - Criar o pool de usuários
Nosso objetivo para a parte 1 é que você configure todos os elementos do Amazon Cognito manualmente para que você entenda todas as partes que serão usadas pela solução completa para integrar, gerenciar e autenticar usuários. Também apresentaremos a capacidade de associar usuários a tenants, o que nos permite criar uma **Identidade SaaS**.

Neste workshop, estaremos associando cada tenant a um pool de usuários Cognito separado. A solução final cria esses pools Cognito durante a integração. Cada pool é configurado da mesma maneira para aplicar as configurações de integração e identidade de nossos tenants.

**Etapa 1** - Navegue até o serviço Amazon Cognito no AWS Console e selecione **Manage User Pools**.
￼
<p align="center"><img src="./images/lab1/part1/cognito_splash.png" alt="Lab 1 Part 1 Cognito Manage User Pools"/></p>

**Etapa 2** - Selecione **Create A User Pool** no canto superior direito do console Cognito.

<p align="center"><img src="./images/lab1/part1/cognito_create_pool.png" alt="Lab 1 Part 1 Cognito Step 2 Create User Pool"/></p>

**Etapa 3** - Você verá uma experiência de criação de pool de usuários (mostrada abaixo) que é usada para configurar todos os elementos de sua identidade e experiência de integração. O primeiro passo neste processo é dar um nome ao seu pool. Escolha o nome que desejar (por exemplo, **SaaS Bootcamp Users**).

<p align="center"><img src="./images/lab1/part1/cognito_step1_name.png" alt="Lab 1 Part 1 Step 3 Cognito Name User Pool"/></p>

**Etapa 4** - Selecione **Step through settings** para configurar o pool para oferecer suporte à experiência de integração que desejamos que nossos usuários de SaaS tenham.

A primeira etapa nos permite configurar os atributos do pool. Vamos começar examinando as políticas de login. A tela abaixo representa as opções que você terá.

<p align="center"><img src="./images/lab1/part1/cognito_step2_signin.png" alt="Lab 1 Part 1 Step 4 Cognito Attributes Sign In"/></p>

Estamos especificando quais opções um usuário pode ter para seu identificador exclusivo (seu e-mail nesta circunstância). Para nossa solução, vamos marcar a opção **Also allow sign in with a verified phone number**.

**Etapa 5** - Agora passamos para a parte dos atributos padrão da configuração do pool de usuários. É apresentado a você uma coleção de atributos padronizados que são gerenciados pelo Cognito. Selecione os atributos **e-mail**, ** family name**, **given name**, **phone number** e **preferred username**.

<p align="center"><img src="./images/lab1/part1/cognito_step3_std_attributes.png" alt="Lab 1 Part 1 Step 5 Cognito Standard Attributes"/></p>

**Etapa 6** - Agora vamos configurar mais detalhes de SaaS nos atributos personalizados de nosso pool de usuários. É aqui que apresentamos os atributos que conectam usuários a tenants. Ao provisionar tenants, manteremos esses atributos adicionais como parte do perfil de cada usuário. Esses mesmos dados também serão incorporados aos tokens que são retornados pelo processo de autenticação.

Role a página para baixo e clique em **Add custom attribute** na seção "Do you want to add custom attributes?"

<p align="center"><img src="./images/lab1/part1/cognito_step4_add_custom_attribute.png" alt="Lab 1 Part 1 Step 6 Cognito Custom Attributes"/></p>

Adicione os seguintes atributos de tenant, clicando em **Add another attribute** para cada novo atributo a ser adicionado:
* **tenant_id** (string, default max length, _**not**_ mutable)
* **tier** (string, default max length, mutable)
* **company_name** (string, default max length, mutable)
* **role** (string, default max length, mutable)
* **account_name** (string, default max length, mutable)

Os atributos são case-sensitive. Sua tela deve ficar da seguinte forma:

<p align="center"><img src="./images/lab1/part1/cognito_step4_custom_attributes.png" alt="Lab 1 Part 1 Step 6 Cognito Custom Attributes"/></p>

**Etapa 7** - Depois de configurar os atributos personalizados, clique no botão ** Next step** na parte inferior da tela. Isso nos leva à página de políticas.

Aqui podemos configurar a senha e as políticas de administração. Essas políticas (e outras configuradas com pools de usuários) nos permitem variar a abordagem de cada tenant. Você poderia, por exemplo, trazer à tona essas opções na experiência de administração de tenant de sua solução SaaS, permitindo que tenants individuais configurem suas próprias políticas.

<p align="center"><img src="./images/lab1/part1/cognito_step7_password_policy.png" alt="Lab 1 Part 1 Step 7 Cognito Password Policy"/></p>

Para nossa solução, substituiremos algumas das opções padrão.

Primeiro, vamos desativar a opção **Require special character** para nossas políticas de senha. Além disso, selecione a opção **Only allow administrators to create users** para limitar quem pode criar novos usuários no sistema.

Depois de concluir esta seção, clique no botão **Next step** na parte inferior da página.

**Etapa 8** - Estamos agora na seção MFA e verificações. Para alguns provedores de SaaS, ou mesmo tenants individuais, pode ser valioso habilitar o MFA. Para esta solução, no entanto **vamos deixá-lo desabilitado**. Não mude nada nesta tela.

Esta página nos dá a opção de configurar como as verificações serão entregues. Para este laboratório **vamos deixar as configurações padrão **.

Se você optar por habilitar a verificação do número de telefone ou MFA, o Cognito precisaria de uma função IAM para permissões para enviar uma mensagem SMS para o usuário via Amazon SNS. **Para este laboratório, basta clicar no botão "Next step"**.

**Etapa 9** - A quarta etapa do assistente é a página **Personalizações de mensagens**. Como parte de nosso processo de integração, enviaremos e-mails aos usuários para verificar sua identidade. Também podemos confiar no Cognito para essa funcionalidade. Essa tela nos permite configurar como esse processo de verificação funcionará. _Para este bootcamp, usaremos as configurações de mensagem de verificação padrão_.

Role a página para baixo até a seção “**Do you want to customize your user invitation messages?**”. Personalize o e-mail de convite que será enviado pela Cognito à medida que cada novo tenant se inscrever da seguinte forma:

Altere o assunto de "Your temporary password" para "**Novo tenant do workshop de SaaS**" e o texto **Email message* para:

```html
<img src="https://d0.awsstatic.com/partner-network/logo_apn.png" alt="AWSPartner"> <br><br>
Bem-vindo ao workshop de SaaS na AWS. <br><br>
Username: {username} <br><br>
Password: {####}.
```

<p align="center"><img src="./images/lab1/part1/cognito_step6_custom_invitation.png" alt="Lab 1 Part 1 Step 9 Cognito Invitation Message"/></p>

O Cognito também tem a capacidade de customizar alguns dos cabeçalhos de e-mail para seus e-mails de verificação e convite. Vamos deixar essas configurações padrão para este workshop. Clique no botão **Next step**.

**Etapa 10 * - Para este workshop, _pularemos_ as seções **Tags** e **Devices**. Basta clicar no botão **Next step** _ **duas vezes * _ para avançar para a tela de **App clients**.

**Etapa 11** - Agora que criamos os fundamentos de nosso pool de usuários, precisamos criar um App client para esse pool. Este cliente é uma peça fundamental do Cognito. Ele fornece o contexto pelo qual podemos acessar os fluxos _unauthenticated_ que são necessários para se registrar e entrar no sistema. Você pode imaginar como isso é fundamental para nossa experiência de integração. Selecione o link **Add an app client** na tela a seguir:

<p align="center"><img src="./images/lab1/part1/cognito_step7_add_app_client.png" alt="Lab 1 Part 1 Step 11 Cognito Add App Client"/></p>

**Etapa 12** - Agora podemos configurar o novo aplicativo cliente. Digite um nome para o seu cliente (por exemplo, **SaaS App Client**) e desmarque as três caixas **Generate client secret**, **Enable lambda trigger based custom authentication (ALLOW_CUSTOM_AUTH)** e **Enable SRP (secure remote password) protocol based authentication (ALLOW_USER_SRP_AUTH)**.

A opção de segredo do cliente nesta tela se refere a um segredo do cliente OAuth 2.0. Isso não é usado para aplicativos "públicos" (web ou móveis) em que um usuário digitará suas credenciais.

Depois de fazer essas alterações, selecione o botão **Create app client** e, em seguida, o botão **Next step** para continuar o assistente.

<p align="center"><img src="./images/lab1/part1/cognito_step8_app_client_config.png" alt="Lab 1 Part 1 Step 12 Cognito Configure App Client"/></p>

**Etapa 13** - Para este bootcamp, _pularemos_ a seção **Triggers**. Role até a parte inferior da tela e clique no botão **Next step** para avançar para a tela de revisão final e clique em **Create pool**.

**Etapa 14** - Antes de prosseguir, queremos registrar a id que foi gerada para este pool de usuários e a id do cliente do aplicativo. Copie e cole o valor **Pool Id** da tela **General Settings** em um arquivo temporário ou abra a próxima etapa em uma janela ou guia separada do navegador da web. Além disso, selecione a guia **App clients** na lista à esquerda e salve seu **App client id**. Usaremos esses dois valores em uma etapa subsequente.

<p align="center"><img src="./images/lab1/part1/cognito_step9_pool_id.png" alt="Lab 1 Part 1 Step 14 Cognito Pool Id"/></p>

<p align="center"><img src="./images/lab1/part1/cognito_step9_app_client_id.png" alt="Lab 1 Part 1 Step 14 Cognito App Client Id"/></p>

**Etapa 15** - A parte do pool de usuários está concluída. Antes de podermos usar esse pool de usuários, precisaremos conectá-lo a um **Identity Pool**. Os Cognito Identity Pools fornecem o mecanismo para trocar um token autenticado do User Pool por um conjunto de chaves de acesso da AWS que controlam o acesso aos recursos da AWS, como buckets S3 ou tabelas DynamoDB.

Para configurar seu pool de identidade, navegue de volta à página principal do Cognito selecionando o ícone AWS no canto superior esquerdo e, em seguida, selecionando Cognito novamente na lista de serviços. Selecione o botão **Manage Identity Pools**.

<p align="center"><img src="./images/lab1/part1/cognito_splash.png" alt="Lab 1 Part 1 Cognito Manage Identity Pools"/></p>

**Etapa 16** - O assistente deve ser iniciado para que você crie um novo pool de identidade porque você não tem nenhum pool existente para listar. Digite o nome do seu novo pool de identidade (por exemplo, **SaaS Identity Pool**).

<p align="center"><img src="./images/lab1/part1/cognito_step16_identity_pool_name.png" alt="Lab 1 Part 1 Step 16 Cognito Identity Pool Name"/></p>

**Etapa 17** - Expanda a seção **Authentication Providers** na parte inferior da tela clicando no triângulo. Aqui é onde criaremos a conexão entre nosso pool de usuários e o pool de identidade. Você verá uma coleção de guias aqui que representam os vários provedores de identidade que o Cognito suporta. Usaremos a primeira guia, **Cognito**. Você verá opções aqui para inserir o User Pool ID, bem como o App client id que foram capturadas acima. Se você não os copiou antes, você pode acessá-los a partir dos atributos do pool de usuários que você criou acima.

<p align="center"><img src="./images/lab1/part1/cognito_step10_auth_providers.png" alt="Lab 1 Part 1 Step 17 Cognito Authentication Providers"/></p>


**Etapa 18** - Selecione o botão **Create Pool** no canto inferior direito da página.

**Etapa 19** - Finalmente, selecione o botão **Allow** na próxima página para permitir que seu novo pool de identidade acesse os recursos da AWS. Isso completará o processo de criação.

**Recapitulando**: Até agora, você tem todas as peças móveis instaladas para que seu sistema SaaS gerencie usuários e associe esses usuários a tenants. Também configuramos as políticas que controlarão como o sistema valida os usuários durante a integração. Isso inclui a definição de políticas de senha e nome de usuário. A última seção configurou um pool de identidade para permitir o acesso autenticado aos recursos da AWS.

## Parte 2 - Gerenciando Usuários

Embora tenhamos configurado a infraestrutura AWS para suportar o gerenciamento de nossas identidades de usuário com o Cognito, ainda precisamos de algum mecanismo que permita que nosso aplicativo acesse e configure esses elementos em tempo de execução. Para chegar lá, precisamos apresentar um microsserviço que ficará na frente das APIs do Cognito. Isso encapsula nossos recursos de gerenciamento de usuário e simplifica a experiência do desenvolvedor, ocultando os detalhes da API Cognito.

Instead of building this microservice from scratch, we're going to simply review the sample code deployed as a Docker container image to **Amazon Elastic Container Service** (ECS).

**Etapa 1** - Vamos abrir o código e dar uma olhada. Para simplificar essa experiência e garantir que todos tenham as ferramentas de linha de comando necessárias para acompanhar, provisionamos uma IDE (Integrated Development Environment) **AWS Cloud9** para você.

Para começar a usar o Cloud9, escolha-o no AWS Console na categoria **Development Tools**. Uma tela listando seus IDEs disponíveis será exibida. Clique no botão **Open IDE** no**SaaS Bootcamp IDE** para iniciar o Cloud9 em uma nova guia do navegador.

<p align="center"><img src="./images/lab1/part2/cloud9_launch.png" alt="Lab 1 Part 2 Step 1 Launch Cloud9 IDE"/></p>

**Etapa 2** - Quando seu IDE Cloud9 foi iniciado, ele clonou automaticamente o repositório GitHub para este workshop e você deve ver uma árvore de pastas no lado esquerdo com a pasta `aws-saas-factory-bootcamp` listada. Expanda esta árvore e navegue até a pasta `source/user-manager`. Clique duas vezes no arquivo **server.js** para abri-lo no painel do editor. Este arquivo é um arquivo **Node.js** que usa a estrutura de aplicativo da web **Express** para implementar uma API REST para gerenciar usuários. Abaixo está uma lista de alguns dos pontos de entrada que podem ser de interesse para este fluxo de integração.

```javascript
app.get('/user/pool/:id', function(req, res) {...});
app.get('/user/:id', function(req, res) {...});
app.get('/users', function(req, res) {...});
app.post('/user/reg', function(req, res) {...});
app.post('/user/create', function(req, res) {...});
app.post('/user', function(req, res) {...});
app.put('/user', function(req, res) {...});
app.delete('/user/:id', function(req, res) {...});
```

Estes representam pontos de entrada HTTP no serviço de gerenciador de usuário e incluem operações CRUD básicas (criar, ler, atualizar, excluir), bem como funcionalidade para suportar o registro e busca de dados do Cognito User Pool para um determinado nome de usuário.

**Etapa 3** - Como o Cognito servirá como o repositório para armazenar nossos usuários, o serviço de gerenciador de usuários deve fazer chamadas para a API do Cognito para persistir novos usuários que são criados no sistema. Para ilustrar isso, vamos dar uma olhada mais de perto em uma versão inicial do método POST no gerenciador de usuários que criará novos usuários no Cognito. Você verá que nosso método `app.post` obtém um objeto de usuário formatado em JSON do corpo da solicitação que é então passado para nosso pool de usuários do Cognito por meio do método `createUser` do SDK do Cognito.

```javascript
app.post('/user/create', function (req, res) {
    var newUser = req.body;
    
    var credentials = {};
    tokenManager.getSystemCredentials(function (systemCredentials) {
        if (systemCredentials) {
            credentials = systemCredentials;
        
            cognitoUsers.createUser(credentials, newUser, function(err, cognitoUsers) {
                if (err) {
                    res.status(400).send('{"Error": "Error creating new user"}');
                } else {
                    res.status(200).send(cognitoUsers);
                }
            });

        } else {
            res.status(400).send('{"Error": "Could not retrieve system credentials"}');
        }
    });
});
```

**Etapa 4** - Agora que temos uma visão mais clara do que está acontecendo nos bastidores, vamos fazer uma chamada para este serviço REST para criar um usuário no **Pool de usuários Cognito** para nosso tenant.

Para conseguir isso, você precisará da URL de chamada do **API Gateway** que está na frente do nosso microsserviço e do **Pool Id** do Cognito que você salvou antes ao configurar o User Pool.

Navegue até o console do **API Gateway** listado sob o título **Networking** no console da AWS. Selecione a API **saas-bootcamp-api**. No menu à esquerda, selecione o link **Stages**. No topo da árvore de estágios implantados, você deve ver um estágio **v1** para a "versão 1". Clique nele e, na área principal da tela, você verá o **Invoke URL** para este estágio do API Gateway implementado. Por exemplo:

<p align="center"><img src="./images/lab1/part2/apigateway_stage_url.png" alt="Lab 1 Part 2 Step 4 API Gateway stage URL"/></p>

**Etapa 5** - Se você precisar recuperar seu ID do pool de usuários novamente, navegue até o serviço Cognito no console da AWS e selecione o botão **Manage User Pools**. Você verá uma lista de pools de usuários que foram criados em sua conta. Selecione o pool de usuários que você criou anteriormente para exibir informações sobre o pool de usuários.

<p align="center"><img src="./images/lab1/part2/your_user_pools.png" alt="Lab 1 Part 2 Step 5 Your User Pools"/></p>

**Etapa 6** - Depois de selecionar o pool, será apresentada uma página de resumo que identifica os atributos do seu pool de usuários. O que você procura é o **Pool Id**, que é mostrado no topo da página (semelhante ao que é mostrado abaixo).

<p align="center"><img src="./images/lab1/part2/cognito_pool_id.png" alt="Lab 1 Part 2 Step 6 Pool Id"/></p>

**Etapa 7** - Agora que você tem a id do pool e a URL de chamada, está pronto para chamar o método REST no serviço de gerenciador de usuários para criar um usuário no Cognito. Para chamar nosso ponto de entrada REST, precisaremos invocar o método POST de criação de usuário. Você pode fazer isso por meio de uma variedade de ferramentas (cURL, Postman, etc.). Usaremos a linha de comando do terminal disponível na Cloud9.

A tela de boas-vindas do Cloud9 será aberta como uma guia no painel do editor. _Abaixo_ do painel do editor de código, você deve ver uma série de guias de linha de comando. Você pode usar uma linha de comando existente ou abrir uma nova janela de terminal clicando no botão verde de mais e escolher **New Terminal** ou usar o atalho de teclado `Alt/Opt-T`.

<p align="center"><img src="./images/lab1/part2/cloud9_new_terminal.png" alt="Lab 1 Part 2 Step 7 Cloud9 New Terminal"/></p>

Use a linha de comando do terminal Cloud9 para invocar o comando REST para criar um novo usuário. Copie e cole o seguinte comando (certifique-se de rolar para selecionar o comando inteiro), substituindo **USER-POOL-ID** pelo ID do pool que você capturou nas configurações do Pool de usuários do Cognito e **INVOKE-URL** pela URL que você capturou das configurações do estágio do API Gateway.

```bash
curl -w "\n" --header "Content-Type: application/json" --request POST --data '{"userPoolId": "USER-POOL-ID", "tenant_id": "999", "userName": "test@test.com", "email": "test@test.com", "firstName": "Test", "lastName": "User", "role": "tenantAdmin", "tier": "Advanced"}' INVOKE-URL/user/create
```

Em caso de sucesso, o objeto de usuário recém-criado será retornado no formato JSON.

**Etapa 8** - Agora você pode verificar se seu novo usuário foi criado no pool de usuários do Cognito. Mais uma vez, vamos retornar ao serviço Cognito no console da AWS. Depois de selecionar o serviço, selecione **Manage User Pools** e selecione o pool de usuários criado acima para detalhar esse pool.

Selecione **Users and groups** no menu à esquerda. Ao selecionar esta opção, você verá a lista de usuários em seu pool. Você pode ter que clicar no pequeno ícone de atualização no canto superior direito para ver todos os usuários.

<p align="center"><img src="./images/lab1/part2/cognito_users_and_groups.png" alt="Lab 1 Part 2 Step 8 Cognito Users and Groups"/></p>

**Etapa 9** - Seu usuário recém-adicionado deve aparecer nesta lista. Selecione o link do nome de usuário para obter informações mais detalhadas sobre o usuário. Você verá informações do usuário com o tenant, o nome e o endereço de e-mail que você forneceu por meio do comando REST.

<p align="center"><img src="./images/lab1/part2/cognito_user_detail.png" alt="Lab 1 Part 2 Step 9 Cognito User Detail"/></p>

**Recapitulando**: Nesta sessão, apresentamos o AWS Cloud9 IDE para facilitar a visualização do código-fonte de exemplo do workshop e suas ferramentas de linha de comando de terminal Linux integradas. Investigamos como construímos um serviço de gerenciamento de usuários em uma arquitetura de microsserviços para abstrair os detalhes da API Cognito. Você também pode ver como o serviço de gerenciamento de usuários criou novos usuários em seu pool de usuários.

Embora tenhamos nos concentrado aqui em criar o pool de usuários e usuários de forma manual, a versão final desta solução automatizará a criação do pool de usuários para cada tenant durante a integração.

## Parte 3 - Gerenciando Tenants

Neste ponto, temos uma maneira de criar usuários como parte do processo de integração. Também temos uma maneira de associar esses usuários a tenants. O que está faltando é alguma capacidade de armazenar e representar os tenants.

Os tenants devem ser representados e gerenciados separadamente dos usuários. Eles têm políticas, níveis, status e assim por diante - todos os quais devem ser gerenciados por meio de um contrato e serviço separados.

Felizmente, o gerenciamento desse serviço é relativamente simples. Ele simplesmente requer um microsserviço CRUD (criar, ler, atualizar, excluir) que gerenciará os dados armazenados em uma tabela do DynamoDB.

**Etapa 1** - O Tenant Manager também foi implantado em um contêiner ECS Fargate como um microsserviço Node.js. Ele também tem uma API REST e podemos exercitá-la por meio da linha de comando, assim como fizemos com o serviço User Manager.

Envie o seguinte comando para criar um novo tenant. Copie e cole o seguinte comando (certifique-se de rolar para selecionar o comando inteiro), substituindo **INVOKE-URL** pelo URL que você capturou das configurações de estágio do API Gateway.

```bash
curl -w "\n" --header "Content-Type: application/json" --request POST --data '{"tenant_id": "111", "role": "tenantAdmin", "company_name": "Test SaaS Tenant", "tier": "Advanced", "status": "Active"}' INVOKE-URL/tenant
```

**Etapa 2** - Vamos verificar se nosso tenant foi salvo no banco de dados. Navegue até o serviço DynamoDB no console AWS e selecione a opção **Tables** na lista de navegação no canto superior esquerdo da página.

<p align="center"><img src="./images/lab1/part3/dynamo_menu_tables.png" alt="Lab 1 Part 3 Step 2 DynamoDB Menu Tables"/></p>

**Etapa 3** - Localize e selecione o hyperlink da tabela **TenantBootcamp** na lista de tabelas do DynamoDB e selecione a guia **Items** para visualizar os dados na tabela.

<p align="center"><img src="./images/lab1/part3/dynamo_tenant_table.png" alt="Lab 1 Part 3 Step 3 DynamoDB Tenant Table"/></p>

Você deve ver um item na tabela contendo todos os atributos enviados por meio do comando cURL.

**Recapitulando**: o objetivo desta seção era apenas apresentar a você o serviço gerenciador de tenants e a representação separada dos dados de tenants. O **tenant_id** nesta tabela DynamoDB será associado a um ou mais usuários por meio do atributo **tenant_id** que criamos como um atributo personalizado no pool de usuários do Cognito. Ao separar os dados de tenant de nossos atributos de usuário, temos um caminho claro para como os tenants são gerenciados e configurados.

## Part 4 - The Onboarding & Authentication Application

All of the microservices are deployed and the backend infrastructure pieces are in place to support the onboarding process. Now we'll look at the application that can engage the services to onboard and authenticate tenants. We won't dig too far into the details of the web application. It's a relatively straightforward AngularJS application that is hosted on **Amazon S3**.

It's important to note that the rules and mechanics of this onboarding workflow reflect the policies and settings choosen when the user pool is created in Cognito. Validation mechanisms and password policies, for example, will be enforced and orchestrated by Cognito.

**Step 1** – Before we open up the web application, let's take a look at a sample from the UI code that will be invoking the REST services that we covered above. The code that follows is taken from the `register.js` controller found at `source/web-client/app/scripts/controllers/register.js`.
When the registration form is filled out and the user selects the **Register** button, the system will invoke the following snippet of code:

```javascript
$scope.formSubmit = function () {
    if (!($scope.tenant.email || $scope.tenant.companyName)) {
        $scope.error = "User name and company name are required. Please enter these values.";
    } else {
        var tenant = {
            tenant_id: '',
            companyName: $scope.tenant.companyName,
            accountName: $scope.tenant.companyName,
            ownerName: $scope.tenant.email,
            tier: $scope.tenant.plan,
            email: $scope.tenant.email,
            userName: $scope.tenant.email,
            firstName: $scope.tenant.firstName,
            lastName: $scope.tenant.lastName
        };

        $http.post(Constants.TENANT_REGISTRATION_URL + '/reg', tenant)
                .then(function (data) {
                    console.log('Registration success');
                    $scope.hideRegistrationForm = true;
                    $scope.showSuccessMessage = true;
                })
                .catch(function (response) {
                    $scope.error = "Unable to create new account";
                    console.log('Registration failed: ', response);
                });
    }
};
```

Notice that we copy the contents of the HTML form and construct a JSON `tenant` object that holds all the attributes of our new tenant. Then, we make the REST call that POSTs this JSON tenant data to the tenant registration service. The registration service orchestrates calls to the user manager and tenant manager to provision all the elements of the tenant footprint.

**Step 2** – Our web application is considered static because it uses JavaScript to modify the HTML views directly on the browser without having to reload the entire URI from the server. **Amazon S3** provides for _serverless_ hosting of static websites. To minimize geographic delay in loading your website and to offload HTTPS encryption, we've put an Amazon CloudFront distribution in front of the S3 bucket hosting our website. We need to capture the URL of our application from CloudFront.


Navigate to the **CloudFront** service under the **Networking & Content Delivery** category in the AWS console. A distribution has been created for our web application. Copy the **Domain Name** and open it in a new web browser window or tab.

<p align="center"><img src="./images/lab1/part4/cloudfront_distributions.png" alt="CloudFront"/></p>

**Step 3** – The landing page for the application will prompt you to login. This page is for tenants that have already registered. You don't have any tenants yet, so, you'll need to select the **Register** button (to the right of the **Login** button). Selecting this button will take you to a form where you can register your new tenant.

<p align="center"><img src="./images/lab1/part4/registration.png" alt="Lab 1 Part 4 Step 3 Registration Form"/></p>

Enter the data for your new tenant and its initial admin user. The key value here is your email address. _You must enter an email address where you can access the messages_ that will be used to complete this registration process. The remaining values can be as you choose. This will be the first tenant in your system and we will create another in the next lab.

The "Plan" value is simply included to convey that during onboarding is where you would capture the different tiers of your product offering.

Once you complete the form, select the **Register** button and after a second or two you'll be presented with message indicating that you have registered and should be receiving an email to validate your identity.

**Step 4** – Now check your email for the validation message that was sent by Cognito. You should find a message in your inbox that includes your username (your email address) along with a temporary password (generated by Cognito). The message will be similar to the following:

<p align="center"><img src="./images/lab1/part4/cognito_email.png" alt="Lab 1 Part 4 Step 4 Cognito Validation Email"/></p>

**Step 5** – We can now login to the application using these credentials. Return to the application using the URL provided above and you will be presented with a login form. Enter the temporary credentials that were provided in the Cognito validation email and select the **Login** button.

<p align="center"><img src="./images/lab1/part4/login.png" alt="Lab 1 Part 4 Step 5 Login Form"/></p>

**Step 6** – Cognito will detect that this is a temporary password and indicate that you need to setup a new password for your account. To do this, the application redirects you to a new form where you'll setup your new password. Create your new password and select the **Confirm** button. Remember, your new password must conform to the policy you defined in Cognito earlier in this Lab (upper and lower letters and at least 1 number and 8 characters or more in length).

<p align="center"><img src="./images/lab1/part4/change_password.png" alt="Lab 1 Part 4 Step 6 Change Password"/></p>

**Step 7** – Let's confirm that you can authenticate with your newly created account. Enter your username (email address) and the password you just confirmed. You will now be placed at the landing page of the application. (The dashboard totals are fake).

<p align="center"><img src="./images/lab1/part4/home_page.png" alt="Lab 1 Part 4 Step 7 Home Page"/></p>

**Step 8** – As a new tenant to the system, you are created as a **Tenant Administrator**. This gives you full control of your tenant environment. It also gives you the ability to create new users in your system. Let's try that. Navigate to the **Users** menu option at the top of the page. This will display the current list of users in your system. You'll see the initial admin user the tenant registration process created.

<p align="center"><img src="./images/lab1/part4/users.png" alt="Lab 1 Part 4 Step 8 Users"/></p>

Now select the **Add User** button to add a new user to your system in the **Order Manager** role. Create the new user (using a different email address/username) than your tenant. Be sure to select the **Order Manager** role. Once you've entered all the data, select the **Save** button at the bottom of the form.

**Hint**: You can use the same email address as you used for your tenant admin but add a plus symbol (**+**) and unique string after the username but before the at (**@**) symbol (e.g. test@test.com -> test+user1@test.com). The email server should also deliver this message addressed to **test+user1** to the **test** user's inbox.

<p align="center"><img src="./images/lab1/part4/add_user.png" alt="Lab 1 Part 4 Step 8 Add User"/></p>

**Step 9** – The onboarding of new users follows the same flow that was used to register a new tenant. Pressing the save button triggers Cognito's processing to generate an email that will be sent to the email address that was provided.

Select the dropdown menu with your tenant name at the top right of the screen and select **Logout**. This will return you to the login page.

<p align="center"><img src="./images/lab1/part4/logout.png" alt="Lab 1 Part 4 Step 9 Logout"/></p>

Retrieve the email with the temporary credentials for the order manager user. Repeat the same steps you did above to set a new password and then login as the order manger user. You're now in the application with the role of "Order Manager" not "Tenant Administrator". You'll notice that the "Users" option is gone from the menu and you no longer have the ability (for this user) to create or manage users in the system.

**Recap**: This was the last step in verifying that all the elements of the onboarding and authentication lifecycle are in place. We logged back into the system as our tenant administrator user and verified that the newly set password would let us into the application un-challenged. We also created a user as a child of our tenant and saw that the onboarding flow was the same and that the application restricts access to certain functionality by the custom attributes we defined in Cognito such as role and tier.

## Part 5 - Acquiring Tenant Context

We have now seen how our system and architecture choices create a scalable, flexible, and user-friendly tenant onboarding process for our SaaS application. Now we will look at the nuts and bolts of how exactly our SaaS Identity of combined authenticated user and tenant context is brokered through the application using a feature of the OpenID Connect standard called custom claims.

**Step 1** – Return to the web application and login if you aren't already. We will use the **Network** tab of the **Developer Tools** from your web browser to investigate the HTTP headers as our application invokes the REST APIs of our system.

* Google Chrome
  * Click the 3 vertical dots at the end of the address bar -> More Tools -> Developer Tools -> Network
* Mozilla Firefox
  * Click Tools -> Web Developer -> Network
* Apple Safari
  * Safari Menu -> Preferences -> Advanced -> Show Develop menu in menu bar -> Develop -> Show Web Inspector -> Network

**Step 2** – While looking at the **Network** tab of your browser's **Developer Tools**, select the **Users** menu option in the web application. Select the 2nd request for `users` in the list of resources and then expand the **Request Headers** section in the **Headers** tab. One of the request headers is the **Authorization** header. It's the value in this HTTP header that our microservices leverage to integrate multi-tenant identity.

<p align="center"><img src="./images/lab1/part5/developer_tools.png" alt="Lab 1 Part 5 Step 2 Developer Tools"/></p>

**Step 3** – Notice, that the **Authorization** header consists of the term **Bearer** followed by an encoded string. This is the authorization token, better known as a **JSON Web Token** (JWT). Copy the encoded token into a text editor, and open a new tab to the website https://jwt.io/. This website will allow us to decode our token to investigate the corresponding metadata within the JWT.

<p align="center"><img src="./images/lab1/part5/jwtio.png" alt="Lab 1 Part 5 Step 3 JWT.io"/></p>

**Step 4** – Scroll down the page and paste the encoded token into the **Encoded** text box in the middle of the website. This paste should have triggered a decoding of the token. Notice in the **Decoded** section of the website, the **PAYLOAD** section contains decoded key value pairs including the **email** address of the user, as well as the custom **Claims** such as **custom:tenant_id** which we configured as _immutable_ within our Cognito User Pool in the first part of this Lab.

<p align="center"><img src="./images/lab1/part5/jwt_payload.png" alt="Lab 1 Part 5 Step 4 JWT Payload"/></p>

**Recap**: This part showed how we can leverage custom "claims" within our security token to pass along tenant-context to each REST API invocation in our system. We are utilizing a standard mechanism from OpenID Connect which Cognito (and many other identity providers) support to augment user profile information with custom attributes. In the next lab of our bootcamp, we will learn how our microservices decode this JWT security token and apply the tenant context to our business logic.

[Continue to Lab 2](Lab2.md)

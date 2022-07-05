# Criando Soluções SaaS na AWS

![SaaSAWS](images/SaaS-Factory.png "SaaS Factory")

# Introdução
SaaS (Software as a Service) apresenta aos desenvolvedores uma combinação única de desafios: multi-tenancy, integração/onboarding, segurança, particionamento de dados, isolamento de tenants e identidade.

Uma das melhores maneiras de entender os princípios arquitetônicos de SaaS é examinar exemplos de design, construção e otimização. Neste workshop, vamos expor você aos principais conceitos da arquitetura SaaS, onde você pode ver as partes móveis de uma solução SaaS em ação.

Este workshop fornece uma série de atividades para os participantes interagirem com uma solução funcional e exercícios práticos que apresentam código e configuração para realizar e estender os recursos deste ambiente SaaS.

# Quem deve participar?
Os desenvolvedores e arquitetos de aplicações que desejam entrar em detalhes sobre a implementação de uma solução SaaS na AWS são incentivados a participar. O conteúdo do bootcamp/workshop é voltado para os mais novos com SaaS. No entanto, mesmo se você tiver experiência em SaaS, essa experiência ainda pode expô-lo a especificidades de uma arquitetura SaaS na AWS.

# Como começar?
Se você estiver participando deste workshop durante um evento da AWS, siga as instruções dos instrutores no local.

Se você gostaria de executar os exercícios do laboratório de maneira autoguiada, tudo que você precisa fazer é utilizar o template [workshop.yml](https://github.com/aws-samples/aws-saas-factory-bootcamp/blob/master/resources/workshop.yml) do AWS CloudFormation em sua conta da AWS e em seguida comece clicando no ícone do Lab 1 abaixo.

Observe que este workshop cria infraestrutura em sua conta da AWS que está fora do nível gratuito (free tier), e você deve excluir a stack do CloudFormation quando terminar para minimizar os custos. Os recursos do Amazon Cognito e as funções e políticas do AWS IAM criadas pelo sistema integrado precisarão ser removidos manualmente após a exclusão da stack.

# Laboratórios
### Lab 1 - Identidade e Onboarding/Integração
[![Lab1](images/lab1.png)](Lab1-pt-br.md "Lab 1")

### Lab 2 - Microsserviços Multi-Tenant
[![Lab2](images/lab2.png)](Lab2-pt-br.md "Lab 2")

### Lab 3 - Isolamento de Dados
[![Lab3](images/lab3.png)](Lab3-pt-br.md "Lab 3")

# Licença
Este workshop é licenciado pela Licença Apache 2.0. Veja o arquivo de [LICENÇA](LICENSE).

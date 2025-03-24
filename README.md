# Barber Shop Frontend

## Visão Geral

Este é o frontend da [**Barber Shop API**](https://github.com/RinoaYK/barber-shop-api), uma aplicação web desenvolvida para interagir com a API REST de uma barbearia moderna. O objetivo é oferecer uma interface intuitiva e responsiva para gerenciar clientes e agendamentos, com funcionalidades específicas que atendem às necessidades do dia a dia de uma barbearia.

### Veja o site:
[**Barber Shop**](https://barber-shop-seven-nu.vercel.app/schedules/month) deploy.

## Principais Tecnologias

-   **Angular**
-   **TypeScript**
-   **Angular Material**
-   **Bootstrap**
-   **RxJS**
-   **HTML5/CSS**

## Funcionalidades Principais

-   **Responsividade:** A interface foi projetada para se adaptar a diferentes tamanhos de tela, desde dispositivos móveis até telas de desktop, utilizando media queries e ajustes dinâmicos como `transform: scale()`.
-   **Busca por Nome de Cliente:** Implementada uma funcionalidade de busca em tempo real no campo de pesquisa, permitindo filtrar clientes por nome diretamente na lista exibida.
-   **Clientes Já Atendidos:** Clientes cujo horário de agendamento já passou são automaticamente riscados na lista (ex.: com estilo CSS `text-decoration: line-through`), oferecendo uma visualização clara dos atendimentos concluídos.
-   **Limite de Agendamento:** Regra de negócios implementada para permitir apenas um agendamento por cliente por dia, validada no frontend antes de enviar a requisição ao backend.
-   **Horário de Atendimento:** Adicionado um intervalo fixo de funcionamento da barbearia: 9h às 18h (9 AM - 6 PM). Os agendamentos são restritos a esse período, com validação no formulário de agendamento.
-   **Gerenciamento de Clientes e Agendamentos:** Interface para criar, atualizar, excluir e visualizar clientes.
-   **Funcionalidades de agendar, remarcar e cancelar serviços, integradas à API.**

## Destaques Técnicos

-   **Lazy Loading de Componentes:** As rotas foram configuradas para usar carregamento tardio (lazy loading), ou seja, os componentes só são carregados quando chamados. Isso melhora o desempenho inicial da aplicação, reduzindo o tempo de carregamento.

    ```typescript
    {
        path: 'clients',
        loadComponent: () => import('./clients/clients.component').then(m => m.ClientsComponent)
    }
    ```

-   **Integração com Backend:** Consome a Barber Shop API (Java 21, Spring Boot 3.4.3) via HTTP requests, utilizando serviços Angular para comunicação assíncrona com endpoints como `/clients` e `/schedules`.
-   **Estilização Responsiva:** Uso de media queries para ajustar elementos como botões, tabelas e o paginador em diferentes resoluções.

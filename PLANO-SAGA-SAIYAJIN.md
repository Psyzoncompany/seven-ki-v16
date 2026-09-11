# Plano de expansão da Saga Saiyajin

Status: execução por partes. A missão unificada de chegada e a batalha de Raditz estão implementadas. A continuação de 11/09/2026 acrescenta Caminho da Serpente, treinamento de Kaioh e resistência a Nappa até a chegada de Goku. Os registros anteriores abaixo são históricos. Versus e saves antigos preservados.

### Atualização — missão unificada

- Corrigida a transição para Piccolo: o carregamento da região consome a transição pendente uma única vez, permitindo continuar os diálogos e o movimento.
- Novo botão “Modo história antigo” na tela inicial: acesso separado aos sete confrontos anteriores das sagas Saiyajin e Freeza, todos desbloqueados. Essa opção não avança nem desbloqueia as missões futuras da campanha nova.

- Uma entrada no mapa para todo o Episódio 1. Costa, aliança e aproximação da cápsula prosseguem automaticamente, sem vitória ou seleção de fase entre trechos.
- Reaproveitados os cenários, encontros, diálogos e personagens já implementados. Os números 1.1, 1.2 e 1.3 identificam apenas trechos internos e registros históricos deste plano.
- Removidas as pedras que exigiam destruição para continuar nas montanhas e no resgate. Mantidas as duas pedras sólidas do socorro ao fazendeiro.
- Novo socorro: um menino pede ajuda na encosta; Piccolo precisa afastar a criatura e alcançá-lo. Depois ele agradece e segue para casa.
- Save unificado em `sevenki-raditz-journey-v1`, com região, objetivo e tempo acumulado. O primeiro acesso aproveita o progresso anterior sem apagar suas chaves.
- Tela inicial com nova ilustração em pixel art gerada por ImageGen, combinada ao HUD claro, bordas pixeladas e fonte VT323. Menino com duas poses próprias geradas por ImageGen.
- As entregas anteriores descritas abaixo são histórico; esta atualização substitui a separação do Episódio 1 em três fases públicas.

## 1. Objetivo

### Continuação entregue em 11/09/2026

- Missão 1301: três etapas do Caminho da Serpente, fendas com retorno a marcos locais, encontros com guardiões e Goz/Mez como adaptação jogável. Derrotar o guardião e alcançar a saída são condições distintas.
- Missão 1401: adaptação de movimento à gravidade, captura de Bubbles, três acertos na janela de Gregory, dano com Kaioken ativo e Genki Dama atingindo o alvo. Os cinco objetivos têm checkpoints e podem ser repetidos. O modificador de deslocamento é exclusivo do planeta; a gravidade física global não é alterada.
- Missão 1601: duas ondas de Saibamans, confronto com Piccolo, resistência com Kuririn, contra-ataque de Gohan treinado e proteção de Gohan. Nappa não pode ser derrotado antes da hora. Cena de sacrifício e chegada de Goku encerra esta entrega; o duelo Goku/Nappa e Vegeta continuam pendentes.
- Mapas separados por abas Terra/Outro Mundo, objetivos no HUD, minimapa derivado das posições reais e interface de cenas com pausa e pulo. As cenas finais avançam automaticamente e concedem a mesma conclusão ao pular.
- Save independente `sevenki-otherworld-invasion-v1`, com checkpoints e registro narrativo gratuito de Kaioken/Genki Dama ao terminar o treinamento. Nenhum ponto ou técnica do save antigo é removido ou cobrado novamente; a árvore antiga permanece independente.
- Arte própria `otherworld-cast-v29.png`: Kaioh, Bubbles, Gregory, Kuririn, Goz, Mez e Gohan treinado. Cenários construídos em Canvas. As animações combinam poses do atlas com deslocamento; personagens auxiliares ainda têm conjuntos reduzidos de poses.
- Arquivos: `continuation-data.js`, `continuation-engine.js`, `continuation-view.js`, `continuation.css`, integração em `game.js` e `index.html`. Correção adjacente: o atlas de Raditz agora renderiza o canvas com transparência processada.
- Validação: testes focados de bloqueios, checkpoints, objetivos, combate com comandos reais, combinação de teclado para Genki Dama, cenas assistidas/puladas e saves. Renders desktop/mobile em `output/continuation`, reproduzíveis por `scripts/check-continuation.mjs`. Conferência da entrada de missão e abas no navegador local. Controle físico não foi testado.
- Resultado final: 123 testes anteriores aprovados na validação geral; os dez novos testes passaram após corrigir a fenda indevida na arena de Goz/Mez. Conferência mobile em 390 × 844 mostrou as instruções completas acima dos botões e minimapa separado do HUD. Navegador local sem erros capturados.
- Pendências de escopo: episódios separados de preparação na Terra (5.1–5.3), luta decisiva de Goku com Nappa, Vegeta e conclusão da saga. Não foram liberados como se estivessem prontos.

Transformar a Saga Saiyajin em uma campanha mais longa, com exploração, objetivos variados, personagens jogáveis, minimapa, treinamento e cenas animadas. Manter o combate inspirado em Budokai Tenkaichi 3, adaptado ao jogo 2D, e os efeitos minimalistas já definidos.

A Saga Freeza ficará temporariamente bloqueada. O foco de desenvolvimento será a trajetória que começa na chegada de Raditz, passa pelo Caminho da Serpente e pelo treinamento com o Senhor Kaioh, e termina no confronto com Nappa e Vegeta.

Este documento concentra o plano, as decisões de escopo, a ordem de implementação e o acompanhamento. A execução ocorrerá em partes pequenas, para reduzir retrabalho e o consumo de tokens.

## 2. Diretrizes e limites

- Preservar os controles atuais de teclado, controle e toque.
- Preservar o Versus e o progresso salvo. Bloquear Freeza não significa apagar fases, personagens, sprites ou conquistas existentes.
- Acrescentar duração por meio de objetivos e situações diferentes, evitando apenas repetir inimigos ou aumentar a vida dos chefes.
- Incluir mini lutas com personagens secundários ou criaturas adequadas ao cenário em cada fase ou episódio. Nos treinos, usar desafios de combate ou sparring coerentes com o objetivo. Variar quantidade, ritmo e comportamento; não depender apenas das batalhas contra chefes.
- Manter a leitura dos ataques, a resposta da defesa e os efeitos discretos.
- Usar fases conectadas por um mapa de campanha. Um mundo aberto contínuo não faz parte desta expansão inicial.
- Usar a imagem de mapa enviada pelo usuário como referência de linguagem visual e geografia geral; criar a composição necessária para as regiões jogáveis.
- Separar o mapa da Terra do mapa do Outro Mundo.
- Tratar os inimigos e desafios de combate do Caminho da Serpente como adaptação para o jogo, preservando os acontecimentos centrais da história.
- Implementar uma parte funcional e verificável antes de avançar à seguinte.
- Gerar sprites e cenários conforme a etapa precisar deles, depois de definir as ações e poses necessárias.

## 3. Base que deve permanecer funcionando

### Teclado

| Tecla | Equivalência | Ação |
| --- | --- | --- |
| W A S D | Analógico | Movimento e voo |
| Seta esquerda | X | Golpe e contra-ataque |
| Seta cima | Y | KI e escolha de finalizador |
| Seta direita | B | Defesa e aparo |
| Seta baixo | A | Avanço e perseguição |
| Q | LB | Selecionar alvo |
| E | RB | Pular e subir |
| Ctrl | LT | Carregar KI |
| Espaço | RT | Descer |
| T | R3 | Transformação disponível |
| Tab | View | Alternar zoom |
| Esc | Menu | Pausar |

Combinações que devem ser preservadas: Ctrl + seta cima para especial; Ctrl + seta baixo para Dragon Dash; seta direita + seta baixo para esquiva curta; W + golpe para lançar; S + golpe no ar para derrubar. As direções de movimento dos combos são W/A/S/D, pois as setas representam os botões de ação.

### Combate e apresentação

- Pausa curta no contato, com peso diferente para socos, chutes e golpes fortes.
- Reações corporais distintas e efeitos compactos.
- Escolhas entre pressão próxima, lançamento e afastamento.
- Defesa responsiva, esquiva curta e oportunidade de resposta após aparo.
- Uso dos sprites de combo existentes quando compatíveis com a ação e o personagem.
- Câmera estável e respeito à opção de movimento reduzido.

## 4. Estrutura narrativa e fases

Os nomes e números abaixo organizam o planejamento. Os identificadores internos serão definidos após examinar os saves e as dependências do código existente.

### Episódio 1 — A chegada de Raditz

Uma missão jogável reúne os três trechos abaixo antes da batalha com Raditz. A batalha será uma missão adicional, ainda bloqueada. Os trechos compartilham progresso e conclusão; não aparecem como fases próprias no mapa.

| Trecho interno | Conteúdo | Personagem | Objetivo principal |
| --- | --- | --- | --- |
| 1.1 — Um poder desconhecido | Introdução na Terra, deslocamento até a área de chegada e descoberta da ameaça | Goku | Investigar a região e acompanhar os acontecimentos que levam ao sequestro |
| 1.2 — Uma aliança improvável | Encontro com Piccolo, travessia e confrontos curtos de preparação | Piccolo | Localizar a rota até Raditz e aprender suas ações próprias |
| 1.3 — O resgate de Gohan | Aproximação pelo terreno rochoso, objetivos de resgate e trecho breve de tensão com Gohan | Goku e Piccolo; trecho delimitado com Gohan | Chegar ao local do confronto e preparar a intervenção de Gohan |

O trecho de Gohan antes do treinamento deve refletir sua inexperiência: ações simples, deslocamento limitado e poder descontrolado. Não apresentar nessa etapa um Gohan já treinado. A forma de representar seu cativeiro e sua intervenção será definida no roteiro da fase.

### Episódio 2 — Raditz

Fase 2.1 — Batalha em equipe:

1. Apresentar Raditz e iniciar o confronto com Goku.
2. Alternar para Piccolo em um objetivo de abertura e preparação do Makankosappo.
3. Criar um trecho curto de intervenção jogável de Gohan.
4. Retornar ao confronto final com Goku e Piccolo.
5. Ao cumprir os objetivos da luta, iniciar a cena final uma única vez.

Cena final:

- Goku imobiliza Raditz.
- Piccolo concentra e dispara o Makankosappo.
- O ataque atinge Goku e Raditz, com enquadramento e reação corporal legíveis.
- Mostrar a morte dos dois por poses, composição de cena e diálogo, sem depender de violência gráfica.
- Encerrar com a ameaça dos próximos Saiyajins e a preparação da transição para o Outro Mundo.

A cena terá início, desenvolvimento e conclusão, com sprites específicos. Não será apenas uma mensagem de texto. Deve poder ser pulada, e tanto assistir quanto pular devem conceder exatamente o mesmo progresso e recompensas.

### Episódio 3 — Caminho da Serpente

| Fase | Conteúdo | Objetivo |
| --- | --- | --- |
| 3.1 — A longa estrada | Apresentação do Outro Mundo, primeiros obstáculos e pontos de orientação | Aprender a travessia e alcançar o primeiro checkpoint |
| 3.2 — Prova de resistência | Trechos estreitos, obstáculos e inimigos próprios da adaptação | Administrar movimento e recursos durante a jornada |
| 3.3 — O fim do caminho | Combate de encerramento da travessia e aproximação do planeta | Chegar ao planeta do Senhor Kaioh |

Personagem: Goku. Alternar exploração, movimento e combate. Quedas devem retornar a um checkpoint coerente, sem obrigar a refazer toda a jornada. Definir inimigos visuais adequados ao Outro Mundo, sem reutilizar soldados de Freeza como se pertencessem à história.

### Episódio 4 — Treinamento com o Senhor Kaioh

| Fase | Desafio | Aprendizado ou recompensa |
| --- | --- | --- |
| 4.1 — Gravidade aumentada | Percurso curto com movimento mais pesado e adaptação progressiva | Domínio do deslocamento no planeta |
| 4.2 — Pegue Bubbles | Perseguir Bubbles por rotas previsíveis, com mudanças de direção | Precisão de movimento e gestão do avanço |
| 4.3 — Controle e precisão | Exercícios de tempo de ataque, defesa e alvos de treino | Domínio das janelas de combate; Gregory pode representar o desafio |
| 4.4 — Técnicas de Kaioh | Treinos guiados de Kaioken e Genki Dama, seguidos de uma prova prática | Desbloqueio narrativo das técnicas |

Personagem: Goku. Cada treino terá explicação curta, tentativa prática, retorno claro sobre erro e acerto e opção de repetir. A gravidade modificada será exclusiva dessas fases.

O desbloqueio de técnicas precisa ser conciliado com a árvore de habilidades e os saves antigos. Jogadores que já possuem uma técnica não devem perdê-la nem pagar novamente por ela.

### Episódio 5 — Preparação na Terra

| Fase | Conteúdo | Personagem |
| --- | --- | --- |
| 5.1 — Sobreviver sozinho | Exploração curta, obstáculos e ameaças adequadas à fase de aprendizado | Gohan |
| 5.2 — O treinamento de Piccolo | Exercícios de combate e crescimento de Gohan | Piccolo e Gohan em trechos definidos |
| 5.3 — Reunir os guerreiros | Preparação final e aproximação da área da invasão | Kuririn |

Essas fases poderão aparecer intercaladas entre etapas da jornada de Goku. O mapa deve indicar claramente quem é o personagem e onde a missão acontece, evitando confusão entre Terra e Outro Mundo.

### Episódio 6 — Invasão Saiyajin e Nappa

| Fase | Conteúdo | Personagem |
| --- | --- | --- |
| 6.1 — Os Saibamans | Confrontos com posições e objetivos variados | Piccolo, Gohan e Kuririn em trechos definidos |
| 6.2 — Resistir a Nappa | Batalha em etapas, defesa de aliados e exploração das aberturas de Nappa | Piccolo, Gohan e Kuririn |
| 6.3 — O sacrifício de Piccolo | Transição da batalha para a proteção de Gohan e cena narrativa | Piccolo e Gohan |
| 6.4 — Goku retorna | Chegada de Goku e confronto decisivo com Nappa | Goku |

Piccolo, Gohan e Kuririn devem efetivamente ser jogáveis contra Nappa. A participação deles não pode se resumir a retratos ou diálogos. Separar objetivos como resistir, abrir uma oportunidade e proteger um aliado da condição de derrotar definitivamente o chefe.

### Episódio 7 — Vegeta

| Fase | Conteúdo | Personagem |
| --- | --- | --- |
| 7.1 — O príncipe dos Saiyajins | Duelo com leitura de fintas, defesa e uso de Kaioken | Goku |
| 7.2 — Oozaru | Mudança de escala do confronto, sobrevivência e objetivos específicos | Goku e Gohan em trechos definidos |
| 7.3 — A última chance | Participação de Kuririn e Gohan, apoio narrativo de Yajirobe e conclusão | Kuririn e Gohan |

Preservar os acontecimentos essenciais, integrar a participação dos sobreviventes e concluir a campanha sem desbloquear automaticamente a Saga Freeza enquanto ela estiver bloqueada. Oferecer retorno ao mapa e repetição das missões concluídas.

## 5. Mapa de campanha e minimapa

### Mapa da Terra

- Composição ilustrada inspirada na referência enviada, com regiões reconhecíveis e caminhos entre missões.
- Mostrar localização, nome da missão, personagem jogável e objetivo antes de iniciar.
- Estados visuais: bloqueada, disponível, em andamento e concluída.
- Mostrar requisitos de acesso em linguagem simples.
- Permitir repetir missões concluídas sem desfazer o progresso principal.
- Destacar a próxima missão da história.

### Mapa do Outro Mundo

- Caminho da Serpente representado como uma rota longa, dividida em etapas.
- Planeta do Senhor Kaioh como destino e centro das fases de treinamento.
- Alternância clara entre Terra e Outro Mundo quando houver histórias paralelas.

### Minimapa durante as fases

- Representação simples do trecho atual, e não uma miniatura ilegível do mapa mundial inteiro.
- Marcadores do jogador, objetivo, aliados, ameaças próximas e saída/checkpoint.
- Marcadores derivados das coordenadas reais da fase.
- Atualização correta ao mudar de personagem, morrer, retomar um checkpoint ou trocar de região.
- Indicação de altura quando necessária em trechos aéreos; começar com projeção 2D simples.
- Contraste adequado e tamanho adaptado ao celular, sem cobrir vida, KI ou botões.
- Ocultar ou reduzir sua presença durante cenas narrativas, conforme o enquadramento.

## 6. Personagens jogáveis

| Personagem | Papel no combate | Necessidades principais |
| --- | --- | --- |
| Goku | Equilíbrio entre pressão, perseguição e técnicas | Integrar evolução, treinamento e cenas narrativas |
| Piccolo | Alcance, golpes precisos e preparação do Makankosappo | Conjunto próprio de sprites, ataques e especial |
| Gohan inicial | Sobrevivência e explosões breves de poder | Ações limitadas e poses adequadas à idade e ao contexto |
| Gohan treinado | Mobilidade e respostas rápidas | Progressão de movimentos, combos e especial |
| Kuririn | Agilidade, controle de espaço e técnica | Sprites, combos e Kienzan com comportamento próprio |

Primeira implementação: troca de personagem guiada pelo roteiro, nos checkpoints e nas transições de fase. Troca livre durante qualquer combate não é requisito inicial.

Na troca, atualizar identidade visual, retrato, dimensões de colisão, golpes, especial, recursos e câmera. Definir por missão quais recursos são preservados ou restaurados. Evitar que um personagem herde acidentalmente ataque, invulnerabilidade, efeitos ou perseguição do anterior.

Aliados controlados pela CPU só serão implementados nas situações que exigirem sua presença ativa. Devem apoiar sem bloquear o movimento do jogador nem concluir sozinhos objetivos fundamentais.

## 7. Cenas animadas

Cenas prioritárias:

1. Chegada de Raditz e sequestro de Gohan.
2. Aliança entre Goku e Piccolo.
3. Intervenção de Gohan na batalha.
4. Goku segurando Raditz, disparo de Piccolo e morte de Goku e Raditz.
5. Entrada no Outro Mundo e chegada ao planeta do Kaioh.
6. Chegada de Nappa e Vegeta.
7. Piccolo protegendo Gohan.
8. Retorno de Goku.
9. Transformação de Vegeta e conclusão da saga.

Criar um sistema simples de sequências com poses, movimentos, câmera, diálogos, sons e transições. Suspender dano e comandos de combate durante as cenas. Manter pausa e opção de pular. Limpar comandos acumulados ao devolver o controle.

Priorizar a cena final de Raditz como primeira sequência completa. As demais podem começar como encenações curtas e receber acabamento na etapa correspondente.

## 8. Sprites, cenários e áudio

### Sprites

- Reaproveitar os quadros existentes que já representem corretamente a ação.
- Criar conjuntos próprios de Piccolo, Gohan e Kuririn: repouso, movimento, voo, defesa, dano, recuperação, golpes, lançamento, finalizador e especial.
- Criar as poses específicas das cenas de Raditz: imobilização, concentração, disparo, impacto, queda e encerramento.
- Criar poses de Bubbles, Kaioh e personagens auxiliares conforme os treinos implementados.
- Criar os inimigos do Caminho da Serpente depois de fechar seus comportamentos.
- Manter identidade, proporções, direção, escala e pontos de apoio consistentes entre poses.
- Validar transparência, recortes, quadros vizinhos e leitura do movimento em tamanho real de jogo.
- Salvar novos arquivos com nomes próprios e manter os originais necessários às outras modalidades.

### Cenários

- Regiões da Terra para investigação, travessia e confronto com Raditz.
- Caminho da Serpente com variações de trecho e obstáculos.
- Planeta do Kaioh com ambientação e geometria adequadas ao treinamento.
- Área de treinamento de Gohan e Piccolo.
- Arenas de Saibamans, Nappa e Vegeta.
- Mapas ilustrados da Terra e do Outro Mundo.

### Áudio

- Usar o sistema de áudio existente como base.
- Diferenciar alertas, objetivos concluídos, troca de personagem e técnicas.
- Reservar efeitos mais fortes para os momentos narrativos essenciais.
- Não depender de dublagem ou de arquivos externos para concluir a primeira versão.

## 9. Progressão, checkpoints e bloqueio de Freeza

### Bloqueio temporário de Freeza

- Exibir “Em breve” ou equivalente no acesso à saga.
- Bloquear também o início por atalhos ou chamadas diretas da lógica de campanha.
- Se o save abrir na Saga Freeza, redirecionar a seleção para a Saga Saiyajin sem apagar os dados anteriores.
- Centralizar o bloqueio para facilitar a reativação futura.
- Manter personagens de Freeza disponíveis no Versus, salvo decisão posterior do usuário.

### Progressão

- Registrar missões concluídas, próxima missão, personagens e técnicas desbloqueados.
- Registrar checkpoints em locais narrativamente seguros.
- Impedir recompensas duplicadas ao repetir missões, pular cenas ou recarregar a página.
- Distinguir completar um objetivo de derrotar todos os inimigos.
- Ao morrer, reiniciar do checkpoint com estado coerente de inimigos, objetivos e personagem.
- Definir uma versão do formato de save e migrar os dados antigos sem remover conquistas.
- Na migração, preservar conclusões já obtidas; decidir explicitamente quais novas missões ficam disponíveis ou opcionais para esses jogadores.

## 10. Organização técnica proposta

Os nomes de novos módulos abaixo são sugestões. Antes de criar arquivos, verificar se a responsabilidade já está bem atendida por um módulo existente.

| Área | Organização proposta |
| --- | --- |
| Dados de campanha | Evoluir `dist/saga.js` ou extrair um catálogo de missões, pré-requisitos e recompensas |
| Fluxo de missões | Controlar objetivos, checkpoints e transições separadamente da lógica de dano |
| Personagens da campanha | Compartilhar dados de identidade e golpes com o Versus quando apropriado |
| Cenas | Módulo de sequências narrativas, evitando grandes condicionais espalhadas pelo motor |
| Mapas | Separar dados de regiões e nós da renderização e interação |
| Minimapa | Renderizador que recebe estado da fase, sem alterar a simulação |
| Combate | Preservar `engine.js`, `combat-data.js`, `saiyan-combat.js` e a IA, ampliando apenas o necessário |
| Sprites | Reutilizar a preparação de atlas e seleção de poses já existente |
| Controles | Preservar `keyboard.js`, `gamepad.js` e a adaptação de toque |
| Saves | Migração explícita e compatível com o progresso anterior |

Não reescrever todo o motor como pré-requisito. Fazer mudanças estruturais somente quando necessárias à entrega em andamento.

## 11. Execução por partes

### Parte 1 — Foco na Saga Saiyajin e estrutura da campanha

Entregas:

- Bloquear o acesso à Saga Freeza e manter os dados existentes.
- Garantir que o menu e o save abram em uma seleção válida.
- Preparar catálogo de missões, pré-requisitos e estado de progresso da expansão.
- Definir migração de saves e o que acontece com jogadores que já venceram Raditz, Nappa ou Vegeta.

Critérios de conclusão:

- Freeza não inicia pelo menu nem por entrada direta da campanha.
- Saves antigos continuam carregando e o Versus permanece funcional.
- A estrutura permite acrescentar missões sem duplicar regras de desbloqueio.

### Parte 2 — Mapa Saiyajin e minimapa funcional

Entregas:

- Navegação entre regiões e nós de missão da Terra.
- Estrutura de alternância com o Outro Mundo.
- Minimapa funcional em uma fase existente.
- Estados de bloqueio, seleção e conclusão visíveis.

Critérios de conclusão:

- Selecionar uma missão disponível inicia a missão correta.
- Marcadores acompanham o estado real da fase.
- Interface legível em computador e celular.
- Primeiro validar o funcionamento com arte simples; finalizar a ilustração quando as rotas estiverem estáveis.

### Parte 3 — Personagens jogáveis e troca guiada

Entregas:

- Infraestrutura de troca de personagem por missão/checkpoint.
- Piccolo, Gohan e Kuririn com conjuntos básicos de movimentos e sprites próprios.
- Diferenciação entre Gohan inicial e treinado.
- Retratos, colisões e especiais correspondentes ao personagem ativo.

Critérios de conclusão:

- Cada personagem completa um trecho de teste com movimento, ataque, defesa, dano e especial.
- A troca não deixa comandos, ataques ou efeitos do personagem anterior ativos.
- Sprites sem cortes ou variações incoerentes de escala.

Subdividir esta parte em infraestrutura, Piccolo, Gohan e Kuririn se necessário.

### Parte 4 — Três fases anteriores a Raditz

Entregas:

- Fases 1.1, 1.2 e 1.3 com objetivos e checkpoints próprios.
- Participação jogável de Piccolo e trecho delimitado de Gohan.
- Diálogos curtos, progressão e ligação com o mapa.

Critérios de conclusão:

- As três fases podem ser concluídas em sequência e retomadas após sair do jogo.
- Nenhuma exige derrotar Raditz antes da hora.
- Cada fase apresenta uma atividade ou situação distinta.

### Parte 5 — Raditz e cena final

Entregas:

- Batalha em etapas com Goku, Piccolo e Gohan.
- Sistema mínimo de cenas animadas.
- Sequência do Makankosappo e morte de Goku e Raditz.
- Transição para o Outro Mundo.

Critérios de conclusão:

- Todas as etapas da luta são alcançáveis sem travas de roteiro.
- Assistir ou pular a cena produz o mesmo estado final.
- A conclusão e as recompensas são registradas uma única vez.

### Parte 6 — Caminho da Serpente e Kaioh

Entregas:

- Três etapas de travessia e mapa do Outro Mundo.
- Inimigos, obstáculos e checkpoints adequados à adaptação.
- Planeta do Kaioh e quatro fases de treinamento.
- Desbloqueio narrativo de técnicas compatível com os saves existentes.

Critérios de conclusão:

- A jornada inteira pode ser percorrida e retomada por checkpoints.
- Treinos ensinam uma ação concreta, avaliam sua execução e permitem repetir.
- Gravidade especial não interfere nas fases da Terra.

Subdividir em travessia inicial, restante do caminho, planeta e treinamento de técnicas.

### Parte 7 — Preparação na Terra, Nappa e Vegeta

Entregas:

- Três fases de preparação na Terra.
- Saibamans e confronto com Nappa usando Piccolo, Gohan e Kuririn.
- Cena de proteção de Gohan e chegada de Goku.
- Expansão de Vegeta, Oozaru e conclusão da saga.

Critérios de conclusão:

- Os três personagens participam de trechos jogáveis contra Nappa.
- Transições de personagem e condições narrativas não dependem de eventos aleatórios.
- A saga termina, permite repetir missões e mantém Freeza bloqueado.

Subdividir em preparação, Saibamans, Nappa e Vegeta.

### Parte 8 — Revisão completa

Entregas:

- Ajustar dificuldade, duração, repetição e distribuição de checkpoints.
- Revisar diálogos, mapas, minimapa, câmera e animações.
- Conferir toda a campanha em sequência e com retomadas de save.
- Atualizar os guias de comandos e documentação para o comportamento final.

Critérios de conclusão:

- Campanha completa jogável do início ao fim, sem bloqueios de progressão.
- Nenhum personagem ou técnica obrigatória inacessível no momento necessário.
- Testes existentes e novos testes relevantes aprovados.
- Limitações restantes documentadas de forma objetiva.

## 12. Estratégia de validação

- Executar os testes pertinentes a cada mudança; rodar a suíte geral ao concluir mudanças de motor, controles ou progressão.
- Testar bloqueios de campanha tanto pela interface quanto pela lógica de início de fase.
- Validar saves novos, antigos e com progresso em Freeza.
- Testar morte, checkpoint, pausa, saída e retorno em cada nova estrutura de missão.
- Testar troca de personagem durante transições, sem carregar estados temporários indevidos.
- Conferir cenas assistidas, puladas e retomadas, garantindo recompensas únicas.
- Validar recortes de sprites pelo carregador real e conferir visualmente as poses renderizadas.
- Conferir teclado, controle e toque nos objetivos que exigirem comandos novos.
- Conferir minimapa em diferentes tamanhos de tela e em deslocamentos aéreos.
- Se a validação visual ou com controle físico não estiver disponível, registrar a limitação sem apresentá-la como teste concluído.

## 13. Riscos e decisões de implementação

| Risco | Tratamento planejado |
| --- | --- |
| Campanha crescer demais de uma vez | Entregas pequenas e jogáveis; arte sob demanda |
| Progresso antigo incompatível | Migração explícita e testes com saves representativos |
| Personagens parecerem iguais | Golpes, alcance, especiais e animações próprios |
| Cenas travarem o jogo | Sequências com estado final único e opção de pular |
| Mapas difíceis de usar no celular | Nós claros, textos curtos e minimapa sem sobreposição aos controles |
| Sprites misturarem proporções e estilo | Referências consistentes e validação em tamanho de jogo |
| Travessia se tornar repetitiva | Alternar obstáculos, exploração, combate e descanso |
| Recompensas e técnicas duplicadas | Desbloqueios idempotentes e preservação de conquistas antigas |
| Alterações afetarem o Versus | Compartilhar apenas dados adequados e executar regressões |

Decisões a fechar na etapa correspondente: nomes finais das missões; composição dos inimigos do Outro Mundo; disposição exata dos checkpoints; texto dos diálogos; custos e atributos dos novos personagens; política detalhada de migração; momentos exatos de alternância entre Terra e Outro Mundo.

Essas decisões não impedem iniciar a Parte 1. Não é necessário gerar todas as artes nem escrever todos os diálogos antes de preparar a campanha.

## 14. Protocolo de trabalho para economizar tokens

1. Ler este documento e o estado registrado da parte em andamento.
2. Inspecionar apenas os arquivos necessários à entrega escolhida.
3. Definir um resultado pequeno e concreto antes de editar.
4. Implementar e validar esse resultado.
5. Atualizar neste arquivo o que foi concluído, os arquivos relevantes, os testes e as pendências.
6. Encerrar com um resumo curto e a próxima parte recomendada.

Evitar reescrever este plano em cada conversa, revisar arquivos sem relação com a tarefa, gerar artes de episódios futuros ou repetir verificações já aprovadas sem uma mudança que justifique.

Uma solicitação para executar uma parte autoriza trabalhar nela. Não avançar automaticamente para todos os episódios: manter a execução por partes conforme o usuário pediu.

## 15. Acompanhamento

- [x] Plano completo reunido neste arquivo.
- [ ] Parte 1 — Bloqueio de Freeza e estrutura da campanha.
- [ ] Parte 2 — Mapa Saiyajin e minimapa.
- [ ] Parte 3 — Personagens jogáveis e troca guiada.
- [ ] Parte 4 — Três fases anteriores a Raditz.
- [ ] Parte 5 — Raditz e cena final.
- [ ] Parte 6 — Caminho da Serpente e Kaioh.
- [ ] Parte 7 — Preparação na Terra, Nappa e Vegeta.
- [ ] Parte 8 — Revisão completa.

Entrega atual: fases 1.1 → 1.2 → 1.3. Próxima parte narrativa: 2.1 — Raditz, batalha em equipe. A entrada pública da campanha bloqueia os confrontos antigos e Freeza; os motores e dados antigos permanecem disponíveis internamente para preservar o Versus e as conquistas. As Partes 2 e 3 ainda têm entregas futuras, incluindo Outro Mundo, Kuririn e Gohan treinado.

### Fase 1.1 — implementação entregue

- [x] Entrada própria no mapa, identificador 1101, sem substituir o capítulo antigo 101.
- [x] Costa ilustrada, Casa do Kame, cápsula, morador e Gohan com novos recursos visuais.
- [x] Quatro objetivos: observar o mirante, ajudar o morador, investigar a cápsula e voltar para Gohan.
- [x] Mini luta 1: sauro da costa, com bote precedido por preparação visível.
- [x] Mini luta 2: raptor ágil e sauro resistente, enfrentados juntos na encosta.
- [x] Três destroços destrutíveis por golpes, rajadas ou especial; perigos de queda de pedras.
- [x] Minimapa da fase, inimigos próximos, objetivo, distância e indicação de investigação.
- [x] Interação por Q, LB ou botão de toque; combate usa o layout já definido.
- [x] Três checkpoints persistidos em chave independente, com restauração de objetivos e encontros anteriores.
- [x] Encerramento encenado com Raditz levando Gohan, diálogo avançável/pulável e conclusão única.
- [x] Repetição da fase e gancho para a fase 1.2, ainda em desenvolvimento.

Arquivos centrais: `dist/arrival-mission.js`, `dist/coastal-creatures.js`, `dist/arrival-view.js`, `dist/arrival.css`; integração em `dist/engine.js`, `dist/game.js` e `dist/index.html`.

Validação: testes de sequência completa com golpes reais, interação sustentada, cenas assistidas/puladas, checkpoints, bloqueio de atalhos, defesa contra criaturas e isolamento dos capítulos antigos. Renders de cenário/minimapa e inspeção no navegador com teclado. Evidências em `output/arrival/`; verificação de renderização em `scripts/check-arrival.mjs`.

Limites desta entrega: Goku é o único personagem controlável nesta fase. Gohan e Raditz participam da encenação; não há batalha de chefe nesta abertura. O mapa mundial ilustrado completo, a troca para Piccolo e as fases 1.2 e 1.3 serão entregas posteriores.

### Registro das entregas

| Parte | Estado | Arquivos principais | Validação | Pendências |
| --- | --- | --- | --- | --- |
| Planejamento | Concluído | `PLANO-SAGA-SAIYAJIN.md` | Revisão do escopo solicitado | Iniciar a Parte 1 quando solicitada |
| Fase 1.1 | Implementada | `arrival-mission.js`, `arrival-view.js`, `coastal-creatures.js`, `arrival.css` | 95 testes aprovados; cenas e recortes renderizados; navegador sem erros capturados, teclado, retomada e layouts desktop/celular conferidos | Fase 1.2, bloqueio de Freeza e expansão global do mapa |

Atualizar esta tabela ao concluir cada entrega, mantendo este documento como referência única do plano.

### Fases 1.2 e 1.3 — entrega de 10/09/2026

- Fase 1102 / 1.2: Piccolo jogável, aliança com Goku, dois confrontos curtos contra criaturas, abertura de rocha na encosta e localização da rota. Golpes com maior alcance, rajada rápida e estreita e Makankosappo com faixa de acerto precisa; nenhuma transformação ou técnica de Kaioh nessa fase.
- Fase 1103 / 1.3: aproximação com Goku, abertura do ponto de apoio com Piccolo, trecho delimitado de Gohan dentro de uma representação em corte da cápsula e retorno a Goku para preparar a batalha. Gohan só caminha e se protege; não voa nem executa combos ou especiais. Sua energia aparece involuntariamente após três segundos de proteção; seis segundos concluem o objetivo.
- Trocas guiadas restauram vida e KI conforme o personagem e limpam ataques, projéteis, defesa, perseguição, efeitos e comandos pendentes. As criaturas já vencidas e as rochas removidas são reconstruídas ao retomar cada checkpoint.
- Objetivos, alturas, seta, distância e minimapa derivam da missão ativa. Aliados aparecem na aproximação, sem atacar ou concluir objetivos pelo jogador.
- Sequência pública: 1.1 → 1.2 → 1.3 → 2.1 em breve. Treinos antigos e capítulos 101–103 / 201–204 não iniciam por `CampaignEngine.start`, mesmo com save avançado. O Versus mantém os personagens e arenas existentes.
- Save adicional `sevenki-episode-one-v1`: checkpoints, tempo e conclusões independentes. Nenhuma chave antiga é removida ou regravada pela expansão. Quem já concluiu o antigo Raditz pode acessar 1.2 e 1.3 para replay; jogadores novos seguem os pré-requisitos. Repetir fases não concede pontos de habilidade duplicados.
- HUD com arte raster própria em pixel art, moldura de esferas/Nimbus/escamas verdes em fundo claro. Tipografia VT323 hospedada localmente com licença OFL; textos de instrução continuam abaixo do campo de combate.

Arquivos: `episode-campaign.js`, `episode-engine.js`, `episode-view.js`, `dragon-pixel.css`, integração em `game.js`, `world-guidance.js`, `saga-map-view.js`, `engine.js` e `index.html`. Artes: `assets/dragon-hud-v26.png`, `assets/piccolo-v26.png`, `assets/gohan-child-v26.png`. Especificações da geração em `assets/episode-art-v26.md`.

Validação: 108 testes aprovados, incluindo as novas sequências com ataques reais, especial nas rochas, confinamento de Gohan, checkpoints, bloqueio de campanha, preservação de saves e cenas assistidas/puladas. Carregador real de atlas validou 12 poses de Piccolo e seis de Gohan; imagens conferidas em `output/episode/`, geradas por `scripts/check-episode-art.mjs`. Alterações simples de texto/CSS não receberam testes automatizados adicionais, conforme preferência do usuário.

Limites: navegador e controle físico indisponíveis nesta sessão; layout final desktop/celular ainda precisa de conferência no navegador. Cenários da travessia reutilizam o vale existente. A encenação usa diálogos com poses e posicionamento dos personagens; cenas cinematográficas completas e a intervenção ofensiva de Gohan pertencem à fase 2.1. Não há luta contra Raditz nem resgate concluído nesta entrega. Não avançar para Nappa, Vegeta ou Freeza automaticamente.

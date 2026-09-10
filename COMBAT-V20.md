# Combate V20

- Os sete capítulos usam ordens distintas de duelos, duplas, grupos e entradas aéreas. Todos os inimigos e portadores das sete esferas permanecem na progressão.
- Adversários arremessados quebram rochas. Finalizações e quedas fortes deixam crateras que somem em três segundos, limitadas a oito. Aterrissagens geram poeira breve.
- Carregar KI tem 0,3 s de preparação. Receber um golpe durante a carga perde 8 KI e bloqueia nova carga por 0,6 s. Inimigos próximos reagem após 0,4 s de carga; afastá-los compra tempo.
- Kaioken exige 60 KI, consome 15 na ativação e drena energia conforme multiplicador e desgaste. Atacar acumula desgaste mais rápido. Não carrega KI durante a forma; T/R3 encerra antecipadamente, seguido de três segundos de recuperação. Multiplicadores altos mantêm o desgaste de vida sem auto-KO.
- Freeza usa um atlas próprio de 24 poses na campanha e no Versus. A CPU alterna raio rápido (preparação de 0,5 s) e esfera lenta (1,05 s), além da sequência de elevação, ataque aéreo e finalização. No Versus, os especiais do jogador alternam raio e esfera.

Arte: `dist/assets/freeza-v20.png`, gerada pela ferramenta integrada de imagens. Prompt em `output/imagegen/freeza-v20-prompt.txt`. A ferramenta não informa nem permite selecionar o identificador do modelo. O atlas anterior foi preservado.

Verificação: `npm.cmd test`; `node tests/freeza-sprite-check.mjs`. A segunda tarefa renderiza os 24 recortes em `output/freeza-sprite-check.png`.

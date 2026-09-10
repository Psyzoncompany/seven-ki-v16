# VERSUS

No menu principal, escolha **VERSUS**. Selecione seu personagem e o adversário controlado pela CPU, escolha Vale da Terra ou Namekusei e pressione **COMEÇAR COMBATE**.

São 21 lutadores e formas com sprites de combate já existentes: Goku, Goku Kaioken, Raditz, Nappa, Vegeta, Oozaru, Saibaman, Soldado de Freeza, Dodoria, Zarbon, Recoome, Capitão Ginyu, Freeza, Saiyajin assaltante, Saiyajin artilheira, Razek, Kai, Kai Solar, Vigia, Artilheiro e Guardião do vale. Todos estão liberados nos dois lados, inclusive para confrontos espelhados.

- Uma luta contra a CPU, encerrada por nocaute. Cada lado começa com 300 de vida.
- O golpe decisivo termina em câmera lenta (16% da velocidade por 1,65 s), com VITÓRIA ou DERROTA antes das opções de revanche. Não há novos ataques durante essa sequência; a pausa também interrompe a finalização.
- Usa os comandos de movimento, combo, defesa e recuperação existentes. O especial custa 40 KI; o tipo varia entre feixe, disparo duplo e explosão de proximidade.
- As formas são selecionadas antes da luta. As animações usam os quadros disponíveis em cada atlas; os inimigos possuem seis poses básicas.
- **REVANCHE** repete o confronto; **TROCAR PERSONAGENS** volta à seleção. **INVERTER** troca os lados e **SORTEAR** escolhe um par aleatório.
- No Xbox, cima/baixo navega nos campos e botões; esquerda/direita troca a opção do campo selecionado. A confirma e B volta. No teclado, use Tab, setas e Enter; Esc volta.
- A câmera aproxima no corpo a corpo e afasta nas perseguições, enquadrando as duas silhuetas e a diferença de altura. HUD e controles mobile ficam fora da transformação da câmera. Os marcadores VOCÊ e CPU distinguem confrontos com personagens iguais.
- Goku e Kaioken usam proporções e pontos de apoio equivalentes por pose, com transições de voo, flutuação, frenagem, carga, guarda e dano. Kaioken mantém seu próprio atlas durante os combos.
- Raditz recua depois de sequências curtas e pode escapar de cantos; Nappa mantém preparações longas e resistência, com perseguição aérea mais lenta; Vegeta pune recuperações e combina fintas, guarda e contra-ataques. Sinais visuais de movimento e preparação reforçam cada estilo.

VERSUS não concede pontos, esferas, desbloqueios ou recordes nas sagas. Os personagens que só aparecem em retratos de diálogo não têm animações de combate e não integram esta seleção.

Verificação: `npm test` cobre 441 combinações, nocaute, derrota, revanche, especiais, atividade de cada CPU, limites da arena e retorno à campanha. Fluxos de seleção, vitória/derrota e revanche também foram inspecionados no navegador em desktop e em largura de celular.

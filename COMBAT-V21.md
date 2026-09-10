# Combate V21

- Versus em melhor de três: dois rounds vencidos encerram a partida. Cada KO mantém câmera lenta e VITÓRIA/DERROTA; após 1,65 s de finalização e 1,5 s de intervalo, o próximo round restaura vida, KI, guarda e posições. Pausa também suspende o intervalo. Placar permanece visível no desktop e mobile.
- Bloqueio azul, aparo ciano, quebra de guarda em fragmentos e contra-ataque magenta, com textos de curta duração junto ao contato.
- Sprites PNG geradas substituem desenhos geométricos de rochas, crateras, armadilhas, impactos principais, projéteis e feixes. HUD e indicadores auxiliares continuam desenhados por código.
- Novo atlas de 18 poses para Raditz, Nappa e Vegeta. Transições de inclinação e suspensão suavizadas para inimigos. Freeza mantém o atlas V20; os demais personagens conservam seus atlas existentes.

## Imagens

Geradas pela ferramenta integrada, sem seleção do identificador do modelo:

- `dist/assets/combat-world-v21.png`: 16 elementos de cenário e efeitos.
- `dist/assets/saiyan-bosses-v21.png`: 18 poses dos três chefes Saiyajins.
- Prompts: `output/imagegen/combat-v21-prompts.txt`.

## Sons baixados

- `dist/assets/audio/heavy-punch.mp3`: [Dragon Ball Z Heavy Punch — Quick Sounds](https://quicksounds.com/library/sounds/punch), arquivo disponibilizado em https://quicksounds.com/uploads/tracks/821467505_687249639_1624584705.mp3.
- `dist/assets/audio/teleport.wav`: `shunkanido.wav` do [arquivo Dragon-ball-z.eu](https://www.dragon-ball-z.eu/tmp/sounds/).
- `dist/assets/audio/kame-short.wav`: `kame1.wav` da mesma fonte. `kame.wav` é a variante longa preservada para referência e não usada em execução.

As fontes apresentam os clipes como efeitos de Dragon Ball; a origem oficial e uma licença de redistribuição não foram confirmadas. Os arquivos foram baixados para o projeto local, sem publicação externa. Golpes leves usam trecho mais curto, menor volume e maior velocidade do soco; os pesados mantêm maior duração. Defesa, aparo e quebra têm sons sintetizados distintos. Reprodução limitada a oito vozes, com fade no corte e fallback sintetizado se o carregamento falhar.

## Verificação

`npm.cmd test` inclui partidas 2–0 e 2–1, pausa no intervalo, reset de recursos e placar. `node tests/boss-sprite-atlas-check.mjs` confere e renderiza os 18 recortes. Navegador: carregamento e decodificação dos três sons, KO do primeiro round, avanço para o segundo e aparo em tela mobile.

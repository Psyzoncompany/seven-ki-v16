# Combate da Saga Saiyajin

Aplicado aos capítulos 101–103. O guia dentro do jogo também descreve os comandos.

- **Chute giratório:** K / RAJADA / Y após o segundo ataque. Sem custo de KI, afasta o inimigo e encerra a pressão; recuperação de 23 quadros. Ainda permite cancelar um acerto em Kamehameha.
- **Elevar:** R ou cima + J; no Xbox, cima + X. Consome 14 KI na execução, lança inclusive chefes humanoides e permite continuar no ar. Expõe o jogador e usa energia necessária para fugir. Oozaru não pode ser lançado.
- **Kamehameha:** L / ESPECIAL / LT + Y. Custa 40 KI (32 com treinamento), causa dano alto e tem alcance. Cancelamento de combo exige acerto e janela válida. Preparação de 260 ms e recuperação até 850 ms sem invulnerabilidade automática.
- **Bloqueio:** I / DEFESA / B. Imediato, inclusive ao interromper um golpe. Aparo nos primeiros 85 ms (120 ms com treinamento); intervalo mínimo de 450 ms entre aparos. Guarda prolongada sofre desgaste.
- **Teleporte defensivo:** I + V ou DEFESA + ESQUIVA; no Xbox B + direção. Use nos últimos 140 ms da preparação de um inimigo próximo ou antes de uma rajada chegar. Custa 20 KI, inclusive se executado cedo demais; recarga de 1,4 s.
- **Recuperação durante combo:** depois de 55 ms de impacto, pressione novamente DEFESA ou ESQUIVA no chão; no ar use ESQUIVA ou PULO. Custa 25 KI mais fôlego. Contra-explosão com GOLPE custa 30 KI e 30 de fôlego. Todas compartilham recarga de 2 s. Segurar defesa não ativa fugas sucessivas.

Raditz corre a 345 unidades/s, evita curta distância e usa sequências curtas e rápidas. Nappa avança a 135 unidades/s, reduz o dano recebido em 22%, resiste a golpes leves durante preparação, prepara ataques pesados por 480 ms e fica vulnerável por 650 ms após a sequência. Sua quebra de combo não teleporta. Vegeta usa pressão longa, fintas visíveis que viram guarda e contra-ataques; fintas têm recarga de 3 s.

Arte: `dist/assets/saiyan-bosses-v17.png`, 18 poses geradas com a ferramenta integrada de imagens do ChatGPT. A ferramenta não expõe seleção/confirmação do modelo “image2.5”. Prompt completo em `output/imagegen/saiyan-bosses-v17-prompt.txt`.

Validação: `npm test`, `node tests/boss-sprite-atlas-check.mjs`, `npm run check:sprites` e inspeção no navegador. O balanceamento competitivo ainda depende de partidas humanas.

# Instruções do projeto Seven Ki

## Regras para economizar tokens

- NÃO execute a suíte completa de testes após cada alteração.
- Faça apenas testes diretamente relacionados ao arquivo ou funcionalidade modificada.
- NÃO repita testes que já passaram, a menos que uma nova alteração possa afetá-los.
- Durante desenvolvimento visual, sprites, animações, HUD e mapas, não execute testes automatizados completos.
- Não execute build completo após pequenas alterações.
- Execute lint, typecheck ou build somente quando realmente necessário.
- Ao encontrar um erro, corrija primeiro e teste somente a área afetada.
- Evite analisar novamente arquivos que não foram modificados.
- Leia somente os arquivos necessários para realizar a tarefa.
- Não faça refatorações extras sem serem solicitadas.
- Seja conciso nas explicações e logs.
- Antes de finalizar uma grande atualização, execute uma validação geral uma única vez.

## Economia de tokens

Trabalhe apenas nos arquivos necessários. Não rode testes completos, build completo ou análises repetitivas durante cada alteração. Faça testes focados e deixe a validação geral apenas para o final.

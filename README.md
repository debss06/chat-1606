# Court Intelligence 2.0 — base reconstruída

## Publicação no GitHub Pages
1. Extraia este ZIP.
2. Envie `index.html`, `styles.css`, `app.js` e `README.md` para a raiz do repositório (branch `main`).
3. Em Settings → Pages, selecione Deploy from a branch, branch `main`, pasta `/ (root)`.
4. Abra o endereço publicado.

## Incluído
- Interface responsiva com Agenda, Pré-jogo, Escalações, Ao vivo, Projeções e Histórico.
- Agenda/placar via endpoint público não oficial da ESPN.
- Exibição de horários com `America/Sao_Paulo`.
- Atualização da agenda a cada 20 segundos enquanto a página estiver aberta.
- Consulta de resumo/lesões quando a ESPN fornece os dados.
- Calculadora baseline transparente e histórico local no navegador.

## Limitações reais
- A ESPN pode alterar, limitar ou bloquear seus endpoints; não há SLA público. Se falhar, o site mostra indisponibilidade.
- Escalações confirmadas, lesões, métricas avançadas, game logs completos e splits não são garantidos pela resposta pública.
- A calculadora é uma baseline ponderada (50% temporada, 30% últimos 10, 20% últimos 5) ajustada por minutos e fator manual. Não é um modelo treinado, não gera probabilidades calibradas e não deve ser tratada como recomendação de aposta.
- O histórico é local ao navegador e não sincroniza.
- Atualização em primeiro plano não é push notification. Push com app fechado exige service worker, servidor de envio e chaves/assinaturas push.
- Não há ainda backtest automático, banco de dados, contas, modelo de machine learning nem análise automática completa de todos os jogadores.

## Próximas etapas necessárias para o produto completo
1. Contratar/selecionar fonte confiável de estatísticas e game logs, respeitando termos e limites.
2. Criar backend seguro para coleta, cache, atualização e push.
3. Modelar minutos e rotação separadamente da produção estatística.
4. Incorporar ritmo, defesa por posição, mando, descanso, lesões e uso ofensivo.
5. Estimar distribuições e calibrar probabilidades com validação fora da amostra.
6. Salvar previsões pré-jogo e resultados para medir MAE, RMSE, Brier Score e calibração.

Este ZIP é uma base funcional para continuar o desenvolvimento, não a implementação final de todas as funcionalidades planejadas.


## Atualização 2.1 — Centro de jogadores e precisão individual
- Nova aba **Jogadores**: escolha uma partida e tente carregar os elencos dos dois times.
- Cards com foto quando a fonte ESPN disponibiliza, nome e posição; toque para abrir o perfil.
- Busca filtra os jogadores dos elencos carregados.
- Perfil permite registrar previsão, mercado, lado over/under e linha.
- Na aba Histórico, registre o resultado real após a partida.
- O sistema calcula acertos/total por jogador e mercado de forma local. Exemplo: 5 acertos em 5 análises avaliadas.
- Registros aguardando resultado não entram no percentual de acerto.
- O resultado é avaliado contra a linha: over ganha se o resultado real for maior; under ganha se for menor. Igualar a linha é considerado não acerto nesta versão.
- A busca/roster/perfil depende da disponibilidade dos endpoints ESPN; fotos e estatísticas podem não vir em todos os casos.


## Atualização 2.2 — Jogadores dentro de cada partida
- Cada card da Agenda agora tem a ação **Jogadores**, que abre os elencos dos dois times daquela partida.
- O perfil do atleta mostra o adversário, horário do jogo e projeções separadas de pontos, rebotes e assistências.
- Quando os endpoints ESPN retornam os dados, o cálculo combina temporada (40%), últimos 10 (25%), últimos 5 (20%) e histórico contra o adversário (15%, somente com pelo menos dois confrontos).
- Cada previsão salva fica vinculada ao ID da partida e ao adversário, permitindo avaliar o resultado daquele confronto.
- A integração tenta consultar game logs do atleta. Como o formato e a disponibilidade dos endpoints públicos da ESPN variam, a tela informa quando a amostra não foi recebida.
- **Limitação importante:** ainda não existe uma métrica validada de defesa adversária por posição, pace projetado, minutos/rotação esperados ou disponibilidade em tempo real integrada ao modelo. Por isso, esta versão não afirma que um confronto é fácil/difícil quando não há dados verificáveis e não aplica fatores artificiais. Para alcançar o modelo completo descrito, será necessário integrar uma fonte estatística consistente e um backend para normalização, cache e validação histórica.


## Atualização 2.3 — Acesso aos jogadores e leitura pré-jogo automática
- Ao abrir a aba **Jogadores**, o app carrega automaticamente os elencos da partida selecionada. Também é possível trocar a partida pelo seletor ou usar o botão de recarga.
- O botão **Jogadores** de cada card da Agenda continua abrindo diretamente o elenco do confronto correspondente.
- A leitura dos elencos agora aceita diferentes formatos de resposta da ESPN, tenta uma segunda rota pública quando necessário e trata falhas por equipe sem esconder o elenco do outro time.
- A seleção da partida é preservada durante as atualizações da agenda, evitando que o app volte silenciosamente para outro confronto.
- Ao abrir o perfil de um atleta, as estimativas iniciais de pontos, rebotes e assistências são calculadas automaticamente com a média de temporada disponível e minutos de referência; não é mais necessário clicar primeiro em “Recalcular pelo contexto”. Os controles de papel, matchup e ritmo continuam editáveis.
- Se a ESPN não entregar os dados, a interface informa a indisponibilidade em vez de criar jogadores ou estatísticas fictícias.
- As estimativas contextuais continuam experimentais: os fatores de papel, ritmo e matchup ainda não são sinais automatizados validados nem probabilidades calibradas.


## Atualização 3.1 — Faixas dinâmicas de pontos, rebotes e assistências
- O perfil individual agora apresenta marcas dinâmicas para pontos, rebotes e assistências, calculadas a partir da distribuição dos últimos jogos recebidos.
- As marcas não ficam presas a valores fixos como 5, 7 ou 10: são selecionadas a partir dos quantis da amostra de cada jogador e mercado.
- Cada marca mostra quantos jogos atingiram aquele resultado e a frequência observada: alta (70% ou mais), média (40% a 69%) ou baixa (abaixo de 40%).
- São necessários pelo menos cinco jogos válidos para classificar uma marca. Com amostra menor, o app informa que não há dados suficientes.
- As frequências são descritivas do histórico recente e não são probabilidades calibradas nem garantias para a próxima partida.
- Valores ausentes nos game logs deixam de ser convertidos artificialmente em zero.


## Atualização 3.2 — Projeções mais conservadoras e auditoria de erros
- Motor de projeção individual revisado: temporada 50%, últimos 10 jogos 30% e últimos 5 jogos 20%, com redistribuição dos pesos quando uma fonte não entrega algum dado.
- Ajuste proporcional aos minutos esperados; removidos os multiplicadores arbitrários de papel, ritmo e matchup que poderiam inflar ou reduzir projeções sem evidência. Esses fatores só devem entrar quando houver dados objetivos integrados.
- Exibição de volatilidade (desvio-padrão), quantidade de jogos válidos e indicação de tamanho da amostra para cada mercado.
- Histórico permite inserir o resultado real de cada previsão, calcular erro absoluto médio e taxa de acerto das linhas over/under.
- Correção conservadora de viés por atleta/mercado: após pelo menos 3 previsões avaliadas, o motor usa parte do erro médio histórico para corrigir projeções futuras. A correção é reduzida (shrinkage) para limitar sobreajuste.
- Histórico continua salvo apenas no navegador/dispositivo via localStorage; não sincroniza entre aparelhos e pode ser perdido ao limpar os dados do navegador.
- A correção histórica não é machine learning nem garante melhora; é uma calibração simples e auditável. O sistema precisa acumular previsões feitas antes dos jogos e resultados reais para ser validado.

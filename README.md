# Luan Verso Labirinto do Portal — Labirinto das Quatro Alavancas

Jogo web responsivo feito com HTML, CSS e JavaScript. Esta edição foi preparada para computadores Windows/macOS/Linux, celulares Android/iPhone e tablets usando navegadores modernos.

## Executar no computador
1. Extraia o ZIP.
2. Abra `index.html` no Chrome, Edge, Firefox ou Safari atualizado.
3. Selecione **Iniciar a Aventura** ou **Continuar a Aventura**.

## Executar no celular/tablet
- Abra `index.html` num navegador compatível; use os controles na tela.
- Para instalar como aplicativo (PWA), publique a pasta inteira num site HTTPS e abra o endereço no navegador do aparelho. No Android, use **Instalar app/Adicionar à tela inicial**. No iPhone/iPad, use **Compartilhar → Adicionar à Tela de Início**.
- O modo PWA e o funcionamento offline após a primeira visita requerem HTTPS ou `localhost`; abrir um arquivo local não permite registrar o service worker.

## Controles
- Computador: WASD ou setas para mover; `E`/`Enter` para interagir; `R` para reiniciar.
- Celular/tablet: mantenha o dedo pressionado nas setas direcionais para caminhar; solte para parar. Use o botão de laser quando disponível. A pausa pode ser acionada pelo controle da interface ou pelas teclas compatíveis no computador.
- O layout se adapta a telas estreitas, tablets, orientação retrato/paisagem e áreas seguras de iOS.

## Observações
- O jogo não exige conta nem servidor para jogar localmente.
- O progresso é guardado no armazenamento do navegador e não sincroniza automaticamente entre aparelhos.
- Para instalação como PWA e cache offline, sirva todos os arquivos desta pasta por HTTPS.

## Arquivos
- `index.html`: estrutura da interface.
- `style.css`: visual responsivo.
- `game.js`: lógica do jogo.
- `manifest.webmanifest`: metadados da instalação PWA.
- `service-worker.js`: cache offline para sites servidos por HTTPS/localhost.


## Fase 1 — O Despertar do Espelho
A Fase 1 agora usa um desenho de labirinto determinístico: a primeira aventura mantém os mesmos corredores a cada nova partida. O objetivo é ativar as quatro alavancas nos quadrantes, evitar as aranhas e aproximar-se do Portal no centro para avançar. As fases seguintes continuam com variações de labirinto.


## Famílias de monstros por fase
- Fases 1–3: aranhas.
- Fases 4–6: esqueletos.
- Fases 7–9: múmias.
- Fases 10–12: fantasmas ou amebas.
- Fases 13–15: golens.
- Fases 16–18: monstros aleatórios de diferentes famílias.
- Fases 19–20: vampiros e lobisomens.


## Publicar no GitHub Pages
1. Crie um repositório no GitHub.
2. Envie o conteúdo desta pasta para a raiz do repositório (o arquivo `index.html` deve ficar na raiz).
3. Em **Settings → Pages**, selecione **Deploy from a branch**, escolha a branch principal (`main`) e a pasta `/(root)`.
4. Salve e aguarde o GitHub publicar o site.
5. Se uma versão antiga continuar aparecendo, recarregue a página sem cache ou limpe os dados do site; o nome do cache offline foi atualizado nesta versão.

## Otimização desta versão
- Planos de fundo convertidos de PNG para WebP, mantendo transparência e reduzindo bastante o tamanho dos arquivos.
- Trilhas MP3 reencodificadas a 128 kbps para reduzir o tamanho do repositório e acelerar o envio.
- Service worker atualizado para armazenar os novos fundos e evitar reutilizar o cache antigo.
- Todos os caminhos são relativos, adequados para publicação na raiz de um repositório GitHub Pages.


## Otimização de desempenho em celulares
- O piso e as paredes do labirinto são desenhados uma única vez por fase em uma camada de cache, em vez de redesenhar centenas de blocos com gradientes a cada quadro.
- A resolução interna do canvas é reduzida em telas com toque, preservando o enquadramento e melhorando a fluidez.
- Atualizações de cronômetro e lista de poderes na interface são limitadas a quatro vezes por segundo para reduzir trabalho no navegador.

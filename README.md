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
- Celular/tablet: direcional na tela e botão **INTERAGIR**.
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

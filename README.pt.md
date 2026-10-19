# Nexus fără frontiere

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versão:** 1.2.0 · **Última atualização:** 2026-10-19

Idiomas da interface: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

Centro pessoal de chat com IA num único ficheiro HTML: fala diretamente a partir do navegador com a Anthropic, a OpenAI, a Google ou com um endpoint compatível com a OpenAI. **Não é uma aplicação offline** e as suas chaves ficam no navegador, sem cifragem — leia a secção «Privacidade e rede».

**Aplicação online:** https://chiuta.github.io/Nexus-fara-frontiere/

![Captura de ecrã (conversa de demonstração)](screenshot.png)

## O que é

Um cliente de chat sem servidor próprio: a página não tem backend, não tem contas e não envia telemetria. Introduz as suas próprias chaves API e os pedidos saem diretamente do seu navegador para o fornecedor escolhido. Sem rede e sem chave não pode falar com nenhum modelo.

## Funcionalidades

Verificadas no código e, onde está escrito «teste», num navegador sem interface (Chromium/Playwright) com respostas **simuladas** — não fiz chamadas reais às APIs dos fornecedores.

- Quatro fornecedores: Anthropic (Messages API), OpenAI (Chat Completions), Google (Gemini `generateContent`) e «Personalizado» (qualquer endpoint compatível com a OpenAI: Ollama, LM Studio, OpenRouter, etc.).
- Streaming SSE para a Anthropic e para OpenAI/compatíveis (teste). **A Google não faz streaming**: a resposta aparece inteira, no fim.
- Botão «Parar» (cancela o pedido; o texto parcial permanece, marcado «parado») e interrupção automática após 5 minutos sem qualquer resposta.
- Agentes (personas): Geral, Código, Cowork, Investigação + agentes próprios (nome, prompt de sistema, fornecedor, modelo). **«Código» e «Cowork» são apenas personas**: prompts de sistema sobre os modelos públicos da API, não integrações com os produtos Codex ou Claude Cowork.
- Markdown próprio, mínimo: títulos, listas, negrito/itálico, código inline e blocos de código (com «Copiar»), ligações `http(s)`. Sem tabelas, sem imagens. Qualquer HTML nas respostas é apresentado como texto; as imagens `![](…)` não são carregadas, pelo que uma resposta não pode desencadear pedidos a terceiros (teste com payloads: `<img onerror>`, `javascript:`, HTML em bruto, `<script>`, `<svg onload>`, `<iframe>`).
- Várias conversas em `localStorage`, título editável, eliminação; pesquisa na barra lateral por título e texto (sem distinção de diacríticos e maiúsculas).
- «⇩ MD» guarda a conversa atual como ficheiro Markdown (sem chaves; uma chave que apareça no texto é mascarada); a impressão (Ctrl+P) produz apenas a conversa atual, em fundo branco.
- Exportação/importação JSON (conversas e agentes, **sem chaves**), com saneamento do ficheiro importado.
- Lista de modelos editável e recarregável a partir da API do fornecedor, com a sua chave.
- «Apagar a chave» por fornecedor e «Apagar todos os dados locais».
- Orientação na primeira utilização: o estado vazio assinala a falta da chave API e abre as Definições a partir de um botão; o texto escrito não se perde se faltar a chave.
- Mensagens de erro explícitas para 401, 403, 404, 429 (com `Retry-After` se o fornecedor o expuser), 5xx, erros a meio do stream e rede/CORS/CSP (teste).

## Manual de utilização

1. Abra a página (ou `index.html` localmente) e prima **⚙ Definições**.
2. Leia o aviso no topo e depois cole a chave API do fornecedor pretendido (o botão «mostrar» revela-a). Use uma chave dedicada, com limite de despesa.
3. Prima **Testar a ligação** (faz um pedido mínimo e interrompe-o no primeiro fragmento de texto).
4. Se o nome de modelo sugerido já não existir, prima **Atualizar a lista de modelos** ou escreva diretamente o nome no campo «Modelo».
5. Feche as Definições, prima **+ Nova conversa**, escolha o agente, o fornecedor e o modelo na barra superior e escreva a mensagem (Enter envia, Shift+Enter nova linha).
6. **Parar** interrompe uma resposta em curso.
7. **Exportar** guarda as conversas e os agentes num ficheiro JSON; **Importar** adiciona-os (não substitui) a partir de um ficheiro. Importe apenas ficheiros em que confie: o prompt de um agente importado influencia as respostas do modelo.

## Privacidade e rede

**O que fica no navegador**
- `localStorage`: as conversas, os agentes, as definições e **as chaves API, em claro (sem cifragem)**. Se o `localStorage` estiver bloqueado ou cheio (p. ex. modo privado), a aplicação funciona em memória e avisa-o de que nada é guardado.
- As chaves podem ser lidas por qualquer pessoa com acesso ao perfil do navegador, por extensões maliciosas ou por um eventual XSS. Medidas tomadas: CSP (abaixo), todo o conteúdo das respostas é escapado, a importação é saneada. Não eliminam o risco: não use a aplicação em computadores públicos/partilhados, use chaves dedicadas e revogue-as em caso de dúvida.
- A exportação não contém chaves (verificado; se uma chave guardada aparecer, ainda assim, no texto de uma conversa, é mascarada na exportação). As conversas exportadas podem conter tudo o que escreveu.

**O que sai do navegador e para onde** (apenas quando envia uma mensagem, testa a ligação ou atualiza a lista de modelos)
- Anthropic: `https://api.anthropic.com/v1/messages` e `/v1/models`. A chave vai no cabeçalho `x-api-key`.
- OpenAI: `https://api.openai.com/v1/chat/completions` e `/v1/models`. Cabeçalho `Authorization: Bearer …`.
- Google: `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent` e `/v1beta/models`. A chave vai no cabeçalho `x-goog-api-key` (não no URL).
- Personalizado: o seu URL + `/v1/chat/completions` e `/v1/models`; a chave, se a colocar, vai como Bearer para esse URL. `http://` só é aceite para `localhost`/`127.0.0.1`.
- Com cada mensagem são enviados ao fornecedor: a chave, o prompt de sistema do agente e o histórico da conversa (as últimas 100 mensagens, no máximo ~300 000 carateres; se for truncado, a aplicação avisa-o). Aplicam-se as políticas de dados do fornecedor escolhido.
- Não existem outros anfitriões: nenhuma telemetria, nenhuma CDN, nenhum tipo de letra ou script externo. As ligações nas respostas só se abrem ao clicar (`noopener noreferrer`), e a página pede `referrer: no-referrer`.

**O cabeçalho `anthropic-dangerous-direct-browser-access`**: a API da Anthropic recusa por predefinição as chamadas CORS a partir do navegador, precisamente porque uma chave numa página web é arriscada. O cabeçalho é a confirmação explícita, da sua parte, de que aceita este risco. A aplicação envia-o porque, caso contrário, não consegue falar com a Anthropic a partir de um único ficheiro HTML.

**Content-Security-Policy** (em `<meta>`): os scripts só são permitidos com base no hash do script da página (nenhuma injeção de `<script>` é executada); `connect-src` está limitado às três APIs mais `localhost`/`127.0.0.1` (qualquer porta); sem imagens, tipos de letra, iframes ou formulários externos. Os estilos inline são permitidos (`style-src 'unsafe-inline'`), porque a aplicação gera atributos `style`.

### Endpoint personalizado externo (OpenRouter, DeepSeek, Mistral, etc.)

Com a CSP fornecida, um endpoint personalizado só funciona em `localhost`/`127.0.0.1`. Para um anfitrião externo, a CSP tem de ser relaxada — e isso enfraquece a proteção das chaves (um script injetado poderia enviar as chaves para esse anfitrião, enquanto o script puder ser executado; o hash em `script-src` impede-o, mas a defesa é de uma só camada). Se, ainda assim, o quiser fazer:

1. Transfira `index.html` e abra-o num editor.
2. Na etiqueta `<meta http-equiv="Content-Security-Policy" …>` acrescente o seu anfitrião a `connect-src`, por exemplo `https://openrouter.ai`.
3. **Não modifique nada no bloco `<script>`**: o hash na CSP deixaria de corresponder e a página não arrancaria. Se modificar o script, volte a calcular o hash SHA-256 e substitua-o em `script-src`.
4. Abra o ficheiro localmente (ou publique a sua própria cópia).

Para o Ollama: inicie-o com a variável `OLLAMA_ORIGINS` definida para a origem da página (p. ex. `https://chiuta.github.io`), caso contrário o navegador bloqueia a resposta (CORS). A partir da página publicada por HTTPS, `http://localhost` é permitido pelos navegadores como exceção; um endereço de rede local `http://192.168.x.x` não é.

## Limites e avisos

- Os nomes dos modelos mudam com frequência. As sugestões da aplicação (Anthropic: `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-5-5`, `claude-fable-5-1`; OpenAI: `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`; Google: `gemini-3.8-flash`, `gemini-3.1-pro-preview`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`) foram verificadas manualmente nas documentações oficiais em 2026-10-08 e podem estar desatualizadas; não garanto a sua disponibilidade para a sua conta, nem as tarifas. Se usou uma versão mais antiga, os modelos guardados nas Definições e em conversas antigas podem já não existir: altere-os.
- Não testei com as APIs reais (usei apenas respostas simuladas). Podem surgir particularidades reais dos fornecedores (CORS em certos endpoints, parâmetros rejeitados por alguns modelos).
- Limite fixo de 4096 tokens de saída na Anthropic. Sem chamadas a ferramentas, sem anexos/imagens, sem pesquisa na web.
- Conversas longas: só são enviadas as últimas mensagens (ver acima); o `localStorage` tem normalmente ~5 MB — ao exceder, recebe um aviso e as conversas deixam de ser guardadas: exporte-as.
- A resposta de um modelo pode estar errada, inventada ou ser inadequada; verifique-a antes de confiar nela. O texto de uma ligação apresentada pode diferir do endereço real (o endereço aparece ao passar o cursor, em `title`).
- Os custos das chamadas são seus; a aplicação não limita a despesa.
- Projeto pessoal, oferecido «tal como está», sem garantias.

## Execução local / offline

Transfira `index.html` e abra-o no navegador. A página arranca sem internet, mas o chat exige rede (ou um modelo local, p. ex. Ollama em `localhost`).

## Histórico / Changelog

### 1.1.0 — 2026-10-14
- Cópia de segurança e etiquetagem de dados (fff-kit).

### 1.0.0 — 12 de outubro de 2026
- A versão e a data da última atualização são apresentadas na aplicação (por baixo do campo de mensagem).

### 11.10.2026 (terceira atualização) — 11 de outubro de 2026
- Corrigido: se enviasse a primeira mensagem sem chave API (ou sem endpoint/modelo), o texto escrito perdia-se; agora permanece no campo de escrita e a notificação di-lo.
- O estado vazio mostra um passo inicial com um botão «Abrir Definições» enquanto nenhum fornecedor tiver uma chave (ou endpoint) guardada; desaparece depois de acrescentar uma.

### 11.10.2026 (segunda atualização) — 11 de outubro de 2026
- Pesquisa nas conversas (título e texto), exportação da conversa atual para Markdown e estilo de impressão para a conversa.

### 11.10.2026 — 11 de outubro de 2026
- Acessibilidade: um único título h1 na área principal (o da barra lateral estava oculto no telemóvel); verificação axe sem violações a 1280 e 360 px.
- As sugestões de modelos continuam a ser as verificadas em 2026-10-08 (a data aparece na aplicação); não foram reverificadas em 11.10.2026 — verifique a lista nas Definições ou com «Atualizar a lista de modelos».

## Licença

MIT — ver o ficheiro LICENSE.

## Autor

Alexio — Alexandru-Ionuț Chiuță, contacto: alexio@trom.tf

## Resumo

O Nexus fără frontiere é um cliente de chat com IA multifornecedor em romeno, num único ficheiro: Anthropic, OpenAI, Google Gemini ou qualquer endpoint compatível com a OpenAI, chamados diretamente a partir do seu navegador (streaming SSE para a Anthropic e compatíveis com a OpenAI; o Gemini não faz streaming). Não tem servidor nem telemetria, mas não é offline: as mensagens e o histórico vão diretamente para o fornecedor que escolher, e as chaves API são guardadas sem cifragem em localStorage. Uma CSP rigorosa limita as ligações às três APIs mais localhost; os endpoints personalizados externos exigem editar a CSP numa cópia local (documentado). O Markdown é apresentado por um pequeno renderizador com escape (testado contra payloads XSS); a exportação não contém chaves. «Código» e «Cowork» são personas, não integrações. Testado apenas com respostas de API simuladas.

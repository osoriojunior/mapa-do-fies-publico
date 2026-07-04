# Mapa do Fies (dashboard publico)

Site estatico, independente do ProFies IA. Sem backend, sem autenticacao, sem chamadas a nenhum outro sistema do ProFies.

## Arquivos
- `index.html`: pagina unica (HTML/CSS/JS puro)
- `data.json`: dados de Medicina, ja filtrados para "Mostrar para o publico = SIM" (2051 registros desta exportacao)

## Como publicar

### Opcao 1: GitHub Pages
1. Crie um repositorio novo (separado do `profies-ia`), por exemplo `mapa-do-fies-publico`
2. Suba os dois arquivos (`index.html` e `data.json`) na raiz
3. Em Settings > Pages, ative o GitHub Pages na branch `main`, pasta raiz
4. O site fica em `https://SEU-USUARIO.github.io/mapa-do-fies-publico/`
5. Para usar dominio proprio, configure um CNAME em Settings > Pages e aponte o DNS do seu dominio para o GitHub Pages

### Opcao 2: Vercel (projeto separado do profies-ia)
1. Crie um novo projeto na Vercel, sem ligacao com o repositorio do profies-ia
2. Suba os dois arquivos numa pasta `public/` ou na raiz, dependendo da configuracao
3. Aponte o dominio proprio nas configuracoes do projeto

## Como atualizar os dados
Este `data.json` e uma fotografia da planilha no momento da exportacao. Para atualizar:
1. Exporte a planilha novamente como CSV UTF-8
2. Rode o mesmo processo de limpeza (filtrar "Mostrar para o publico = SIM", normalizar UF e nomes de municipio)
3. Substitua o arquivo `data.json` no repositorio

Nao tenho como confirmar, sem mais detalhes seus, se e possivel automatizar essa atualizacao direto a partir do link da planilha ao vivo que voce mencionou. Isso depende de a planilha ter uma opcao de "publicar na web" que gere uma URL publica de exportacao (CSV ou JSON) sem exigir login. Se você tiver esse link, posso montar um script que atualiza o `data.json` automaticamente.

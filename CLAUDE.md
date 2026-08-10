# Site Nutri Thales — notas do projeto

## Arquivo principal
`Nutri Thales.dc.html` é a fonte da verdade do site. Exports autônomos são gerados a partir dele.

## PENDÊNCIA IMPORTANTE — tag do Google Ads
A tag de conversão do Google Ads (**AW-18088365237**, com `gtag_report_conversion`) foi adicionada
manualmente no arquivo que está no servidor (HostGator), **não** dentro do projeto aqui.

Consequência: cada vez que um novo export (`Nutri Thales - Site Completo.html`) é enviado ao servidor,
ele sobrescreve o arquivo e a tag desaparece — o rastreamento de conversão para de funcionar.

**Como resolver de vez:** o usuário deve colar o trecho `<script>` do gtag no chat; ele deve então ser
inserido dentro do `<helmet>` de `Nutri Thales.dc.html`, para que todo export futuro já saia com a tag
embutida. Não alterar a lógica da tag nem o `gtag_report_conversion` — já está testada e funcionando.

## Landing pages
`emagrecimento/`, `hipertrofia/`, `nutricao-esportiva/` — hospedadas via GitHub (`nutrithales/nutri-site`) → Vercel.
Editar aqui e subir ao GitHub para publicar.

## Área do paciente
`Area do Paciente.html` — login via Supabase (projeto `xwihrxinweeadtcouhoo`), lê a tabela `paginas_paciente`
(`user_id`, `titulo`, `url_pagina`) e lista as páginas do paciente após o login.

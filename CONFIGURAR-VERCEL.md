# Agenda Nutri Thales — instalação

Copie as pastas `agenda` e `api` para a raiz do repositório que já está conectado à Vercel.

Em **Vercel > Project > Settings > Environment Variables**, cadastre:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID` (use `primary` para a agenda principal)
- `ADMIN_PASSWORD` (crie uma senha forte para `/agenda/admin/`)

Depois, faça um novo deploy. A página ficará em `/agenda/`.
O painel administrativo ficará em `/agenda/admin/`.

Regras implementadas:

- Segunda e sexta: 08:00–12:00 e 16:00–18:00.
- Quarta: 16:00–18:00.
- Terça e quinta: bloqueadas.
- Primeira consulta e retorno: 90 minutos.
- Avaliação física: 45 minutos.
- Intervalo: 15 minutos.
- Antecedência mínima: 12 horas.
- Lembretes do Google: 24 horas por e-mail e 2 horas por notificação.
- Sem pagamento.

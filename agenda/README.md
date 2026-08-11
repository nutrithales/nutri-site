# Agenda Nutri Thales

Página pública: `/agenda/`

Painel administrativo: `/agenda/admin/`

A integração exige as variáveis de ambiente descritas em `CONFIGURAR-VERCEL.md`.

Para lançar cada novo agendamento automaticamente no perfil do paciente no
painel administrativo, configure também:

- `AGENDA_DASHBOARD_URL`: URL pública do projeto `nutrithales/admin`.
- `AGENDA_SYNC_SECRET`: segredo compartilhado, idêntico nos dois projetos.

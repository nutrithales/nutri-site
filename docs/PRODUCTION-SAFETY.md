# Produção segura — Nutri Site

## Fronteiras obrigatórias

- `www.nutrithales.com.br` e `nutrithales.com.br`: site público e Área do Paciente.
- `www.nutrithales.com.br/paciente`: autenticação e home do paciente.
- `www.nutrithales.com.br/paciente/treinos`: dashboard universal de treinos.
- `admin.nutrithales.com.br`: **não pertence a este fluxo de paciente** e nunca deve ser usado como destino de links públicos.

## Regra de mudança

1. Criar branch a partir de `main`.
2. Fazer a menor alteração possível.
3. Abrir Pull Request.
4. Aguardar `Production Safety / Preflight build and isolation` passar.
5. Validar o Preview Deployment da Vercel quando a mudança for visual ou funcional.
6. Só então fazer merge em `main`.
7. Após o merge, conferir `Production Safety / Production smoke test`.

## Checkpoint estável

Checkpoint criado em 18/08/2026:

`checkpoint/2026-08-18-stable`

Esse branch representa um ponto de retorno conhecido após a restauração do site público, Área do Paciente e Dashboard de Treinos.

## Rollback

Se produção quebrar:

1. Não continuar aplicando correções diretamente em produção.
2. Confirmar o último deployment `READY` conhecido na Vercel.
3. Restaurar/reativar o deployment estável ou criar branch a partir do checkpoint.
4. Confirmar homepage, `/paciente` e `/paciente/treinos`.
5. Investigar a causa em branch separada.

## Rotas mínimas de saúde

- `https://www.nutrithales.com.br/`
- `https://www.nutrithales.com.br/paciente`
- `https://www.nutrithales.com.br/paciente/treinos`

Todas devem responder sem depender de `admin.nutrithales.com.br`.

## Banco de dados

O código fica versionado no GitHub, mas dados clínicos/operacionais ficam no Supabase. Alterações de schema devem ser feitas por migration e revisadas antes de produção. Mudanças destrutivas exigem backup/exportação antes da execução.

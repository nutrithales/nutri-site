async function waitForQuickLinks() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const loading = document.getElementById('pagesLoading');
    if (!loading || loading.style.display === 'none') break;
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  return {
    list: document.getElementById('pagesList'),
    empty: document.getElementById('pagesEmpty'),
  };
}

async function ensurePatientPlanLink(sessionOverride) {
  try {
    const session = sessionOverride || (await sb.auth.getSession()).data?.session;
    if (!session) return;

    const { data: plano, error } = await sb
      .from('planos_alimentares')
      .select('id')
      .eq('auth_id', session.user.id)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    if (error || !plano) return;

    const { list, empty } = await waitForQuickLinks();
    if (!list) return;

    const target = '/paciente/plano-alimentar';
    const existing = Array.from(list.querySelectorAll('a')).find(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || '').toLowerCase();
      return href.includes('/paciente/plano-alimentar') || text.includes('plano alimentar');
    });

    if (existing) {
      existing.href = target;
      return;
    }

    const link = document.createElement('a');
    link.className = 'quick-link';
    link.href = target;
    link.innerHTML = '<div class="quick-top"><span class="quick-icon">◉</span><span class="quick-arrow">→</span></div><div class="quick-title">Plano Alimentar</div>';
    list.prepend(link);
    if (empty) empty.style.display = 'none';
  } catch (error) {
    console.error('Não foi possível carregar o atalho do plano alimentar.', error);
  }
}

async function ensurePatientTrainingLink(sessionOverride) {
  try {
    const session = sessionOverride || (await sb.auth.getSession()).data?.session;
    if (!session) return;

    const { data: profile, error: profileError } = await sb
      .from('pacientes')
      .select('id,treino_liberado')
      .eq('auth_id', session.user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.treino_liberado) return;

    const { count, error: treinoError } = await sb
      .from('treino_programas')
      .select('id', { count: 'exact', head: true })
      .eq('paciente_id', profile.id)
      .eq('status', 'ativo');

    if (treinoError || !count) return;

    const { list, empty } = await waitForQuickLinks();
    if (!list) return;

    const workoutLinks = Array.from(list.querySelectorAll('a')).filter(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || '').toLowerCase();
      return href.includes('/paciente/treinos') || text.includes('treino');
    });

    if (workoutLinks.length) {
      workoutLinks.forEach(a => {
        a.href = '/paciente/treinos';
      });
      return;
    }

    const link = document.createElement('a');
    link.className = 'quick-link';
    link.href = '/paciente/treinos';
    link.innerHTML = '<div class="quick-top"><span class="quick-icon">↗</span><span class="quick-arrow">→</span></div><div class="quick-title">Treino de Musculação</div>';
    list.prepend(link);
    if (empty) empty.style.display = 'none';
  } catch (error) {
    console.error('Não foi possível carregar o atalho de treino.', error);
  }
}

(async function initPatientLinks() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await Promise.all([
      ensurePatientPlanLink(session),
      ensurePatientTrainingLink(session),
    ]);
  }

  sb.auth.onAuthStateChange((_event, nextSession) => {
    if (!nextSession) return;
    setTimeout(() => {
      void ensurePatientPlanLink(nextSession);
      void ensurePatientTrainingLink(nextSession);
    }, 0);
  });
})();

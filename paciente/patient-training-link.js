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

    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const loading = document.getElementById('pagesLoading');
      if (!loading || loading.style.display === 'none') break;
      await new Promise(resolve => setTimeout(resolve, 80));
    }

    const list = document.getElementById('pagesList');
    const empty = document.getElementById('pagesEmpty');
    if (!list) return;

    const alreadyHasWorkout = Array.from(list.querySelectorAll('a')).some(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || '').toLowerCase();
      return href === '/paciente/treinos' || href.includes('/paciente/treinos/') || text.includes('treino');
    });
    if (alreadyHasWorkout) return;

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

(async function initPatientTrainingLink() {
  await ensurePatientTrainingLink();

  sb.auth.onAuthStateChange((_event, session) => {
    if (!session) return;
    setTimeout(() => {
      void ensurePatientTrainingLink(session);
    }, 0);
  });
})();

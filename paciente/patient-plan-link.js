async function ensurePatientPlanLink(sessionOverride) {
  try {
    const session = sessionOverride || (await sb.auth.getSession()).data?.session;
    if (!session) return;

    const { data: plano, error } = await sb
      .from('planos_alimentares')
      .select('id,titulo,tipo,plano_estruturado_id')
      .eq('auth_id', session.user.id)
      .eq('ativo', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !plano) return;

    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const loading = document.getElementById('pagesLoading');
      if (!loading || loading.style.display === 'none') break;
      await new Promise(resolve => setTimeout(resolve, 80));
    }

    const list = document.getElementById('pagesList');
    const empty = document.getElementById('pagesEmpty');
    if (!list) return;

    const existing = Array.from(list.querySelectorAll('a')).find(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || '').toLowerCase();
      return href.includes('/paciente/plano-alimentar') || text.includes('plano alimentar');
    });
    if (existing) {
      existing.href = '/paciente/plano-alimentar';
      return;
    }

    const link = document.createElement('a');
    link.className = 'quick-link';
    link.href = '/paciente/plano-alimentar';
    link.innerHTML = '<div class="quick-top"><span class="quick-icon">◉</span><span class="quick-arrow">→</span></div><div class="quick-title">Plano Alimentar</div>';
    list.prepend(link);
    if (empty) empty.style.display = 'none';
  } catch (error) {
    console.error('Não foi possível carregar o atalho do plano alimentar.', error);
  }
}

(async function initPatientPlanLink() {
  await ensurePatientPlanLink();
  sb.auth.onAuthStateChange((_event, session) => {
    if (!session) return;
    setTimeout(() => void ensurePatientPlanLink(session), 0);
  });
})();

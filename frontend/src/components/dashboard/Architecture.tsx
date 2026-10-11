import { useQuery } from '@tanstack/react-query';
import { Cloud, ArrowRight, Activity } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
export function Architecture() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => dashboardService.health(signal),
    refetchInterval: 60_000,
    retry: 1,
  });
  return (
    <section id="architecture" className="architecture panel">
      <div className="architecture-intro">
        <span className="eyebrow">
          <Cloud size={16} /> INFRAESTRUTURA GERIDA
        </span>
        <h2>Serverless Architecture</h2>
        <p>
          Da sua acção à persistência dos dados. Cada pedido HTTP activa a lógica do Worker na
          infraestrutura Cloudflare.
        </p>
      </div>
      <div className="architecture-detail">
        <div className="flow">
          {['Utilizador', 'React', 'Worker', 'D1', 'Resposta'].map((label, index) => (
            <span className="flow-item" key={label}>
              <b>{label}</b>
              {index < 4 && <ArrowRight size={14} />}
            </span>
          ))}
        </div>
        <div className="api-status">
          <Activity size={15} />
          <span>
            {health.isPending
              ? 'A verificar API…'
              : health.error
                ? 'API sem ligação'
                : 'API operacional'}
          </span>
          {health.data && !health.error && (
            <span className="latency">{health.data.latency} ms · HTTP no cliente</span>
          )}
          <button
            className="text-button"
            onClick={() => health.refetch()}
            disabled={health.isFetching}
          >
            Verificar
          </button>
        </div>
        <small>Workers executa a API · D1 persiste os dados · HTTP REST liga os componentes</small>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { formatMoney } from '../utils/money';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { Empty, Failure, Loading } from '../components/ui/Feedback';
import { Architecture } from '../components/dashboard/Architecture';
const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [create, setCreate] = useState(false);
  const [yearInput, setYearInput] = useState(String(year));
  const location = useLocation();
  useEffect(() => {
    if (location.hash === '#architecture')
      document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
  }, [location]);
  const query = useQuery({
    queryKey: ['dashboard', year],
    queryFn: async ({ signal }) => {
      const [summary, monthly, categories, recent] = await Promise.all([
        dashboardService.summary(year, signal),
        dashboardService.monthly(year, signal),
        dashboardService.categories(year, signal),
        dashboardService.recent(year, signal),
      ]);
      return { summary, monthly, categories, recent };
    },
  });
  const data = query.data;
  const newButton = (
    <button className="button" onClick={() => setCreate(true)}>
      <Plus size={18} />
      Nova Transacção
    </button>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">O SEU DINHEIRO, EM PERSPECTIVA</div>
          <h1>Dashboard</h1>
          <p>Acompanhe a sua vida financeira num só lugar.</p>
        </div>
        {newButton}
      </div>
      <div className="section-toolbar">
        <div className="section-caption">
          <span className="live-dot" />
          Visão geral <span className="muted">/ {year}</span>
        </div>
        <label className="year-select">
          <CalendarDays size={16} />
          <span className="sr-only">Ano</span>
          <input
            aria-label="Ano"
            type="number"
            min="1900"
            max="9998"
            value={yearInput}
            onBlur={() => setYearInput(String(year))}
            onChange={(e) => {
              setYearInput(e.target.value);
              const y = Number(e.target.value);
              if (e.target.value.length === 4 && y >= 1900 && y <= 9998) setYear(y);
            }}
          />
        </label>
      </div>
      {query.isPending ? (
        <Loading label="A carregar dashboard…" />
      ) : query.error ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : (
        data && (
          <>
            <div className="stat-grid">
              {[
                {
                  label: 'Saldo Total',
                  value: formatMoney(data.summary.balanceCents),
                  hint: 'Receitas menos despesas no ano',
                  icon: Wallet,
                  style: 'balance',
                },
                {
                  label: 'Receitas',
                  value: formatMoney(data.summary.incomeCents),
                  hint: 'Entradas no período seleccionado',
                  icon: ArrowUpRight,
                  style: 'income',
                },
                {
                  label: 'Despesas',
                  value: formatMoney(data.summary.expenseCents),
                  hint: 'Saídas no período seleccionado',
                  icon: ArrowDownLeft,
                  style: 'expense',
                },
                {
                  label: 'Transacções',
                  value: String(data.summary.count).padStart(2, '0'),
                  hint: 'Registos no período seleccionado',
                  icon: ArrowLeftRight,
                  style: 'neutral',
                },
              ].map((card) => (
                <article className={'stat-card ' + card.style} key={card.label}>
                  <div className="stat-top">
                    <span>{card.label}</span>
                    <span className="stat-icon">
                      <card.icon size={19} />
                    </span>
                  </div>
                  <strong>{card.value}</strong>
                  <small>{card.hint}</small>
                </article>
              ))}
            </div>
            <div className="chart-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Evolução financeira</h2>
                    <p>Receitas e despesas, mês a mês</p>
                  </div>
                  <span className="small-tag">{year}</span>
                </div>
                <div className="chart-legend">
                  <span>
                    <i className="income-dot" />
                    Receitas
                  </span>
                  <span>
                    <i className="expense-dot" />
                    Despesas
                  </span>
                </div>
                {data.summary.count === 0 ? (
                  <Empty
                    title="Um novo começo"
                    message="Registe a sua primeira transacção para acompanhar a evolução financeira."
                    action={newButton}
                  />
                ) : (
                  <div
                    className="chart"
                    role="img"
                    aria-label={'Receitas e despesas por mês de ' + year}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.monthly}
                        barGap={5}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#e9edf3" />
                        <XAxis
                          dataKey="month"
                          tickFormatter={(v) => months[Number(String(v).slice(5)) - 1]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          dy={8}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            new Intl.NumberFormat('pt', { notation: 'compact' }).format(
                              Number(v) / 100,
                            )
                          }
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          width={55}
                        />
                        <Tooltip
                          formatter={(value) => formatMoney(Number(value))}
                          labelFormatter={(v) => months[Number(String(v).slice(5)) - 1]}
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            fontSize: 12,
                          }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar
                          isAnimationActive={false}
                          dataKey="incomeCents"
                          name="Receitas"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          isAnimationActive={false}
                          dataKey="expenseCents"
                          name="Despesas"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Despesas por categoria</h2>
                    <p>Para onde vai o seu dinheiro</p>
                  </div>
                </div>
                {data.categories.length === 0 ? (
                  <Empty
                    title="Sem despesas neste ano"
                    message="A distribuição aparece assim que registar uma despesa."
                  />
                ) : (
                  <>
                    <div className="donut-wrap">
                      <div
                        className="donut"
                        role="img"
                        aria-label="Distribuição das despesas por categoria"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              isAnimationActive={false}
                              data={data.categories}
                              dataKey="amountCents"
                              nameKey="name"
                              innerRadius={65}
                              outerRadius={87}
                              paddingAngle={3}
                              stroke="none"
                            >
                              {data.categories.map((c) => (
                                <Cell key={c.categoryId} fill={c.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatMoney(Number(v))} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="donut-center">
                        <small>Total de despesas</small>
                        <strong>{formatMoney(data.summary.expenseCents)}</strong>
                      </div>
                    </div>
                    <div className="category-legend">
                      {data.categories.map((c) => (
                        <div key={c.categoryId}>
                          <span>
                            <i style={{ background: c.color }} />
                            {c.name}
                          </span>
                          <strong>{formatMoney(c.amountCents)}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>
            <section className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h2>Transacções recentes</h2>
                  <p>Os seus últimos movimentos de {year}</p>
                </div>
                <Link
                  className="text-link"
                  to={'/transactions?startDate=' + year + '-01-01&endDate=' + year + '-12-31'}
                >
                  Ver todas <ArrowRight size={16} />
                </Link>
              </div>
              {data.recent.length ? (
                <TransactionTable items={data.recent} />
              ) : (
                <Empty action={newButton} />
              )}
            </section>
          </>
        )
      )}
      <Architecture />
      {create && <TransactionForm onClose={() => setCreate(false)} />}
    </>
  );
}

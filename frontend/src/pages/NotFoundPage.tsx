import { Link } from 'react-router-dom';
import { Empty } from '../components/ui/Feedback';
export function NotFoundPage() {
  return (
    <Empty
      title="Esta página não existe"
      message="Volte ao seu espaço financeiro para continuar."
      action={
        <Link className="button" to="/">
          Voltar ao Dashboard
        </Link>
      }
    />
  );
}

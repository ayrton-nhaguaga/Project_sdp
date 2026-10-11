import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Feedback';
export function DeleteDialog({
  name,
  remove,
  onClose,
}: {
  name: string;
  remove: () => Promise<void>;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: remove,
    onSuccess: async () => {
      await Promise.all(
        ['transactions', 'dashboard', 'categories'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      toast('Registo eliminado.');
      onClose();
    },
    onError: (e) => toast(e.message, true),
  });
  return (
    <Modal title="Eliminar registo?" onClose={onClose} busy={mutation.isPending}>
      <div className="delete-icon">
        <Trash2 />
      </div>
      <p className="delete-copy">
        Tem a certeza de que pretende eliminar <strong>{name}</strong>? Esta acção não pode ser
        desfeita.
      </p>
      {mutation.error && (
        <p role="alert" className="field-error">
          {mutation.error.message}
        </p>
      )}
      <div className="modal-actions">
        <button className="button secondary" disabled={mutation.isPending} onClick={onClose}>
          Cancelar
        </button>
        <button
          className="button danger"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'A eliminar…' : 'Sim, eliminar'}
        </button>
      </div>
    </Modal>
  );
}

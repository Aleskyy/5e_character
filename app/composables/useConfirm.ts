type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
  resolve: ((v: boolean) => void) | null;
};

const defaultState = (): ConfirmState => ({
  open: false, title: "", message: "", confirmLabel: "Confirm", cancelLabel: "Cancel", tone: "danger", resolve: null,
});

export const useConfirm = () => {
  const state = useState<ConfirmState>("confirm-modal", defaultState);

  const confirm = (opts: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
      state.value = { ...defaultState(), ...opts, open: true, resolve };
    });

  const accept = () => {
    state.value.resolve?.(true);
    state.value = defaultState();
  };
  const dismiss = () => {
    state.value.resolve?.(false);
    state.value = defaultState();
  };

  return { state, confirm, accept, dismiss };
};

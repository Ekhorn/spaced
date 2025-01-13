import {
  createContext,
  createSignal,
  useContext,
  type JSXElement,
} from 'solid-js';

type DialogProps = {
  readonly children: JSXElement;
};

const [isOpen, setIsOpen] = createSignal(false);

let dialogRef!: HTMLDialogElement;

function toggleDialog(value: boolean) {
  if (value) {
    dialogRef.showModal();
    setIsOpen(true);
  } else {
    dialogRef.close();
    setIsOpen(false);
  }
}

const handleClose = () => setIsOpen(false);

const DialogContext = createContext({ toggleDialog, isOpen });

export function Dialog(props: DialogProps) {
  return (
    //  eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //  @ts-ignore Ignore since getters and setters are already present
    <DialogContext.Provider>
      <dialog
        open
        id="dialog"
        ref={dialogRef}
        onClose={handleClose}
        class="pointer-events-none z-50 max-h-[898px] min-h-[898px] min-w-[634.9px] max-w-[634.9px] transform flex-col items-center justify-center overflow-y-visible rounded-lg bg-white p-1 align-middle shadow-lg transition-all duration-500 ease-in-out"
      />
      {props.children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  return useContext(DialogContext);
}

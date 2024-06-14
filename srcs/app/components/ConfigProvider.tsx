import { type JSXElement, useContext, createContext } from 'solid-js';

interface ConfigContext {}
const ConfigContext = createContext<ConfigContext>({});

type IPCProps = {
  readonly children: JSXElement;
};

export function ConfigProvider(props: IPCProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <ConfigContext.Provider>
      <dialog
        open
        class="absolute z-[999999] transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
      >
        test
      </dialog>
      {props.children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}

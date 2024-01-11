import { type JSXElement, useContext, createContext } from 'solid-js';

const context = {};
const ConfigContext = createContext(context);

type ConfigProps = {
  readonly children: JSXElement;
};

export function ConfigProvider(props: ConfigProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <ConfigContext.Provider>{props.children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}

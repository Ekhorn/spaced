import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  type Accessor,
  type Context,
  type JSXElement,
  createSignal,
  useContext,
  createContext,
  Show,
  onMount,
} from 'solid-js';

import { useIPC } from './IPCProvider.jsx';
import { isTauri } from '../lib/const.js';

const { socket } = useIPC();

const [isLoggedIn, setIsLoggedIn] = createSignal(false);
const [isRegistration, setIsRegistration] = createSignal(false);

type AuthProps = {
  readonly children: JSXElement;
};

let AuthContext: Context<{
  register: () => void;
  login: () => void;
  logout: () => void;
  isLoggedIn: Accessor<boolean>;
}>;

export function AuthProvider(props: AuthProps) {
  const [token, setToken] = createSignal<{
    access_token: string;
    refresh_token: string;
  }>({
    access_token: localStorage.access_token,
    refresh_token: localStorage.refresh_token,
  });

  function register(username: string, email: string, password: string) {
    axios
      .post('/api/user/register', {
        email,
        username,
        password,
      })
      .then((payload) => {
        setIsLoggedIn(true);
        localStorage.setItem('access_token', payload.data.access_token);
        localStorage.setItem('refresh_token', payload.data.refresh_token);
        setToken(payload.data);
        socket.connect();
      });
  }

  function login(email: string, password: string) {
    axios
      .post('/api/user/login', {
        email,
        password,
      })
      .then((payload) => {
        setIsLoggedIn(true);
        localStorage.setItem('access_token', payload.data.access_token);
        localStorage.setItem('refresh_token', payload.data.refresh_token);
        setToken(payload.data);
        socket.connect();
      });
  }

  function logout() {
    setIsLoggedIn(false);
    delete localStorage.access_token;
    delete localStorage.refresh_token;
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const eventTarget = event.target;
    if (!eventTarget) {
      return;
    }
    const formData = new FormData(eventTarget as HTMLFormElement);
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    if (email && password) {
      isRegistration()
        ? register(
            formData.get('username')?.toString() ?? 'user',
            email,
            password,
          )
        : login(email, password);
    }
  }

  onMount(() => {
    if (!token().access_token || !token().refresh_token) {
      logout();
      setIsLoggedIn(false);
      return;
    }

    setIsLoggedIn(true);
    socket.connect();

    const { exp } = jwtDecode<{ exp: number }>(token().access_token);
    const timeout = exp * 1e3 - 30e3 - Date.now();
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await axios.post<{
          access_token: string;
          refresh_token: string;
        }>('/api/user/refresh', {
          refresh_token: token().refresh_token,
        });
        setIsLoggedIn(true);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
      } catch {
        logout();
      }
    }, timeout);

    return () => {
      clearTimeout(timeoutId);
    };
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  AuthContext = createContext({ register, login, logout, isLoggedIn });

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Ignore since getters and setters are already present
    <AuthContext.Provider>
      <Show when={!isTauri && !isLoggedIn()}>
        <dialog
          open={!isLoggedIn()}
          class="inset-0 z-[9999] flex h-[460px] items-center justify-center rounded"
        >
          <form
            onSubmit={onSubmit}
            class="flex h-full w-96 flex-col overflow-hidden rounded-md p-8 shadow-md"
          >
            <h2 class="mb-4 text-center text-2xl font-bold text-gray-800">
              {isRegistration() ? 'Register' : 'Login to account'}
            </h2>
            <div class="mb-6 flex-grow">
              <label class="mb-2 block font-semibold text-gray-800">
                Email
                <input
                  type="email"
                  name="email"
                  class="w-full rounded border px-3 py-2 outline-none transition-all duration-300 focus:border-blue-500"
                  placeholder="email"
                />
              </label>
              <Show when={isRegistration()}>
                <label class="mb-2 block font-semibold text-gray-800">
                  Username
                  <input
                    type="text"
                    name="username"
                    class="w-full rounded border px-3 py-2 outline-none transition-all duration-300 focus:border-blue-500"
                    placeholder="username"
                  />
                </label>
              </Show>
              <label class="mb-2 block font-semibold text-gray-800">
                Password
                <input
                  type="password"
                  name="password"
                  class="w-full rounded border px-3 py-2 outline-none transition-all duration-300 focus:border-blue-500"
                  placeholder="•••••••••••••"
                />
              </label>
            </div>
            <button
              class="w-full rounded-md bg-blue-500 px-4 py-2 text-white outline-none transition-all duration-300 hover:bg-blue-600"
              type="submit"
            >
              Submit
            </button>
            <div class="mt-6 text-center text-gray-800">
              {isRegistration() ? (
                <p>
                  Already have an account?{' '}
                  <button
                    class="text-blue-500 transition-all duration-300 hover:underline focus:outline-none"
                    onClick={() => setIsRegistration(false)}
                  >
                    Login here
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    class="text-blue-500 transition-all duration-300 hover:underline focus:outline-none"
                    onClick={() => setIsRegistration(true)}
                  >
                    Register here
                  </button>
                </p>
              )}
            </div>
          </form>
        </dialog>
      </Show>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { type Component, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';

export interface RedirectProps {
  href: string;
  replace?: boolean;
  state?: unknown;
}

export const Redirect: Component<RedirectProps> = (props) => {
  const navigate = useNavigate();

  onMount(() => {
    void navigate(props.href, { replace: props.replace ?? false });
  });

  return null;
};

export default Redirect;

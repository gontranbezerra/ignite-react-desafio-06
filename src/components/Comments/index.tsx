import { MutableRefObject, useEffect, useRef } from 'react';

export default function Comments(): JSX.Element {
  const commentBox: MutableRefObject<HTMLDivElement> = useRef();

  useEffect(() => {
    const scriptEl: HTMLScriptElement = document.createElement('script');

    scriptEl.setAttribute('src', 'https://utteranc.es/client.js');
    scriptEl.setAttribute('crossorigin', 'anonymous');
    scriptEl.setAttribute('async', 'true');
    scriptEl.setAttribute('repo', 'gontranbezerra/ignite-react-desafio-06');
    scriptEl.setAttribute('issue-term', 'pathname');
    scriptEl.setAttribute('theme', 'github-dark');
    commentBox.current.appendChild(scriptEl);
  }, []);

  return <div ref={commentBox} className="commentBox" />;
}

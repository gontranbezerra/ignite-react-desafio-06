import { AppProps } from 'next/app';

import Header from '../components/Header';

import '../styles/globals.scss';

function MyApp(props: AppProps): JSX.Element {
  const { Component, pageProps } = props;

  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

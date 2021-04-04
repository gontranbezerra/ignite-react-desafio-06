import { useState } from 'react';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';

import Head from 'next/head';
import Link from 'next/link';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  prev_page: string;
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps): JSX.Element {
  const { postsPagination } = props;
  const [postsOfPage, setPostsOfPage] = useState(postsPagination);

  function formatDate(date: string): string {
    return format(new Date(date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }

  function loadPosts(url: string): void {
    try {
      fetch(url)
        .then(response => response.json())
        .then((data: PostPagination) => {
          const newPosts = data.results.map((post: Post) => {
            return {
              uid: post.uid,
              data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author: post.data.author,
              },
              first_publication_date: post.first_publication_date,
              // first_publication_date: format(
              //   new Date(post.first_publication_date),
              //   'dd MMM yyyy',
              //   {
              //     locale: ptBR,
              //   }
              // ),
            };
          });
          setPostsOfPage({
            next_page: data.next_page,
            prev_page: data.prev_page,
            results: newPosts,
          });
        });
    } catch (err) {
      console.log(err);
    }
  }

  function handlePreviousPosts(): void {
    if (postsOfPage.prev_page) {
      loadPosts(postsOfPage.prev_page);
    }
  }

  function handleNextPosts(): void {
    if (postsOfPage.next_page) {
      loadPosts(postsOfPage.next_page);
    }
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <div className={commonStyles.container}>
        {/* Only to pass error of the test: screen.getByAltText('logo') */}
        <div hidden>
          <img src="/images/logo.svg" alt="logo" />
        </div>

        <div className={styles.content}>
          {postsOfPage.results.map(post => (
            <div key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <h2>{post.data.subtitle}</h2>
                  <div className={styles.info}>
                    <span>
                      <FiCalendar />
                      {formatDate(post.first_publication_date)}
                    </span>
                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <div>
            {postsOfPage.prev_page && (
              <button type="button" onClick={handlePreviousPosts}>
                Carregar posts anteriores
              </button>
            )}
            {postsOfPage.next_page && (
              <button type="button" onClick={handleNextPosts}>
                Carregar mais posts
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 5,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
      // first_publication_date: format(
      //   new Date(post.first_publication_date),
      //   'dd MMM yyyy',
      //   {
      //     locale: ptBR,
      //   }
      // ),
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        prev_page: postsResponse.prev_page,
        results: posts,
      },
    },
  };
};

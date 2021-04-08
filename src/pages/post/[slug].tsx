import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

import Head from 'next/head';
import Link from 'next/link';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';

import Comments from '../../components/Comments';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface ContentProps {
  heading: string;
  body: {
    text: string;
  }[];
}
interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: ContentProps[];
  };
  previousData: {
    uid?: string;
    title: string;
  } | null;
  nextData: {
    uid?: string;
    title: string;
  } | null;
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post(props: PostProps): JSX.Element {
  const { post, preview } = props;
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function formatDate(date: string, isDetailed = false): string {
    if (isDetailed) {
      return format(new Date(date), "dd MMM yyyy ', às ' HH:mm", {
        locale: ptBR,
      });
    }

    return format(new Date(date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }

  function calculateReadTime(): string {
    const headingTexts = post.data.content
      .map(el => el.heading)
      .reduce((acc, cur) => `${acc} ${cur}`)
      .replace(',', '')
      .split(' ');

    const bodyTexts = post.data.content
      .map(el => RichText.asText(el.body))
      .reduce((acc, cur) => `${acc} ${cur}`)
      .replace(/,|\./g, '')
      .split(' ');

    const totalOfWords = headingTexts.length + bodyTexts.length;

    return `${Math.ceil(totalOfWords / 200)} min`;
  }

  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>
      <div className={commonStyles.container}>
        {/* Only to pass error of the test: screen.getByAltText('logo') */}
        <div hidden>
          <img src="/images/logo.svg" alt="logo" />
        </div>

        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="" />
        </div>

        <div className={styles.contentContainer}>
          <main>
            <section>
              <h1>{post.data.title}</h1>
              <div className={styles.info}>
                <span>
                  <FiCalendar />
                  {formatDate(post.first_publication_date)}
                </span>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
                <span>
                  <FiClock />
                  {calculateReadTime()}
                </span>
              </div>

              {post.last_publication_date !== post.first_publication_date && (
                <div>
                  * editado em {formatDate(post.last_publication_date, true)}
                </div>
              )}

              <div className={styles.content}>
                {post.data.content.map((content: ContentProps) => {
                  const bodyContent = RichText.asHtml(content.body);

                  return (
                    <div key={content.heading}>
                      <h1>{content.heading}</h1>
                      <div
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: bodyContent }}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          </main>
          <footer>
            <div className={styles.navigation}>
              <div className={styles.previousPost}>
                {post.previousData && (
                  <>
                    <span>{post.previousData.title}</span>
                    <Link href={`/post/${post.previousData.uid}`}>
                      <a>
                        <span>Post anterior</span>
                      </a>
                    </Link>
                  </>
                )}
              </div>
              <div className={styles.nextPost}>
                {post.nextData && (
                  <>
                    <span>{post.nextData.title}</span>
                    <Link href={`/post/${post.nextData.uid}`}>
                      <a>
                        <span>Próximo post</span>
                      </a>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <Comments />

            {preview && (
              <aside>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
          </footer>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 5,
    }
  );

  const posts = response.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths: posts,
    fallback: true,
  };
};

interface PostResponse {
  id: string;
  uid?: string;
  first_publication_date: string;
  last_publication_date: string;
  data?: {
    title: string;
    subtitle: string;
    author: string;
    banner: {
      url: string;
    };
    content: ContentProps[];
  };
}

export const getStaticProps: GetStaticProps = async context => {
  const { params, preview = false, previewData } = context;
  const { slug } = params;

  const prismic = getPrismicClient();

  const response: PostResponse = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const previousPost = (
    await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  const nextPost = (
    await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  const { title, subtitle, banner, author, content } = response.data;

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: { title, subtitle, banner, author, content },
    previousData: previousPost
      ? { uid: previousPost?.uid, title: previousPost?.data?.title }
      : null,
    nextData: nextPost
      ? { uid: nextPost?.uid, title: nextPost?.data?.title }
      : null,
  };

  return {
    props: {
      post,
      preview,
    },
  };
};

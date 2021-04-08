import { NextApiRequest, NextApiResponse } from 'next';
import { Document } from '@prismicio/client/types/documents';

import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

const Preview = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  // const Preview = async (req, res) => {
  const prismic = getPrismicClient(req);
  const { token: ref, documentId } = req.query;

  const redirectUrl = await prismic
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();
};

export default Preview;

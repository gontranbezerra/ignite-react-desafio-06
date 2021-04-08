import { NextApiResponse } from 'next';

export default async (_: never, res: NextApiResponse): Promise<void> => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};

/**
 * Next.js image loader config
 * @see https://nextjs.org/docs/app/api-reference/components/image#loaderfile
 * @param src Image CDN bucket key
 * @param width Image width parameter
 * @returns {string}
 */
const imgLoader = ({ src, width }) =>
  `${process.env.NEXT_PUBLIC_CDN_URL}/${width && `w@${width}/`}${src}`;

export default imgLoader;

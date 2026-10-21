export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  label: string;
  description: string;
  headline: string;
  overview: string;
  image: string;
  imageAlt: string;
  includes: { title: string; description: string }[];
  audience: string[];
  expectation: string;
  preparation: string[];
  faqs: { question: string; answer: string }[];
  related: string[];
};

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import styles from './index.module.scss';
import "katex/dist/katex.min.css"

const CodeBlock = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1].toLowerCase()}
        PreTag='section'
        {...props}
        children={String(children).replace(/\n$/, '')}
      >
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export const MarkdownRender = (props: any) => {
  return <Markdown
    remarkPlugins={[remarkMath]}
    rehypePlugins={[rehypeMathjax]}
    components={CodeBlock}
    className={styles.markdown}
    {...props}
  />
}
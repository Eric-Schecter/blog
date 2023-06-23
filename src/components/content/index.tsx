import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import posts from '../../posts.json';
import { MarkdownRender } from '../markdown_render';

export const Content = () => {
  const { id } = useParams<{ id: string }>();
  const post = posts[parseInt(id)];
  if(!post){
    return null;
  }

  return <div
    className={styles.content}
  >
      <div
        className={styles.container}
      >
        <div className={styles.title}>{post.title}</div>
        <MarkdownRender children={post.content} />
      </div>
  </div>
};

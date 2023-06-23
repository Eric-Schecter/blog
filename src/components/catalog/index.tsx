import React from 'react';
import styles from './index.module.scss';
import posts from '../../posts.json';
import { Link } from 'react-router-dom';

export const Catalog = () => {
  return <div
    className={styles.content}
  >
    <div className={styles.mainContainer}>
      {posts.map((post, index) =>
        <Link to={`${post.id + index}`}>
          <div
            key={post.id + index}
            className={styles.container}
          >
            <img className={styles.profile} alt='' src={post.profile} />
            <p className={styles.title}>{post.title}</p>
            <p className={styles.title}>{post.date}</p>
          </div>
        </Link>
      )}
    </div>
  </div>
};

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
        <Link key={post.id} to={`${index}`}>
          <div
            className={styles.container}
          >
            <img className={styles.profile} alt='' src={post.profile} />
            <p className={styles.title}>{post.title}</p>
            <p className={styles.date}>{post.date}</p>
          </div>
        </Link>
      )}
    </div>
  </div>
};

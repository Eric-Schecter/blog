import React from 'react';
import styles from './index.module.scss';
import { Link } from 'react-router-dom';
import profile from './profile.jpg';

export const Header = () => {
  return <div className={styles.header}>
    <Link to=''><img className={styles.profile} alt='' src={profile} /></Link>
  </div>
};

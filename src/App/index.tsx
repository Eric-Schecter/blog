import React from 'react';
import { Route } from 'react-router-dom';
import styles from './index.module.scss';
import { Header, Content, Catalog } from '../components';

export const App = () => {
  return <div
    className={styles.main}
  >
    <Header />
    <Route exact path='/' component={Catalog} />
    <Route path='/:id' component={Content} />
  </div>
}
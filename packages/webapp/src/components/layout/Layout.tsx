import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import styles from './Layout.module.css';

export function Layout() {
  const location = useLocation();
  const isCheckupFlow = location.pathname.startsWith('/checkup/session');
  
  return (
    <div className={styles.layout}>
      {!isCheckupFlow && <Header />}
      <main className={styles.main}>
        <Outlet />
      </main>
      {!isCheckupFlow && <BottomNav />}
      <Footer />
    </div>
  );
}


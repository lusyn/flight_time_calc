import { Link, Outlet } from 'umi';
import styles from './index.less';
import 'antd/dist/antd.css'; 

export default function Layout() {
  return (
    <div className={styles.navs}>
      <Outlet />
    </div>
  );
}

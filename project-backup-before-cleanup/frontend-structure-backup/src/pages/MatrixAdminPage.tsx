import { MatrixAdminPanel } from '@/components/admin/MatrixAdminPanel';

import RoleGuard from '@/components/RoleGuard';

const MatrixAdminPage = () => {
  return (
    <RoleGuard requiredRole={['platform_admin']}>
      <div className="container mx-auto py-6">
        <MatrixAdminPanel />
      </div>
    </RoleGuard>
  );
};

export default MatrixAdminPage;
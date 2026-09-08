import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/hooks/useAuth';
import { AtlasIntro } from '@/components/intro/AtlasIntro';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AtlasIntro>
        <Layout>
          <AppRoutes />
        </Layout>
      </AtlasIntro>
    </AuthProvider>
  );
};

export default App;

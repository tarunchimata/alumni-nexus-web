import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

export default function Health() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    // Simple health check for frontend
    setHealth({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'My School Buddies Frontend'
    });
  }, []);

  if (!health) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Frontend Health Check</h1>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}
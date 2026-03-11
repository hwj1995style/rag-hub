import { Button, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
export function NotFoundPage() { const navigate = useNavigate(); return (<Card className="page-card"><Typography.Title level={3}>Page not found</Typography.Title><Typography.Paragraph type="secondary">The route does not exist yet. Return to Documents to continue testing.</Typography.Paragraph><Button type="primary" onClick={() => navigate('/documents')}>Back to Documents</Button></Card>); }

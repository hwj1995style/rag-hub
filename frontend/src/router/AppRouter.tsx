import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DocumentChunksPage } from '../pages/DocumentChunksPage';
import { DocumentDetailPage } from '../pages/DocumentDetailPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PermissionsPage } from '../pages/PermissionsPage';
import { QaPage } from '../pages/QaPage';
import { QueryLogPage } from '../pages/QueryLogPage';
import { SearchPage } from '../pages/SearchPage';
import { TaskDetailPage } from '../pages/TaskDetailPage';
import { TasksPage } from '../pages/TasksPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
          <Route path="/documents/:documentId/chunks" element={<DocumentChunksPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/qa" element={<QaPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/query-logs/:logId" element={<QueryLogPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
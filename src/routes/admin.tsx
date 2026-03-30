import { createFileRoute, Navigate } from '@tanstack/solid-router'

export const Route = createFileRoute('/admin')({
  component: () => <Navigate to="/admin/dashboard" />,
})

import { API_VERSION, type TaskDto } from '@aureon/contracts';

export default function Page() {
  const task: TaskDto = { id: '1', title: 'Test Task', completed: false };
  return (
    <main>
      <h1>Aureon S3 Runtime Test</h1>
      <p>API Version: {API_VERSION}</p>
      <p>Task: {task.title}</p>
    </main>
  );
}

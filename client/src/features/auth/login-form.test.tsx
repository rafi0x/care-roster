import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

afterEach(() => vi.restoreAllMocks());

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret-pass');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginForm', () => {
  it('signs in and reports success', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ data: { id: '1' } }), { status: 200 }));
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await fillAndSubmit();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/login');
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ email: 'admin@example.com', password: 'secret-pass' });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows the server error and stays on the form', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }), { status: 401 }),
    );
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

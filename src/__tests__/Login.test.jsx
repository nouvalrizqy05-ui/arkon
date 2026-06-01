import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import Login from '../pages/Login';
import { ToastProvider } from '../components/Toast';

// Mocking Toast context
const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </BrowserRouter>
  );
};

test('Login page renders with essential WCAG accessibility features', () => {
  renderWithProviders(<Login />);
  
  // 1. Cek Landmarks
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  
  // 2. Cek ARIA labels on role toggle
  expect(screen.getByRole('radiogroup', { name: /pilih peran/i })).toBeInTheDocument();
  const mahasiswaBtn = screen.getByRole('radio', { name: /mahasiswa/i });
  const dosenBtn = screen.getByRole('radio', { name: /dosen/i });
  
  expect(mahasiswaBtn).toHaveAttribute('aria-checked', 'true');
  expect(dosenBtn).toHaveAttribute('aria-checked', 'false');

  // 3. Cek Input Labels & IDs (WCAG 1.3.1)
  const idInput = screen.getByLabelText(/NIM \(Nomor Induk Mahasiswa\)/i);
  expect(idInput).toBeInTheDocument();
  expect(idInput).toHaveAttribute('type', 'text');
  expect(idInput).toBeRequired();

  const passInput = screen.getByLabelText(/password/i);
  expect(passInput).toBeInTheDocument();
  expect(passInput).toHaveAttribute('type', 'password');
  expect(passInput).toBeRequired();
});

test('Login page handles role switching correctly', () => {
  renderWithProviders(<Login />);
  
  const dosenBtn = screen.getByRole('radio', { name: /dosen/i });
  fireEvent.click(dosenBtn);
  
  expect(dosenBtn).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByLabelText(/NIP \(Nomor Induk Pegawai\)/i)).toBeInTheDocument();
});

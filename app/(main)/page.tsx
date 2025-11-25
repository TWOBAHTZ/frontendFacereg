import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/accesscontrol');
  return null;
}
import { permanentRedirect } from 'next/navigation';

// The homepage moved to "/"; keep the old URL working.
export default function LandingRedirect() {
  permanentRedirect('/');
}

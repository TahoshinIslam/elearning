import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Unknown API paths answer JSON (not the HTML 404 page), for every method.
const notFound = () => NextResponse.json({ error: 'not_found' }, { status: 404 });
export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE };

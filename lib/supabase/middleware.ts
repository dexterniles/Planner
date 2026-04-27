import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const AUTH_USER_ID_HEADER = "x-auth-user-id";
export const AUTH_USER_EMAIL_HEADER = "x-auth-user-email";

export async function updateSession(request: NextRequest) {
  request.headers.delete(AUTH_USER_ID_HEADER);
  request.headers.delete(AUTH_USER_EMAIL_HEADER);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    request.headers.set(AUTH_USER_ID_HEADER, user.id);
    if (user.email) {
      request.headers.set(AUTH_USER_EMAIL_HEADER, user.email);
    }
    const refreshed = NextResponse.next({ request });
    response.cookies.getAll().forEach((cookie) => {
      refreshed.cookies.set(cookie);
    });
    response = refreshed;
  }

  return { user, response };
}

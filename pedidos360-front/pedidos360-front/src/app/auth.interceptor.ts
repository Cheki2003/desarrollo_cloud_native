import { HttpInterceptorFn } from '@angular/common/http';
import { fetchAuthSession } from 'aws-amplify/auth';
import { catchError, from, switchMap } from 'rxjs';

const apiGatewayUrl = 'https://qftpn0meq9.execute-api.us-east-1.amazonaws.com/';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Do not send the Cognito token to external assets or unrelated APIs.
  if (!req.url.startsWith(apiGatewayUrl)) {
    return next(req);
  }

  return from(fetchAuthSession()).pipe(
    switchMap(session => {
      const token = session.tokens?.accessToken?.toString();

      if (!token) {
        return next(req);
      }

      const requestConToken = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next(requestConToken);
    }),
    // A request made before a session exists must behave as an unauthenticated request.
    catchError(() => next(req))
  );
};

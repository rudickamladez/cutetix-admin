import { HttpInterceptorFn } from '@angular/common/http';
import { StorageKeys } from '../tokens/storage.tokens';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const access_token = localStorage.getItem(StorageKeys.ACCESS_TOKEN);
    const cloned = access_token
        ? req.clone({
            setHeaders: { Authorization: `Bearer ${access_token}` },
            withCredentials: true, // should be true when using cookies/CSRF
        })
        : req.clone({ withCredentials: true });

    return next(cloned);
};

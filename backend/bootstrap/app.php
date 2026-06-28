<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanctum: stateful API untuk frontend yang pakai cookie/token.
        $middleware->statefulApi();

        // Alias middleware
        $middleware->alias([
            'subscription' => \App\Http\Middleware\CheckSubscription::class,
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Force JSON response untuk request API (route /api/*).
        // Sehingga error 401/404/422 selalu JSON, bukan HTML.
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            if ($request->is('api/*')) {
                return true;
            }
            return $request->expectsJson();
        });

        // FIX: Aplikasi ini API-only — TIDAK ada named route 'login'.
        // Default, middleware Authenticate memanggil route('login') saat token
        // invalid/absent. Karena route 'login' tak terdefinisi, lempar
        // RouteNotFoundException (500) — padahal seharusnya cukup 401.
        //
        // Tangani kedua exception ini: kembalikan 401 JSON bersih untuk request
        // API, agar frontend bisa memproses error autentikasi (redirect ke
        // /login sendiri, tidak crash panel).
        $unauthenticatedJson = function (Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return null; // null = biarkan default handler (web).
        };

        $exceptions->render(function (AuthenticationException $e, Request $request) use ($unauthenticatedJson) {
            return $unauthenticatedJson($request);
        });

        $exceptions->render(function (RouteNotFoundException $e, Request $request) use ($unauthenticatedJson) {
            // Hanya anggap sebagai error auth bila memang request ke API terlindungi.
            // RouteNotFoundException lain (route betul-betul hilang) tetap ditangani default.
            return $unauthenticatedJson($request);
        });
    })->create();

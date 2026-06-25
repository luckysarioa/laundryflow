<?php

namespace App\Http\Middleware;

use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

class EncryptCookies extends Middleware
{
    /**
     * Nama cookie yang tidak boleh dienkripsi.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];
}

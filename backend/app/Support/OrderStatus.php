<?php

namespace App\Support;

/**
 * Enum alur status cucian (PRD poin 5).
 * Urutan = urutan tahapan: Antrian → Cuci → Setrika → Siap → Diambil.
 */
enum OrderStatus: string
{
    case Antrian = 'antrian';
    case Cuci = 'cuci';
    case Setrika = 'setrika';
    case Siap = 'siap';
    case Diambil = 'diambil';

    /**
     * Daftar urutan lengkap.
     *
     * @return OrderStatus[]
     */
    public static function flow(): array
    {
        return [
            self::Antrian,
            self::Cuci,
            self::Setrika,
            self::Siap,
            self::Diambil,
        ];
    }

    /** Status yang dianggap masih diproses (belum diambil). */
    public static function active(): array
    {
        return [self::Antrian, self::Cuci, self::Setrika, self::Siap];
    }

    /** Status berikutnya dalam alur, atau null jika sudah di akhir. */
    public static function next(string $current): ?OrderStatus
    {
        $flow = self::flow();
        foreach ($flow as $i => $status) {
            if ($status->value === $current && isset($flow[$i + 1])) {
                return $flow[$i + 1];
            }
        }
        return null;
    }

    /** Label tampilan. */
    public function label(): string
    {
        return match ($this) {
            self::Antrian => 'Antrian',
            self::Cuci => 'Cuci',
            self::Setrika => 'Setrika',
            self::Siap => 'Siap Diambil',
            self::Diambil => 'Diambil',
        };
    }
}

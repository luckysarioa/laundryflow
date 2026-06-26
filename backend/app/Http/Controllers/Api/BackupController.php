<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    /**
     * GET /backups — List available backups.
     */
    public function index()
    {
        $backups = [];
        $disk = Storage::disk('backups');

        if ($disk->exists('')) {
            $files = $disk->files('backups');
            foreach ($files as $file) {
                $backups[] = [
                    'name' => basename($file),
                    'path' => $file,
                    'size' => $disk->size($file),
                    'date' => date('Y-m-d H:i:s', $disk->lastModified($file)),
                ];
            }
        }

        // Sort by date descending
        usort($backups, fn($a, $b) => strcmp($b['date'], $a['date']));

        return response()->json($backups);
    }

    /**
     * POST /backups — Create new backup.
     */
    public function store()
    {
        $filename = 'backup-' . now()->format('Y-m-d-His') . '.sql';
        $path = "backups/{$filename}";

        try {
            // Create backup directory if not exists
            $backupPath = storage_path('app/backups');
            if (!is_dir($backupPath)) {
                mkdir($backupPath, 0755, true);
            }

            // Get database config
            $dbConfig = config('database.connections.mysql');
            $host = $dbConfig['host'] ?? 'localhost';
            $port = $dbConfig['port'] ?? 3306;
            $database = $dbConfig['database'] ?? 'laundryflow';
            $username = $dbConfig['username'] ?? 'root';
            $password = $dbConfig['password'] ?? '';

            // Build mysqldump command
            $command = sprintf(
                'mysqldump -h %s -P %d -u %s %s > %s 2>&1',
                escapeshellarg($host),
                $port,
                escapeshellarg($username),
                escapeshellarg($database),
                escapeshellarg($backupPath . '/' . $filename)
            );

            if (!empty($password)) {
                $command = sprintf(
                    'mysqldump -h %s -P %d -u %s -p%s %s > %s 2>&1',
                    escapeshellarg($host),
                    $port,
                    escapeshellarg($username),
                    escapeshellarg($password),
                    escapeshellarg($database),
                    escapeshellarg($backupPath . '/' . $filename)
                );
            }

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                // Fallback: create a simple SQL export using Laravel
                return $this->createLaravelBackup($filename);
            }

            $fullPath = $backupPath . '/' . $filename;
            $size = filesize($fullPath);

            return response()->json([
                'message' => 'Backup berhasil dibuat.',
                'backup' => [
                    'name' => $filename,
                    'size' => $size,
                    'date' => now()->format('Y-m-d H:i:s'),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat backup: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create backup using Laravel (without mysqldump).
     */
    private function createLaravelBackup(string $filename)
    {
        $tables = \DB::select('SHOW TABLES');
        $dbName = \DB::getDatabaseName();
        $sql = "-- Backup LaundryFlow\n-- Date: " . now()->format('Y-m-d H:i:s') . "\n-- Database: {$dbName}\n\n";

        foreach ($tables as $table) {
            $tableName = $table->{"Tables_in_{$dbName}"};

            // Get create table statement
            $createTable = \DB::select("SHOW CREATE TABLE {$tableName}");
            $sql .= "-- Table: {$tableName}\n";
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
            $sql .= $createTable[0]->{'Create Table'} . ";\n\n";

            // Get data
            $rows = \DB::table($tableName)->get();
            foreach ($rows as $row) {
                $values = array_map(function ($value) {
                    if ($value === null) return 'NULL';
                    return "'" . addslashes($value) . "'";
                }, (array) $row);

                $sql .= "INSERT INTO `{$tableName}` VALUES (" . implode(', ', $values) . ");\n";
            }
            $sql .= "\n";
        }

        $backupPath = storage_path('app/backups');
        if (!is_dir($backupPath)) {
            mkdir($backupPath, 0755, true);
        }

        file_put_contents($backupPath . '/' . $filename, $sql);

        return response()->json([
            'message' => 'Backup berhasil dibuat (Laravel mode).',
            'backup' => [
                'name' => $filename,
                'size' => strlen($sql),
                'date' => now()->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * GET /backups/{filename}/download — Download backup file.
     */
    public function download(string $filename)
    {
        $path = "backups/{$filename}";

        if (!Storage::disk('backups')->exists($path)) {
            return response()->json(['message' => 'File backup tidak ditemukan.'], 404);
        }

        return Storage::disk('backups')->download($path, $filename);
    }

    /**
     * DELETE /backups/{filename} — Delete backup file.
     */
    public function destroy(string $filename)
    {
        $path = "backups/{$filename}";

        if (!Storage::disk('backups')->exists($path)) {
            return response()->json(['message' => 'File backup tidak ditemukan.'], 404);
        }

        Storage::disk('backups')->delete($path);

        return response()->json(['message' => 'Backup berhasil dihapus.']);
    }
}

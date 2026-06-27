<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class SuperAdminBackupController extends Controller
{
    private string $backupPath;

    public function __construct()
    {
        $this->backupPath = storage_path('app/backups');
    }

    /**
     * List all backup files.
     */
    public function index(): JsonResponse
    {
        if (!File::isDirectory($this->backupPath)) {
            return response()->json([]);
        }

        $files = File::files($this->backupPath);
        $backups = collect($files)
            ->filter(fn ($f) => $f->getExtension() === 'sql')
            ->map(fn ($f) => [
                'name' => $f->getFilename(),
                'size' => $f->getSize(),
                'date' => date('Y-m-d H:i:s', $f->getMTime()),
            ])
            ->sortByDesc('date')
            ->values()
            ->toArray();

        return response()->json($backups);
    }

    /**
     * Create a new backup of the entire database.
     */
    public function store(): JsonResponse
    {
        $filename = 'system-backup-' . date('Y-m-d-His') . '.sql';
        $path = $this->backupPath . '/' . $filename;

        if (!File::isDirectory($this->backupPath)) {
            File::makeDirectory($this->backupPath, 0755, true);
        }

        // Try mysqldump first.
        $dbHost = env('DB_HOST', 'db');
        $dbPort = env('DB_PORT', '3306');
        $dbName = env('DB_DATABASE', 'laundryflow');
        $dbUser = env('DB_USERNAME', 'root');
        $dbPass = env('DB_PASSWORD', '');

        $cmd = sprintf(
            'mysqldump -h %s -P %s -u %s %s%s > %s 2>&1',
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            escapeshellarg($dbName),
            $dbPass ? ' -p' . escapeshellarg($dbPass) : '',
            escapeshellarg($path)
        );

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !File::exists($path)) {
            // Fallback: Laravel-based backup.
            $this->laravelBackup($path);
        }

        return response()->json([
            'message' => 'Backup created successfully.',
            'backup' => [
                'name' => $filename,
                'size' => File::size($path),
                'date' => date('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Download a backup file.
     */
    public function download(string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $path = $this->backupPath . '/' . basename($filename);

        if (!File::exists($path)) {
            abort(404, 'Backup not found.');
        }

        return response()->download($path);
    }

    /**
     * Restore the database from a backup file.
     */
    public function restore(string $filename): JsonResponse
    {
        $path = $this->backupPath . '/' . basename($filename);

        if (!File::exists($path)) {
            return response()->json(['message' => 'Backup not found.'], 404);
        }

        $dbHost = env('DB_HOST', 'db');
        $dbPort = env('DB_PORT', '3306');
        $dbName = env('DB_DATABASE', 'laundryflow');
        $dbUser = env('DB_USERNAME', 'root');
        $dbPass = env('DB_PASSWORD', '');

        $cmd = sprintf(
            'mysql -h %s -P %s -u %s %s%s < %s 2>&1',
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            escapeshellarg($dbName),
            $dbPass ? ' -p' . escapeshellarg($dbPass) : '',
            escapeshellarg($path)
        );

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0) {
            return response()->json([
                'message' => 'Restore failed.',
                'error' => implode("\n", $output),
            ], 500);
        }

        return response()->json(['message' => 'Database restored successfully.']);
    }

    /**
     * Delete a backup file.
     */
    public function destroy(string $filename): JsonResponse
    {
        $path = $this->backupPath . '/' . basename($filename);

        if (!File::exists($path)) {
            return response()->json(['message' => 'Backup not found.'], 404);
        }

        File::delete($path);

        return response()->json(['message' => 'Backup deleted successfully.']);
    }

    /**
     * Laravel-based fallback backup (generates SQL from all tables).
     */
    private function laravelBackup(string $path): void
    {
        $tables = \DB::select('SHOW TABLES');
        $dbName = \DB::getDatabaseName();
        $sql = "-- LaundryFlow System Backup\n-- Date: " . date('Y-m-d H:i:s') . "\n\n";

        foreach ($tables as $table) {
            $tableName = $table->{"Tables_in_{$dbName}"};
            $rows = \DB::select("SELECT * FROM `{$tableName}`");
            $columns = \DB::getSchemaBuilder()->getColumnListing($tableName);

            if (empty($rows)) continue;

            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
            $createTable = \DB::select("SHOW CREATE TABLE `{$tableName}`");
            $sql .= $createTable[0]->{'Create Table'} . ";\n\n";

            foreach ($rows as $row) {
                $values = array_map(function ($col) use ($row) {
                    $val = $row->$col;
                    if ($val === null) return 'NULL';
                    return "'" . addslashes($val) . "'";
                }, $columns);

                $sql .= "INSERT INTO `{$tableName}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
            }
            $sql .= "\n";
        }

        File::put($path, $sql);
    }
}
